import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    FARMER = "farmer"
    BUYER = "buyer"
    ADMIN = "admin"


class BuyerType(str, enum.Enum):
    HOUSEHOLD = "household"
    RESTAURANT = "restaurant"
    RETAILER = "retailer"
    WHOLESALER = "wholesaler"
    COMPANY = "company"
    INSTITUTION = "institution"


# Alias for backward compatibility
BuyerCategory = BuyerType


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Authorization role: farmer, buyer, or admin
    role = Column(
        Enum(UserRole, name="user_role_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=UserRole.BUYER
    )

    # Buyer classification: household, restaurant, retailer, wholesaler, company, institution
    buyer_type = Column(
        Enum(BuyerType, name="buyer_type_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=True
    )

    phone_number = Column(String(50), nullable=True)

    # Location fields
    location = Column(String(255), nullable=True)
    district = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)

    # Business/Farm profile attributes
    organization_name = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    products = relationship("Product", back_populates="farmer", cascade="all, delete-orphan")
    buyer_orders = relationship("Order", foreign_keys="Order.buyer_id", back_populates="buyer")
    farmer_orders = relationship("Order", foreign_keys="Order.farmer_id", back_populates="farmer")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan")

    @property
    def buyer_category(self):
        """Compatibility property for buyer_type."""
        return self.buyer_type

    @buyer_category.setter
    def buyer_category(self, value):
        self.buyer_type = value
