import os
import re
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "FarmLink API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database connection string
    # In production, this must be supplied via the DATABASE_URL environment variable.
    DATABASE_URL: Optional[str] = Field(
        default=None,
        description="PostgreSQL connection string. Example: postgresql://user:password@host:5432/farmlink_db"
    )

    # JWT Authentication
    SECRET_KEY: str = Field(
        default="insecure_default_key_replace_in_production_environment",
        description="Secret key for signing JWT tokens"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # CORS origins
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        """
        Determines whether the application is running in a production environment
        (via ENVIRONMENT setting or cloud host runtime environment variables).
        """
        env = self.ENVIRONMENT.lower().strip()
        is_cloud = bool(
            os.getenv("VERCEL")
            or os.getenv("RENDER")
            or os.getenv("RAILWAY_ENVIRONMENT")
            or os.getenv("FLY_APP_NAME")
            or os.getenv("HEROKU_APP_NAME")
        )
        return env in ("production", "prod", "staging") or is_cloud

    @property
    def masked_database_url(self) -> str:
        """
        Returns the database URL with the password sanitized for safe logging.
        """
        if not self.DATABASE_URL:
            return ""
        # Match :password@ in the URI and replace with :****@
        return re.sub(r":([^:@]+)@", r":****@", self.DATABASE_URL)

    @model_validator(mode="after")
    def validate_database_url(self) -> "Settings":
        db_url = self.DATABASE_URL
        if self.is_production:
            if not db_url or not db_url.strip():
                raise ValueError(
                    "DATABASE_URL environment variable is required in production. "
                    "Please configure a valid PostgreSQL connection string in your deployment environment variables."
                )
            if any(host in db_url.lower() for host in ("localhost", "127.0.0.1", "::1", "0.0.0.0")):
                raise ValueError(
                    f"Invalid DATABASE_URL for production: Database URL targets a local address ({self.masked_database_url}). "
                    "Production must use a hosted/remote PostgreSQL database instance."
                )
        else:
            # In local development, if no DATABASE_URL was provided in .env or environment,
            # fall back to local PostgreSQL default
            if not db_url or not db_url.strip():
                self.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/farmlink_db"
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
