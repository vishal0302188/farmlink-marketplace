"""0003 Add moderation_reason, payment_method, and updated order statuses

Revision ID: 0003_schema_parity
Revises: 0002_notifications_table
Create Date: 2026-10-29 16:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = "0003_schema_parity"
down_revision: Union[str, None] = "0002_notifications_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)

    # 1. Add moderation_reason to products if not present
    product_cols = [c["name"] for c in inspector.get_columns("products")]
    if "moderation_reason" not in product_cols:
        op.add_column("products", sa.Column("moderation_reason", sa.Text(), nullable=True))

    # 2. Add payment_method to orders if not present
    order_cols = [c["name"] for c in inspector.get_columns("orders")]
    if "payment_method" not in order_cols:
        op.add_column(
            "orders",
            sa.Column("payment_method", sa.String(length=50), nullable=True, server_default="cash_on_delivery"),
        )

    # 3. Add new order statuses to order_status_enum in PostgreSQL
    # PostgreSQL requires ALTER TYPE ... ADD VALUE outside of a standard multi-statement transaction or with IF NOT EXISTS
    if conn.dialect.name == "postgresql":
        for val in ["ready", "completed", "rejected"]:
            try:
                op.execute(sa.text(f"ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS '{val}'"))
            except Exception:
                pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)

    order_cols = [c["name"] for c in inspector.get_columns("orders")]
    if "payment_method" in order_cols:
        op.drop_column("orders", "payment_method")

    product_cols = [c["name"] for c in inspector.get_columns("products")]
    if "moderation_reason" in product_cols:
        op.drop_column("products", "moderation_reason")
