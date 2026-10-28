import pytest
from app.core.database import check_db_connection, engine
from sqlalchemy import text


def test_postgres_live_connection_or_skip():
    """
    Live PostgreSQL integration test.
    If PostgreSQL is unreachable or credentials in .env are not yet configured,
    skips cleanly without failing the offline test suite.
    """
    is_connected, msg = check_db_connection()
    if not is_connected:
        pytest.skip(f"Live PostgreSQL server is not configured or not reachable: {msg}")

    # If connected, verify query execution
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1 AS alive"))
        row = result.fetchone()
        assert row[0] == 1
