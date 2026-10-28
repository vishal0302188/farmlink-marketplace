import re
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "FarmLink API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database connection string
    # Must be supplied via environment variable or .env file
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/farmlink_db",
        description="PostgreSQL connection string. Example: postgresql://user:password@localhost:5432/farmlink_db"
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
    def masked_database_url(self) -> str:
        """
        Returns the database URL with the password sanitized for safe logging.
        """
        if not self.DATABASE_URL:
            return ""
        # Match :password@ in the URI and replace with :****@
        return re.sub(r":([^:@]+)@", r":****@", self.DATABASE_URL)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
