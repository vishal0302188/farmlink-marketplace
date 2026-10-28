from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.product import ListingStatus
from app.models.order import OrderStatus
from app.schemas.user import UserRead
from app.schemas.product import ProductRead
from app.schemas.order import OrderRead


class AdminDashboardMetrics(BaseModel):
    total_farmers: int
    total_buyers: int
    active_products: int
    pending_moderation_products: int
    total_orders: int
    completed_orders: int
    recent_orders: List[OrderRead]
    recent_users: List[UserRead]


class ProductModerationUpdate(BaseModel):
    listing_status: ListingStatus
    moderation_reason: Optional[str] = Field(None, description="Reason for moderation decision")
    is_active: Optional[bool] = None


class UserStatusUpdate(BaseModel):
    is_active: bool
    notes: Optional[str] = None


class AdminUserRead(UserRead):
    product_count: int = 0
    buyer_order_count: int = 0
    farmer_order_count: int = 0


class AdminOrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None
