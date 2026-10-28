#!/usr/bin/env python3
"""
FarmLink Local Development Admin Provisioning Script.

Usage:
    python scripts/create_admin.py --email admin@farmlink.org --password MySecurePass123! --name "FarmLink Administrator"

Or via environment variables:
    $env:ADMIN_EMAIL="admin@farmlink.org"
    $env:ADMIN_PASSWORD="MySecurePass123!"
    python scripts/create_admin.py

Security Note:
    - This script is intended strictly for local development and initial staging provisioning.
    - It hashes all passwords via bcrypt before persisting to PostgreSQL.
    - Passwords are never logged or echoed to stdout.
"""

import sys
import os
import argparse
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.security import get_password_hash
from app.core.database import SessionLocal
from app.models.user import User, UserRole


def provision_admin(email: str, password: str, full_name: str) -> None:
    if not email or "@" not in email:
        print("[ERROR] A valid email address is required.")
        sys.exit(1)

    if not password or len(password) < 8:
        print("[ERROR] Password must be at least 8 characters long.")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.strip().lower()).first()

        hashed_pw = get_password_hash(password)

        if user:
            print(f"[INFO] Existing user '{user.email}' found. Promoting to Administrator...")
            user.role = UserRole.ADMIN
            user.hashed_password = hashed_pw
            user.is_active = True
            user.is_verified = True
            if full_name:
                user.full_name = full_name
            db.commit()
            print(f"[SUCCESS] User '{user.email}' successfully promoted to Administrator (User ID: {user.id}).")
        else:
            print(f"[INFO] Creating new Administrator account for '{email.strip().lower()}'...")
            new_admin = User(
                email=email.strip().lower(),
                hashed_password=hashed_pw,
                full_name=full_name or "FarmLink Administrator",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                location="Regional FarmLink Hub",
            )
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)
            print(f"[SUCCESS] Administrator '{new_admin.email}' successfully provisioned (User ID: {new_admin.id}).")

    except Exception as exc:
        db.rollback()
        print(f"[ERROR] Failed to provision administrator: {exc}")
        sys.exit(1)
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="FarmLink Admin Provisioning Tool")
    parser.add_argument("--email", default=os.getenv("ADMIN_EMAIL", "admin@farmlink.org"), help="Admin email address")
    parser.add_argument("--password", default=os.getenv("ADMIN_PASSWORD", "FarmLinkAdmin2026!"), help="Admin password")
    parser.add_argument("--name", default=os.getenv("ADMIN_NAME", "FarmLink Administrator"), help="Admin full name")

    args = parser.parse_args()
    provision_admin(args.email, args.password, args.name)


if __name__ == "__main__":
    main()
