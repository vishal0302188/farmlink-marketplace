import logging
from typing import Generator, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# Normalize connection string if needed (e.g. postgresql:// -> postgresql+psycopg2:// or postgresql+psycopg://)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = None
SessionLocal = None

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info(f"Database engine created for destination: {settings.masked_database_url}")
except Exception as exc:
    logger.error(
        f"Failed to initialize database engine for {settings.masked_database_url}: {type(exc).__name__}: {str(exc)}"
    )
    engine = None
    SessionLocal = None


def check_db_connection() -> Tuple[bool, str]:
    """
    Verifies if the PostgreSQL database is reachable.
    Returns (is_connected: bool, status_message: str).
    Does not log or expose raw passwords.
    """
    if engine is None or SessionLocal is None:
        return (
            False,
            f"Database engine is not initialized. Ensure DATABASE_URL is valid in your .env file."
        )

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return (True, "PostgreSQL connection active and operational.")
    except OperationalError as op_err:
        # Sanitize error message to avoid printing passwords if any driver leaks them
        err_msg = str(op_err).split("\n")[0]
        return (
            False,
            f"PostgreSQL connection failed: {err_msg}. Verify your database server is running and credentials in .env are correct."
        )
    except Exception as exc:
        return (
            False,
            f"Database connectivity check encountered an error: {type(exc).__name__}."
        )


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that yields a database session.
    If database engine cannot be initialized or is unreachable, raises RuntimeError.
    Does NOT silently fall back to SQLite.
    """
    if SessionLocal is None:
        raise RuntimeError(
            f"PostgreSQL database session is unavailable. Check DATABASE_URL configuration in .env."
        )

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
