from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.user import UserRead, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    """
    Get the authenticated user's profile and roles.
    """
    return current_user


@router.put("/me", response_model=UserRead)
def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update profile attributes, including buyer_type or farmer organization details.
    """
    update_data = user_update.model_dump(exclude_unset=True)

    # Don't allow changing buyer type if user is not a buyer
    if "buyer_type" in update_data and current_user.role != UserRole.BUYER:
        update_data.pop("buyer_type")

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/", response_model=List[UserRead])
def list_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """
    Administrative overview of registered users across all roles.
    """
    return db.query(User).offset(skip).limit(limit).all()
