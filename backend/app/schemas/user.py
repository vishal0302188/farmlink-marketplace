from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.user import UserRole, BuyerType


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    phone_number: Optional[str] = None
    role: UserRole = UserRole.BUYER
    buyer_type: Optional[BuyerType] = None
    organization_name: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    bio: Optional[str] = None

    # Compatibility alias for buyer_type
    @property
    def buyer_category(self) -> Optional[BuyerType]:
        return self.buyer_type


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")

    @classmethod
    def model_validate(cls, *args, **kwargs):
        return super().model_validate(*args, **kwargs)


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")
    full_name: str = Field(..., min_length=2, max_length=255)
    role: UserRole = UserRole.BUYER
    buyer_type: Optional[BuyerType] = None
    phone_number: Optional[str] = None
    organization_name: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    bio: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str



class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    buyer_type: Optional[BuyerType] = None
    organization_name: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    bio: Optional[str] = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[UserRole] = None
