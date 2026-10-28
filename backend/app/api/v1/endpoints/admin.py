from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.api.deps import get_current_admin
from app.models.user import User, UserRole
from app.models.product import Product, ListingStatus, ProductCategory
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.admin import (
    AdminDashboardMetrics,
    ProductModerationUpdate,
    UserStatusUpdate,
    AdminUserRead,
    AdminOrderStatusUpdate,
)
from app.schemas.product import ProductRead
from app.schemas.order import OrderRead
from app.services.notification_service import (
    notify_product_moderation,
    notify_order_cancelled,
    notify_admin_order_status_update,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# PHASE 2: ADMINISTRATIVE DASHBOARD OVERVIEW METRICS
# ---------------------------------------------------------------------------

@router.get("/overview", response_model=AdminDashboardMetrics, summary="Admin Dashboard System Overview")
def get_admin_overview(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Retrieve real-time database-backed administrative metrics:
    - Total registered farmers
    - Total buyers
    - Active product listings
    - Pending moderation items
    - Total orders
    - Completed orders
    - Recent orders and recent user registrations
    """
    total_farmers = db.query(User).filter(User.role == UserRole.FARMER).count()
    total_buyers = db.query(User).filter(User.role == UserRole.BUYER).count()

    active_products = db.query(Product).filter(
        Product.is_active == True,
        Product.listing_status == ListingStatus.ACTIVE
    ).count()

    pending_moderation = db.query(Product).filter(
        Product.listing_status == ListingStatus.PENDING
    ).count()

    total_orders = db.query(Order).count()
    completed_orders = db.query(Order).filter(
        Order.status.in_([OrderStatus.COMPLETED, OrderStatus.DELIVERED])
    ).count()

    recent_orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(10)
        .all()
    )

    recent_users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "total_farmers": total_farmers,
        "total_buyers": total_buyers,
        "active_products": active_products,
        "pending_moderation_products": pending_moderation,
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "recent_orders": recent_orders,
        "recent_users": recent_users,
    }


# ---------------------------------------------------------------------------
# PHASE 3: PRODUCT MODERATION ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/products", response_model=List[ProductRead], summary="List All Products for Moderation")
def list_admin_products(
    search: Optional[str] = Query(None, description="Search by product name, description, or origin location"),
    status: Optional[ListingStatus] = Query(None, description="Filter by listing status"),
    category: Optional[ProductCategory] = Query(None, description="Filter by produce category"),
    farmer_id: Optional[int] = Query(None, description="Filter by farmer ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active flag"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Retrieve all product listings across all moderation states (pending, active, rejected, archived).
    """
    query = db.query(Product)

    if status:
        query = query.filter(Product.listing_status == status)
    if category:
        query = query.filter(Product.category == category)
    if farmer_id:
        query = query.filter(Product.farmer_id == farmer_id)
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.description.ilike(search_pattern),
                Product.growing_location.ilike(search_pattern),
            )
        )

    return query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/products/{product_id}", response_model=ProductRead, summary="Get Single Product Details for Moderation")
def get_admin_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product #{product_id} not found."
        )
    return product


@router.patch("/products/{product_id}/moderate", response_model=ProductRead, summary="Approve, Reject, or Deactivate Produce Lot")
def moderate_product(
    product_id: int,
    moderation_in: ProductModerationUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Moderate a product listing.
    - Approving: sets listing_status=ACTIVE, is_active=True.
    - Rejecting: sets listing_status=REJECTED, is_active=False, records moderation_reason.
    - Deactivating/Archiving: sets is_active=False, records moderation_reason.
    Preserves historical orders and inventory records.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product #{product_id} not found."
        )

    product.listing_status = moderation_in.listing_status

    if moderation_in.is_active is not None:
        product.is_active = moderation_in.is_active
    else:
        # Infer active status from listing status
        if moderation_in.listing_status == ListingStatus.ACTIVE:
            product.is_active = True
        elif moderation_in.listing_status in (ListingStatus.REJECTED, ListingStatus.ARCHIVED):
            product.is_active = False

    if moderation_in.moderation_reason is not None:
        product.moderation_reason = moderation_in.moderation_reason

    notify_product_moderation(
        db=db,
        product=product,
        new_status=moderation_in.listing_status,
        moderation_reason=moderation_in.moderation_reason,
    )

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


