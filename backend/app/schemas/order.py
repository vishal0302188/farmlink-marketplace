from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.order import OrderStatus, FulfillmentMethod
from app.schemas.product import ProductRead
from app.schemas.user import UserRead


class OrderItemBase(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0, description="Order quantity - must be positive")


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemRead(OrderItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    unit_price_at_purchase: float
    subtotal: float
    created_at: datetime
    product: Optional[ProductRead] = None


class OrderBase(BaseModel):
    farmer_id: Optional[int] = Field(None, description="Target farmer ID (single farmer per order, or derived from product)")
    fulfillment_method: FulfillmentMethod = FulfillmentMethod.TEMPERATURE_CONTROLLED_FREIGHT
    payment_method: Optional[str] = Field("cash_on_delivery", description="Simulated payment method")
    delivery_address: Optional[str] = None
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_pincode: Optional[str] = None
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items for this farmer's order")


class OrderCheckoutItem(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0, description="Order quantity")


class OrderCheckoutRequest(BaseModel):
    items: List[OrderCheckoutItem] = Field(..., min_length=1, description="List of all items to checkout")
    fulfillment_method: FulfillmentMethod = FulfillmentMethod.TEMPERATURE_CONTROLLED_FREIGHT
    payment_method: Optional[str] = "cash_on_delivery"
    delivery_address: Optional[str] = None
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_pincode: Optional[str] = None
    notes: Optional[str] = None


class OrderRead(OrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    buyer_id: int
    farmer_id: int
    status: OrderStatus
    total_amount: float
    payment_method: Optional[str] = "cash_on_delivery"
    created_at: datetime
    updated_at: datetime
    buyer: Optional[UserRead] = None
    farmer: Optional[UserRead] = None
    items: List[OrderItemRead] = []


class CheckoutResponse(BaseModel):
    orders: List[OrderRead]
    total_orders_placed: int
    grand_total: float


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None


class OrderCancellationRequest(BaseModel):
    notes: Optional[str] = None
