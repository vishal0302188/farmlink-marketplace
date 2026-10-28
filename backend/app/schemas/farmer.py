from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.product import ProductRead
from app.schemas.order import OrderRead


class StockUpdate(BaseModel):
    available_quantity: float = Field(..., ge=0, description="Updated available inventory volume")


class FarmerDashboardStats(BaseModel):
    total_active_listings: int
    total_available_inventory: float
    incoming_orders_count: int
    total_completed_orders: int
    total_revenue: float
    pending_revenue: float
    recent_products: List[ProductRead]
    incoming_orders: List[OrderRead]
