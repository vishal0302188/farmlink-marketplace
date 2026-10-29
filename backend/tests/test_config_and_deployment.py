import os
import pytest
from pydantic import ValidationError
from app.core.config import Settings
import email_validator


def test_email_validator_installed_and_functional():
    """Verify that email-validator is installed and can validate emails."""
    result = email_validator.validate_email("test@example.com", check_deliverability=False)
    assert result.normalized == "test@example.com"


def test_production_fails_when_database_url_is_missing():
    """Verify that production fails with clear error when DATABASE_URL is missing."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="",
            _env_file=None,
        )
    err_msg = str(exc_info.value)
    assert "DATABASE_URL environment variable is required in production" in err_msg


def test_production_fails_when_database_url_targets_localhost():
    """Verify that production fails clearly when DATABASE_URL targets localhost or 127.0.0.1."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://postgres:secret123@localhost:5432/farmlink_db",
            _env_file=None,
        )
    err_msg = str(exc_info.value)
    assert "Invalid DATABASE_URL for production: Database URL targets a local address" in err_msg
    # Ensure raw secret is not leaked in exception message
    assert "secret123" not in err_msg
    assert "****" in err_msg


def test_production_fails_when_database_url_targets_127_0_0_1():
    """Verify that production fails clearly when DATABASE_URL targets 127.0.0.1."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://farmlink:secret123@127.0.0.1:5432/farmlink_db",
            _env_file=None,
        )
    err_msg = str(exc_info.value)
    assert "Invalid DATABASE_URL for production: Database URL targets a local address" in err_msg
    assert "secret123" not in err_msg


def test_production_accepts_valid_remote_database_url():
    """Verify that production accepts a valid remote/hosted PostgreSQL database URL."""
    remote_url = "postgresql://prod_user:mypassword123@db.aws.neon.tech:5432/farmlink_prod"
    settings = Settings(
        ENVIRONMENT="production",
        DATABASE_URL=remote_url,
        _env_file=None,
    )
    assert settings.DATABASE_URL == remote_url
    assert "mypassword123" not in settings.masked_database_url
    assert "prod_user:****@db.aws.neon.tech:5432/farmlink_prod" in settings.masked_database_url


def test_development_allows_default_database_url():
    """Verify that local development safely uses default PostgreSQL connection string if unset."""
    settings = Settings(
        ENVIRONMENT="development",
        DATABASE_URL="",
        _env_file=None,
    )
    assert settings.DATABASE_URL == "postgresql://postgres:postgres@localhost:5432/farmlink_db"


def test_masked_database_url_masks_password():
    """Ensure masked_database_url sanitizes password regardless of environment."""
    settings = Settings(
        ENVIRONMENT="development",
        DATABASE_URL="postgresql://farmlink_user:SuperSecretPassword!@localhost:5433/farmlink_db",
        _env_file=None,
    )
    assert "SuperSecretPassword!" not in settings.masked_database_url
    assert "farmlink_user:****@localhost:5433/farmlink_db" in settings.masked_database_url
