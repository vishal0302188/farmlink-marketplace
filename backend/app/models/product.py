import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Enum, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class ProductCategory(str, enum.Enum):
    VEGETABLES = "vegetables"
    FRUITS = "fruits"
    GRAINS_PULSES = "grains_pulses"
    DAIRY_EGGS = "dairy_eggs"
    HERBS_SPICES = "herbs_spices"
    SPECIALTY = "specialty"


class UnitType(str, enum.Enum):
    KG = "kg"
    QUINTAL = "quintal"
    TON = "ton"
    CRATE = "crate"
    LITRE = "litre"
    PIECE = "piece"


class ListingStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Canonical name
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(
        Enum(ProductCategory, name="product_category_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    
    # Financial precision: Numeric(10, 2)
    price = Column(Numeric(10, 2), nullable=False)
    unit = Column(
        Enum(UnitType, name="unit_type_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=UnitType.KG
    )
    
    # Inventory volume: Numeric(10, 2)
    available_quantity = Column(Numeric(10, 2), nullable=False, default=0.00)
    minimum_order_quantity = Column(Numeric(10, 2), nullable=False, default=1.00)
    
    growing_location = Column(String(255), nullable=False, index=True)
    harvest_date = Column(DateTime, nullable=True)
    is_organic = Column(Boolean, default=False)
    image_url = Column(String(500), nullable=True)
    moderation_reason = Column(Text, nullable=True)
    
    listing_status = Column(
        Enum(ListingStatus, name="listing_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ListingStatus.ACTIVE,
        index=True
    )
    is_active = Column(Boolean, default=True, index=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Constraints for data integrity
    __table_args__ = (
        CheckConstraint("price >= 0", name="check_product_price_non_negative"),
        CheckConstraint("available_quantity >= 0", name="check_product_available_qty_non_negative"),
        CheckConstraint("minimum_order_quantity > 0", name="check_product_min_order_qty_positive"),
    )

    # Relationships
    farmer = relationship("User", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")

    # Compatibility properties for title/price_per_unit/origin_location
    @property
    def title(self) -> str:
        return self.name

    @title.setter
    def title(self, value: str):
        self.name = value

    @property
    def price_per_unit(self) -> float:
        return float(self.price) if self.price is not None else 0.0

    @price_per_unit.setter
    def price_per_unit(self, value):
        self.price = value

    @property
    def origin_location(self) -> str:
        return self.growing_location

    @origin_location.setter
    def origin_location(self, value: str):
        self.growing_location = value
