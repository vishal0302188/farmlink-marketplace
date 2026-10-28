from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps import get_current_farmer
from app.models.user import User, UserRole
from app.models.product import Product, ListingStatus
from app.models.order import Order, OrderStatus
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.schemas.farmer import FarmerDashboardStats, StockUpdate
from app.schemas.order import OrderRead, OrderStatusUpdate
from app.services.notification_service import (
    notify_order_accepted,
    notify_order_rejected,
    notify_order_ready,
    notify_order_completed,
    notify_order_cancelled,
)

router = APIRouter()


@router.get("/dashboard", response_model=FarmerDashboardStats, summary="Farmer Analytics and Dashboard Overview")
def get_farmer_dashboard(
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    Retrieve real-time dashboard analytics for the authenticated farmer:
    - Active listing count
    - Total inventory volume
    - Incoming order pipeline count
    - Recent produce lots
    - Recent orders requiring fulfillment
    """
    farmer_id = current_farmer.id

    # 1. Active produce listings
    active_products = db.query(Product).filter(
        Product.farmer_id == farmer_id,
        Product.listing_status == ListingStatus.ACTIVE,
        Product.is_active == True,
    ).all()
    total_active = len(active_products)
    total_inventory = sum(float(p.available_quantity) for p in active_products)

    # 2. Recent produce lots (including pending / archived)
    recent_products = db.query(Product).filter(
        Product.farmer_id == farmer_id
    ).order_by(Product.created_at.desc()).limit(10).all()

    # 3. Incoming orders
    incoming_orders = db.query(Order).filter(
        Order.farmer_id == farmer_id
    ).order_by(Order.created_at.desc()).limit(10).all()

    incoming_orders_count = db.query(Order).filter(
        Order.farmer_id == farmer_id,
        Order.status != OrderStatus.CANCELLED,
    ).count()

    # 4. Sales and revenue analytics from real database data
    realized_revenue = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0.0))
        .filter(
            Order.farmer_id == farmer_id,
            Order.status.in_([OrderStatus.COMPLETED, OrderStatus.DELIVERED]),
        )
        .scalar()
    )
    total_completed = (
        db.query(func.count(Order.id))
        .filter(
            Order.farmer_id == farmer_id,
            Order.status.in_([OrderStatus.COMPLETED, OrderStatus.DELIVERED]),
        )
        .scalar()
        or 0
    )
    pipeline_revenue = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0.0))
        .filter(
            Order.farmer_id == farmer_id,
            Order.status.in_([
                OrderStatus.PENDING,
                OrderStatus.CONFIRMED,
                OrderStatus.READY,
                OrderStatus.DISPATCHED,
            ]),
        )
        .scalar()
    )

    return {
        "total_active_listings": total_active,
        "total_available_inventory": round(total_inventory, 2),
        "incoming_orders_count": incoming_orders_count,
        "total_completed_orders": total_completed,
        "total_revenue": round(float(realized_revenue), 2),
        "pending_revenue": round(float(pipeline_revenue), 2),
        "recent_products": recent_products,
        "incoming_orders": incoming_orders,
    }


@router.get("/products", response_model=List[ProductRead], summary="List Authenticated Farmer's Produce")
def list_farmer_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    List all produce catalog lots owned by the authenticated farmer.
    """
    return db.query(Product).filter(
        Product.farmer_id == current_farmer.id
    ).order_by(Product.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED, summary="Create New Produce Lot")
def create_farmer_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    Create a new produce lot linked automatically to the authenticated farmer.
    Enforces non-negative price and inventory volumes.
    """
    if product_in.price <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Product price must be greater than 0.",
        )
    if product_in.available_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Available quantity cannot be negative.",
        )
    if product_in.minimum_order_quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Minimum order quantity must be greater than 0.",
        )

    product = Product(
        farmer_id=current_farmer.id,
        name=product_in.name.strip(),
        description=product_in.description.strip(),
        category=product_in.category,
        price=product_in.price,
        unit=product_in.unit,
        available_quantity=product_in.available_quantity,
        minimum_order_quantity=product_in.minimum_order_quantity,
        growing_location=product_in.growing_location.strip(),
        harvest_date=product_in.harvest_date,
        is_organic=product_in.is_organic,
        image_url=product_in.image_url.strip() if product_in.image_url else None,
        listing_status=ListingStatus.ACTIVE,
        is_active=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/products/{product_id}", response_model=ProductRead, summary="Get Farmer's Specific Produce Lot")
def get_farmer_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    Retrieve details for a specific produce lot owned by the authenticated farmer.
    """
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.farmer_id == current_farmer.id,
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produce listing with ID {product_id} was not found in your inventory.",
        )
    return product


