"""0001 Initial FarmLink schema for users, products, orders, and order_items

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-28 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create USERS table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("farmer", "buyer", "admin", name="user_role_enum"),
            nullable=False,
            server_default="buyer",
        ),
        sa.Column(
            "buyer_type",
            sa.Enum(
                "household",
                "restaurant",
                "retailer",
                "wholesaler",
                "company",
                "institution",
                name="buyer_type_enum",
            ),
            nullable=True,
        ),
        sa.Column("phone_number", sa.String(length=50), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("district", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("pincode", sa.String(length=20), nullable=True),
        sa.Column("organization_name", sa.String(length=255), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # 2. Create PRODUCTS table
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("farmer_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "vegetables",
                "fruits",
                "grains_pulses",
                "dairy_eggs",
                "herbs_spices",
                "specialty",
                name="product_category_enum",
            ),
            nullable=False,
        ),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "unit",
            sa.Enum("kg", "quintal", "ton", "crate", "litre", "piece", name="unit_type_enum"),
            nullable=False,
            server_default="kg",
        ),
        sa.Column("available_quantity", sa.Numeric(precision=10, scale=2), nullable=False, server_default="0.00"),
        sa.Column("minimum_order_quantity", sa.Numeric(precision=10, scale=2), nullable=False, server_default="1.00"),
        sa.Column("growing_location", sa.String(length=255), nullable=False),
        sa.Column("harvest_date", sa.DateTime(), nullable=True),
        sa.Column("is_organic", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column(
            "listing_status",
            sa.Enum("pending", "active", "rejected", "archived", name="listing_status_enum"),
            nullable=False,
            server_default="active",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("price >= 0", name="check_product_price_non_negative"),
        sa.CheckConstraint("available_quantity >= 0", name="check_product_available_qty_non_negative"),
        sa.CheckConstraint("minimum_order_quantity > 0", name="check_product_min_order_qty_positive"),
        sa.ForeignKeyConstraint(["farmer_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_products_id"), "products", ["id"], unique=False)
    op.create_index(op.f("ix_products_farmer_id"), "products", ["farmer_id"], unique=False)
    op.create_index(op.f("ix_products_name"), "products", ["name"], unique=False)
    op.create_index(op.f("ix_products_category"), "products", ["category"], unique=False)
    op.create_index(op.f("ix_products_growing_location"), "products", ["growing_location"], unique=False)
    op.create_index(op.f("ix_products_listing_status"), "products", ["listing_status"], unique=False)

    # 3. Create ORDERS table (single farmer per order)
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("buyer_id", sa.Integer(), nullable=False),
        sa.Column("farmer_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "confirmed", "dispatched", "delivered", "cancelled", name="order_status_enum"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"),
        sa.Column(
            "fulfillment_method",
            sa.Enum(
                "farm_gate_pickup",
                "temperature_controlled_freight",
                "regional_hub_dispatch",
                "direct_local_delivery",
                name="fulfillment_method_enum",
            ),
            nullable=False,
            server_default="temperature_controlled_freight",
        ),
        sa.Column("delivery_address", sa.Text(), nullable=True),
        sa.Column("delivery_city", sa.String(length=100), nullable=True),
        sa.Column("delivery_state", sa.String(length=100), nullable=True),
        sa.Column("delivery_pincode", sa.String(length=20), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("total_amount >= 0", name="check_order_total_amount_non_negative"),
        sa.ForeignKeyConstraint(["buyer_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["farmer_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_orders_id"), "orders", ["id"], unique=False)
    op.create_index(op.f("ix_orders_buyer_id"), "orders", ["buyer_id"], unique=False)
    op.create_index(op.f("ix_orders_farmer_id"), "orders", ["farmer_id"], unique=False)
    op.create_index(op.f("ix_orders_status"), "orders", ["status"], unique=False)

    # 4. Create ORDER_ITEMS table
    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("unit_price_at_purchase", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("subtotal", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("quantity > 0", name="check_order_item_qty_positive"),
        sa.CheckConstraint("unit_price_at_purchase >= 0", name="check_order_item_unit_price_non_negative"),
        sa.CheckConstraint("subtotal >= 0", name="check_order_item_subtotal_non_negative"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_order_items_id"), "order_items", ["id"], unique=False)
    op.create_index(op.f("ix_order_items_order_id"), "order_items", ["order_id"], unique=False)
    op.create_index(op.f("ix_order_items_product_id"), "order_items", ["product_id"], unique=False)


def downgrade() -> None:
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("products")
    op.drop_table("users")

    # Drop enum types in PostgreSQL
    bind = op.get_bind()
    if bind.engine.name == "postgresql":
        sa.Enum(name="fulfillment_method_enum").drop(bind, checkfirst=True)
        sa.Enum(name="order_status_enum").drop(bind, checkfirst=True)
        sa.Enum(name="listing_status_enum").drop(bind, checkfirst=True)
        sa.Enum(name="unit_type_enum").drop(bind, checkfirst=True)
        sa.Enum(name="product_category_enum").drop(bind, checkfirst=True)
        sa.Enum(name="buyer_type_enum").drop(bind, checkfirst=True)
        sa.Enum(name="user_role_enum").drop(bind, checkfirst=True)
