import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    Enum,
    ForeignKey,
    Text,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    READY = "ready"
    DISPATCHED = "dispatched"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class FulfillmentMethod(str, enum.Enum):
    FARM_GATE_PICKUP = "farm_gate_pickup"
    TEMPERATURE_CONTROLLED_FREIGHT = "temperature_controlled_freight"
    REGIONAL_HUB_DISPATCH = "regional_hub_dispatch"
    DIRECT_LOCAL_DELIVERY = "direct_local_delivery"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    
    # Single farmer per order architecture
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    status = Column(
        Enum(OrderStatus, name="order_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=OrderStatus.PENDING,
        index=True
    )
    
    total_amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    fulfillment_method = Column(
        Enum(FulfillmentMethod, name="fulfillment_method_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=FulfillmentMethod.TEMPERATURE_CONTROLLED_FREIGHT
    )
    payment_method = Column(String(50), nullable=True, default="cash_on_delivery")
    
    # Destination & Receiving Details
    delivery_address = Column(Text, nullable=True)
    delivery_city = Column(String(100), nullable=True)
    delivery_state = Column(String(100), nullable=True)
    delivery_pincode = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("total_amount >= 0", name="check_order_total_amount_non_negative"),
    )

    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="buyer_orders")
    farmer = relationship("User", foreign_keys=[farmer_id], back_populates="farmer_orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)

    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price_at_purchase = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_order_item_qty_positive"),
        CheckConstraint("unit_price_at_purchase >= 0", name="check_order_item_unit_price_non_negative"),
        CheckConstraint("subtotal >= 0", name="check_order_item_subtotal_non_negative"),
    )

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