@router.put("/products/{product_id}", response_model=ProductRead, summary="Update Farmer's Produce Lot")
def update_farmer_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    Update attributes of a produce listing owned by the authenticated farmer.
    Strictly forbids modifying other farmers' listings (HTTP 403).
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produce lot with ID {product_id} does not exist.",
        )

    # Ownership check
    if product.farmer_id != current_farmer.id and current_farmer.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit produce listings belonging to other farmers.",
        )

    update_data = product_in.model_dump(exclude_unset=True)

    # Validate numeric rules
    if "price" in update_data and update_data["price"] <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Product price must be greater than 0.",
        )
    if "available_quantity" in update_data and update_data["available_quantity"] < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Available quantity cannot be negative.",
        )
    if "minimum_order_quantity" in update_data and update_data["minimum_order_quantity"] <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Minimum order quantity must be greater than 0.",
        )

    for field, value in update_data.items():
        setattr(product, field, value)

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{product_id}/stock", response_model=ProductRead, summary="Quick Inventory Stock Update")
def update_farmer_product_stock(
    product_id: int,
    stock_in: StockUpdate,
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    Rapidly update the available stock volume of an existing lot.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produce lot with ID {product_id} does not exist.",
        )

    if product.farmer_id != current_farmer.id and current_farmer.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update stock on listings belonging to other farmers.",
        )

    product.available_quantity = stock_in.available_quantity
    # If restocked above zero, mark active if archived
    if stock_in.available_quantity > 0 and product.listing_status == ListingStatus.ACTIVE:
        product.is_active = True

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", response_model=ProductRead, summary="Archive Produce Listing")
def archive_farmer_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    Archive and deactivate a produce listing.
    Removes it from the public active marketplace while preserving sales and order histories.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produce lot with ID {product_id} does not exist.",
        )

    if product.farmer_id != current_farmer.id and current_farmer.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to archive listings belonging to other farmers.",
        )

    product.listing_status = ListingStatus.ARCHIVED
    product.is_active = False

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


# ---------------------------------------------------------------------------
# FARMER ORDER FULFILLMENT & PIPELINE MANAGEMENT
# ---------------------------------------------------------------------------

def _transition_farmer_order(
    order_id: int,
    target_status: OrderStatus,
    current_farmer: User,
    db: Session,
    notes: Optional[str] = None
) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )

    if order.farmer_id != current_farmer.id and current_farmer.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to manage orders for other farmers."
        )

    current_status = order.status

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

    # If transitioning to REJECTED or CANCELLED, restore reserved stock under row-lock
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
    if notes:
        order.notes = (order.notes or "") + f" | {target_status.value.capitalize()}: {notes}"

    buyer = db.query(User).filter(User.id == order.buyer_id).first()
    farmer = current_farmer if current_farmer.role == UserRole.FARMER else db.query(User).filter(User.id == order.farmer_id).first()

    if buyer and farmer:
        if target_status == OrderStatus.CONFIRMED:
            notify_order_accepted(db, order, farmer, buyer)
        elif target_status == OrderStatus.REJECTED:
            notify_order_rejected(db, order, farmer, buyer, notes)
        elif target_status == OrderStatus.READY:
            notify_order_ready(db, order, farmer, buyer)
        elif target_status == OrderStatus.COMPLETED:
            notify_order_completed(db, order, farmer, buyer)
        elif target_status == OrderStatus.CANCELLED:
            notify_order_cancelled(db, order, current_farmer, notes)

    db.commit()
    db.refresh(order)
    return order


@router.get("/orders", response_model=List[OrderRead], summary="List Orders Received by Farmer")
def list_farmer_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    List all customer orders received by the authenticated farmer.
    """
    query = db.query(Order).filter(Order.farmer_id == current_farmer.id)
    if status_filter:
        query = query.filter(Order.status == status_filter)

    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/orders/{order_id}", response_model=OrderRead, summary="Get Single Order for Farmer")
def get_farmer_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    Retrieve details of an order directed to the authenticated farmer.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )

    if order.farmer_id != current_farmer.id and current_farmer.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view orders for other farmers."
        )

    return order


@router.patch("/orders/{order_id}/status", response_model=OrderRead, summary="Update Order Status")
def update_farmer_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    Advance or reject an incoming order through valid state transitions.
    """
    return _transition_farmer_order(
        order_id=order_id,
        target_status=status_update.status,
        current_farmer=current_farmer,
        db=db,
        notes=status_update.notes,
    )


@router.patch("/orders/{order_id}/accept", response_model=OrderRead, summary="Accept Order")
def accept_farmer_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    Accept a pending order (transitions PENDING -> CONFIRMED).
    """
    return _transition_farmer_order(
        order_id=order_id,
        target_status=OrderStatus.CONFIRMED,
        current_farmer=current_farmer,
        db=db,
        notes="Order confirmed and accepted by farmer",
    )


@router.patch("/orders/{order_id}/reject", response_model=OrderRead, summary="Reject Order")
def reject_farmer_order(
    order_id: int,
    reason: Optional[str] = Query(None, description="Reason for rejection"),
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    Reject an order (transitions PENDING -> REJECTED) and restores reserved inventory.
    """
    return _transition_farmer_order(
        order_id=order_id,
        target_status=OrderStatus.REJECTED,
        current_farmer=current_farmer,
        db=db,
        notes=reason or "Order rejected by farmer",
    )


@router.patch("/orders/{order_id}/ready", response_model=OrderRead, summary="Mark Order as Ready")
def mark_farmer_order_ready(
    order_id: int,
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    Mark an accepted order as ready for pickup or dispatch (CONFIRMED -> READY).
    """
    return _transition_farmer_order(
        order_id=order_id,
        target_status=OrderStatus.READY,
        current_farmer=current_farmer,
        db=db,
        notes="Produce packed and ready for pickup/dispatch",
    )


@router.patch("/orders/{order_id}/complete", response_model=OrderRead, summary="Complete Order")
def complete_farmer_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_farmer: User = Depends(get_current_farmer),
):
    """
    Mark an order as fulfilled and completed (READY/DISPATCHED -> COMPLETED).
    """
    return _transition_farmer_order(
        order_id=order_id,
        target_status=OrderStatus.COMPLETED,
        current_farmer=current_farmer,
        db=db,
        notes="Order delivered and fulfilled successfully",
    )