# ---------------------------------------------------------------------------
# PHASE 4: USER MANAGEMENT ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/users", response_model=List[AdminUserRead], summary="List and Search Registered Users")
def list_admin_users(
    search: Optional[str] = Query(None, description="Search by full name, email, or organization"),
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Search and inspect registered farmers and buyers with associated listing and order counts.
    """
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                User.organization_name.ilike(search_pattern),
                User.location.ilike(search_pattern),
            )
        )

    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    # Enrich with counts
    result = []
    for u in users:
        p_count = db.query(Product).filter(Product.farmer_id == u.id).count()
        b_count = db.query(Order).filter(Order.buyer_id == u.id).count()
        f_count = db.query(Order).filter(Order.farmer_id == u.id).count()

        admin_user_data = AdminUserRead(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            buyer_type=u.buyer_type,
            phone_number=u.phone_number,
            location=u.location,
            district=u.district,
            state=u.state,
            pincode=u.pincode,
            organization_name=u.organization_name,
            bio=u.bio,
            is_verified=u.is_verified,
            is_active=u.is_active,
            created_at=u.created_at,
            updated_at=u.updated_at,
            product_count=p_count,
            buyer_order_count=b_count,
            farmer_order_count=f_count,
        )
        result.append(admin_user_data)

    return result


@router.get("/users/{user_id}", response_model=AdminUserRead, summary="Get Single User Details")
def get_admin_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User #{user_id} not found."
        )

    p_count = db.query(Product).filter(Product.farmer_id == user.id).count()
    b_count = db.query(Order).filter(Order.buyer_id == user.id).count()
    f_count = db.query(Order).filter(Order.farmer_id == user.id).count()

    return AdminUserRead(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        buyer_type=user.buyer_type,
        phone_number=user.phone_number,
        location=user.location,
        district=user.district,
        state=user.state,
        pincode=user.pincode,
        organization_name=user.organization_name,
        bio=user.bio,
        is_verified=user.is_verified,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        product_count=p_count,
        buyer_order_count=b_count,
        farmer_order_count=f_count,
    )


@router.patch("/users/{user_id}/status", response_model=AdminUserRead, summary="Suspend or Reactivate User")
def update_user_status(
    user_id: int,
    status_in: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Suspend or reactivate a user account.
    Prevents administrators from accidentally deactivating their own administrative account.
    Preserves all historical order and catalog relationships.
    """
    # Self-lockout prevention
    if user_id == current_admin.id and not status_in.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot deactivate their own administrative account."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User #{user_id} not found."
        )

    user.is_active = status_in.is_active
    db.add(user)
    db.commit()
    db.refresh(user)

    p_count = db.query(Product).filter(Product.farmer_id == user.id).count()
    b_count = db.query(Order).filter(Order.buyer_id == user.id).count()
    f_count = db.query(Order).filter(Order.farmer_id == user.id).count()

    return AdminUserRead(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        buyer_type=user.buyer_type,
        phone_number=user.phone_number,
        location=user.location,
        district=user.district,
        state=user.state,
        pincode=user.pincode,
        organization_name=user.organization_name,
        bio=user.bio,
        is_verified=user.is_verified,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        product_count=p_count,
        buyer_order_count=b_count,
        farmer_order_count=f_count,
    )


# ---------------------------------------------------------------------------
# PHASE 5: ORDER OVERSIGHT ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/orders", response_model=List[OrderRead], summary="Master Administrative Order Oversight")
def list_admin_orders(
    search: Optional[str] = Query(None, description="Search by Order ID, delivery city, or destination address"),
    status: Optional[OrderStatus] = Query(None, description="Filter by order status"),
    farmer_id: Optional[int] = Query(None, description="Filter by target farmer ID"),
    buyer_id: Optional[int] = Query(None, description="Filter by purchasing buyer ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    List all orders across the entire marketplace with full filters.
    """
    query = db.query(Order)

    if status:
        query = query.filter(Order.status == status)
    if farmer_id:
        query = query.filter(Order.farmer_id == farmer_id)
    if buyer_id:
        query = query.filter(Order.buyer_id == buyer_id)
    if search:
        search_cleaned = search.strip()
        # If integer, match order id directly
        if search_cleaned.isdigit():
            query = query.filter(Order.id == int(search_cleaned))
        else:
            search_pat = f"%{search_cleaned}%"
            query = query.filter(
                or_(
                    Order.delivery_city.ilike(search_pat),
                    Order.delivery_address.ilike(search_pat),
                    Order.notes.ilike(search_pat),
                )
            )

    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/orders/{order_id}", response_model=OrderRead, summary="Get Full Order Inspection Details")
def get_admin_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order #{order_id} not found."
        )
    return order


@router.patch("/orders/{order_id}/status", response_model=OrderRead, summary="Administrative Order Status Transition")
def update_admin_order_status(
    order_id: int,
    status_in: AdminOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Administratively update order status with state machine and inventory integrity validation.
    Restores stock if transitioning to CANCELLED or REJECTED.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order #{order_id} not found."
        )

    current_status = order.status
    target_status = status_in.status

    if current_status == target_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order is already in '{current_status.value}' status."
        )

    terminal_statuses = [
        OrderStatus.CANCELLED,
        OrderStatus.REJECTED,
        OrderStatus.DELIVERED,
        OrderStatus.COMPLETED,
    ]
    if current_status in terminal_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition order from terminal status '{current_status.value}'."
        )

    valid_transitions = {
        OrderStatus.PENDING: [OrderStatus.CONFIRMED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
        OrderStatus.CONFIRMED: [OrderStatus.READY, OrderStatus.CANCELLED],
        OrderStatus.READY: [OrderStatus.DISPATCHED, OrderStatus.COMPLETED, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        OrderStatus.DISPATCHED: [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
    }

    allowed = valid_transitions.get(current_status, [])
    if target_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from '{current_status.value}' to '{target_status.value}'. Allowed: {[s.value for s in allowed]}."
        )

    # If transitioning to REJECTED or CANCELLED, restore reserved inventory under row lock
    if target_status in (OrderStatus.REJECTED, OrderStatus.CANCELLED):
        for item in order.items:
            product = (
                db.query(Product)
                .filter(Product.id == item.product_id)
                .with_for_update()
                .first()
            )
            if product:
                product.available_quantity = round(
                    float(product.available_quantity) + float(item.quantity), 2
                )

    order.status = target_status
    if status_in.notes:
        order.notes = (order.notes or "") + f" | Admin ({target_status.value}): {status_in.notes}"

    if target_status == OrderStatus.CANCELLED:
        notify_order_cancelled(db, order, current_admin, status_in.notes)
    else:
        notify_admin_order_status_update(db, order, target_status, status_in.notes)

    db.commit()
    db.refresh(order)
    return order
