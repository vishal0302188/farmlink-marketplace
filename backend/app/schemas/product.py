from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, model_validator, ConfigDict
from app.models.product import ProductCategory, UnitType, ListingStatus
from app.schemas.user import UserRead


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Produce name")
    description: str = Field(..., min_length=5, description="Produce description and specifications")
    category: ProductCategory
    price: float = Field(..., gt=0, description="Unit price (INR) - must be greater than 0")
    unit: UnitType = UnitType.KG
    available_quantity: float = Field(..., ge=0, description="Available stock quantity - non-negative")
    minimum_order_quantity: float = Field(default=1.0, gt=0, description="Minimum order lot - must be greater than 0")
    growing_location: str = Field(..., min_length=2, max_length=255, description="Origin farm district/region")
    harvest_date: Optional[datetime] = None
    is_organic: bool = Field(default=False, description="Flag for natural/organic farming practices")
    image_url: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def handle_field_aliases(cls, data: dict):
        if isinstance(data, dict):
            # Support title as alias for name
            if "title" in data and "name" not in data:
                data["name"] = data["title"]
            # Support price_per_unit as alias for price
            if "price_per_unit" in data and "price" not in data:
                data["price"] = data["price_per_unit"]
            # Support origin_location as alias for growing_location
            if "origin_location" in data and "growing_location" not in data:
                data["growing_location"] = data["origin_location"]
        return data


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    category: Optional[ProductCategory] = None
    price: Optional[float] = Field(None, gt=0)
    unit: Optional[UnitType] = None
    available_quantity: Optional[float] = Field(None, ge=0)
    minimum_order_quantity: Optional[float] = Field(None, gt=0)
    growing_location: Optional[str] = None
    harvest_date: Optional[datetime] = None
    is_organic: Optional[bool] = None
    image_url: Optional[str] = None
    listing_status: Optional[ListingStatus] = None
    is_active: Optional[bool] = None
    moderation_reason: Optional[str] = None


class ProductRead(ProductBase):
    id: int
    farmer_id: int
    listing_status: ListingStatus
    is_active: bool
    moderation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    farmer: Optional[UserRead] = None

    model_config = ConfigDict(from_attributes=True)

    # Properties for frontend backwards compatibility


class ProductListResponse(BaseModel):
    items: List[ProductRead]
    total: int
    skip: int
    limit: int
