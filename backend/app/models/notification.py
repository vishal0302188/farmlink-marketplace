import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Index,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class NotificationType(str, enum.Enum):
    ORDER_CREATED = "order_created"
    ORDER_ACCEPTED = "order_accepted"
    ORDER_REJECTED = "order_rejected"
    ORDER_READY = "order_ready"
    ORDER_COMPLETED = "order_completed"
    ORDER_CANCELLED = "order_cancelled"
    ORDER_STATUS_UPDATED = "order_status_updated"
    PRODUCT_APPROVED = "product_approved"
    PRODUCT_REJECTED = "product_rejected"
    SYSTEM_ALERT = "system_alert"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False, default=NotificationType.SYSTEM_ALERT.value, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    is_read = Column(Boolean, nullable=False, default=False, server_default="false", index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    read_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_notifications_recipient_is_read", "recipient_id", "is_read"),
        Index("ix_notifications_recipient_created_at", "recipient_id", "created_at"),
    )

    # Relationships
    recipient = relationship("User", back_populates="notifications")
    order = relationship("Order", foreign_keys=[order_id])
