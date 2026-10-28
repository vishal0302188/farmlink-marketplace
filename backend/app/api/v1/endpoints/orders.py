from typing import List, Optional, Dict
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_buyer
from app.models.user import User, UserRole
from app.models.product import Product, ListingStatus
from app.models.order import Order, OrderItem, OrderStatus, FulfillmentMethod
from app.schemas.order import (
    OrderCreate,
    OrderRead,
    OrderCheckoutRequest,
    CheckoutResponse,
    OrderStatusUpdate,
    OrderCancellationRequest,
)
from app.services.notification_service import (
    notify_order_created,
    notify_order_cancelled,
)

router = APIRouter()


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED, summary="Create a Single-Farmer Order")
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_buyer: User = Depends(get_current_buyer),
):
    """
    Create a new order for an authenticated buyer.
    
    Security & Concurrency Guarantees:
    - User ID is derived from authenticated session (never trusted from payload).
    - Product prices and farmer IDs are derived strictly from authoritative database records.
    - PostgreSQL row locking ('SELECT ... FOR UPDATE') prevents overselling under concurrent load.
    - Atomically decrements available inventory (reserving stock on PENDING).
    - Validates minimum order quantities and active catalog status.
    - Enforces single-farmer-per-order architecture.
    """
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one product item."
        )

    resolved_farmer_id: Optional[int] = None
    calculated_items_data = []
    total_order_amount = 0.0

    # Execute within an atomic transaction with pessimistic row-locking
    try:
        for item_in in order_in.items:
            # Row-level lock on the product to prevent concurrent overselling
            product = (
                db.query(Product)
                .filter(Product.id == item_in.product_id)
                .with_for_update()
                .first()
            )

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item_in.product_id} was not found."
                )

            if not product.is_active or product.listing_status != ListingStatus.ACTIVE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product.name}' is inactive or no longer available for order."
                )

            # Prevent a farmer from ordering their own product
            if product.farmer_id == current_buyer.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot order your own product '{product.name}'."
                )

            # Enforce single farmer per order
            if resolved_farmer_id is None:
                resolved_farmer_id = product.farmer_id
            elif product.farmer_id != resolved_farmer_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="All items in a single order must originate from the same farmer. Use /orders/checkout for multi-farmer carts."
                )

            # Validate Minimum Order Quantity
            moq = float(product.minimum_order_quantity)
            if item_in.quantity < moq:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Requested quantity {item_in.quantity} for '{product.name}' is below the minimum order quantity of {moq} {product.unit.value}."
                )

            # Validate Available Stock
            current_stock = float(product.available_quantity)
            if item_in.quantity > current_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient inventory for '{product.name}'. Requested: {item_in.quantity} {product.unit.value}, Available: {current_stock} {product.unit.value}."
                )

            # Server-authoritative unit price and subtotal
            unit_price = float(product.price)
            item_subtotal = round(unit_price * item_in.quantity, 2)
            total_order_amount += item_subtotal

            # Reserve inventory atomically
            product.available_quantity = round(current_stock - item_in.quantity, 2)

            calculated_items_data.append({
                "product_id": product.id,
                "quantity": item_in.quantity,
                "unit_price_at_purchase": unit_price,
                "subtotal": item_subtotal,
            })

        # Create Order record
        new_order = Order(
            buyer_id=current_buyer.id,
            farmer_id=resolved_farmer_id,
            status=OrderStatus.PENDING,
            total_amount=round(total_order_amount, 2),
            fulfillment_method=order_in.fulfillment_method,
            payment_method=order_in.payment_method or "cash_on_delivery",
            delivery_address=order_in.delivery_address,
            delivery_city=order_in.delivery_city,
            delivery_state=order_in.delivery_state,
            delivery_pincode=order_in.delivery_pincode,
            notes=order_in.notes,
        )
        db.add(new_order)
        db.flush()

        # Create OrderItem records
        for item_data in calculated_items_data:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price_at_purchase=item_data["unit_price_at_purchase"],
                subtotal=item_data["subtotal"],
            )
            db.add(order_item)

        farmer = db.query(User).filter(User.id == resolved_farmer_id).first()
        if farmer:
            notify_order_created(db, new_order, current_buyer, farmer)

        db.commit()
        db.refresh(new_order)
        return new_order

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process order: {str(exc)}"
        )


@router.post("/checkout", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED, summary="Checkout Cart (Multi-Farmer Atomic Split)")
def checkout_cart(
    checkout_in: OrderCheckoutRequest,
    db: Session = Depends(get_db),
    current_buyer: User = Depends(get_current_buyer),
):
    """
    Checkout a cart containing items from one or multiple farmers.
    Atomically groups items by farmer, locks inventory rows, creates individual orders,
    and returns a consolidated checkout summary.
    """
    if not checkout_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Checkout cart is empty."
        )

    # Map farmer_id -> list of items
    farmer_items_map: Dict[int, list] = {}

    try:
        for item_in in checkout_in.items:
            product = (
                db.query(Product)
                .filter(Product.id == item_in.product_id)
                .with_for_update()
                .first()
            )

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item_in.product_id} was not found."
                )

            if not product.is_active or product.listing_status != ListingStatus.ACTIVE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product.name}' is inactive or no longer listed."
                )

            if product.farmer_id == current_buyer.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot order your own product '{product.name}'."
                )

            moq = float(product.minimum_order_quantity)
            if item_in.quantity < moq:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Quantity {item_in.quantity} for '{product.name}' is below MOQ of {moq} {product.unit.value}."
                )

            current_stock = float(product.available_quantity)
            if item_in.quantity > current_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient inventory for '{product.name}'. Requested: {item_in.quantity}, Available: {current_stock}."
                )

            unit_price = float(product.price)
            item_subtotal = round(unit_price * item_in.quantity, 2)

            # Deduct stock
            product.available_quantity = round(current_stock - item_in.quantity, 2)

            if product.farmer_id not in farmer_items_map:
                farmer_items_map[product.farmer_id] = []

            farmer_items_map[product.farmer_id].append({
                "product_id": product.id,
                "quantity": item_in.quantity,
                "unit_price_at_purchase": unit_price,
                "subtotal": item_subtotal,
            })

        created_orders = []
        grand_total = 0.0

        for farmer_id, items_list in farmer_items_map.items():
            order_total = sum(i["subtotal"] for i in items_list)
            grand_total += order_total

            order = Order(
                buyer_id=current_buyer.id,
                farmer_id=farmer_id,
                status=OrderStatus.PENDING,
                total_amount=round(order_total, 2),
                fulfillment_method=checkout_in.fulfillment_method,
                payment_method=checkout_in.payment_method or "cash_on_delivery",
                delivery_address=checkout_in.delivery_address,
                delivery_city=checkout_in.delivery_city,
                delivery_state=checkout_in.delivery_state,
                delivery_pincode=checkout_in.delivery_pincode,
                notes=checkout_in.notes,
            )
            db.add(order)
            db.flush()

            for item_data in items_list:
                item = OrderItem(
                    order_id=order.id,
                    product_id=item_data["product_id"],
                    quantity=item_data["quantity"],
                    unit_price_at_purchase=item_data["unit_price_at_purchase"],
                    subtotal=item_data["subtotal"],
                )
                db.add(item)

            created_orders.append(order)

        for o in created_orders:
            farmer = db.query(User).filter(User.id == o.farmer_id).first()
            if farmer:
                notify_order_created(db, o, current_buyer, farmer)

        db.commit()
        for o in created_orders:
            db.refresh(o)

        return {
            "orders": created_orders,
            "total_orders_placed": len(created_orders),
            "grand_total": round(grand_total, 2),
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Checkout failed: {str(exc)}"
        )


@router.get("/", response_model=List[OrderRead], summary="List Current Buyer's Orders")
def list_buyer_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_buyer: User = Depends(get_current_buyer),
):
    """
    List all orders placed by the authenticated buyer.
    Buyers cannot see other buyers' orders.
    """
    query = db.query(Order).filter(Order.buyer_id == current_buyer.id)
    if status_filter:
        query = query.filter(Order.status == status_filter)

    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{order_id}", response_model=OrderRead, summary="Get Order Details")
def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve order details by ID.
    Authorization:
    - Allowed if user is the buyer who placed the order.
    - Allowed if user is the farmer who received the order.
    - Allowed for administrators.
    - Rejects unauthorized users with HTTP 403.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )

    # Authorization Check
    is_buyer = order.buyer_id == current_user.id
    is_farmer = order.farmer_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN

    if not (is_buyer or is_farmer or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this order."
        )

    return order


@router.patch("/{order_id}/cancel", response_model=OrderRead, summary="Cancel Order (Buyer or Farmer)")
def cancel_order(
    order_id: int,
    status_update: Optional[OrderCancellationRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel an order and atomically restore reserved inventory.
    Rules:
    - Buyer can cancel when status is PENDING or CONFIRMED.
    - Farmer can cancel/reject when status is PENDING, CONFIRMED, or READY.
    - Orders in terminal states (CANCELLED, REJECTED, COMPLETED, DELIVERED) cannot be cancelled.
    - Restores inventory volume under row lock.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )

    is_buyer = order.buyer_id == current_user.id
    is_farmer = order.farmer_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN

    if not (is_buyer or is_farmer or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to cancel this order."
        )

    # Check terminal states
    terminal_statuses = [
        OrderStatus.CANCELLED,
        OrderStatus.REJECTED,
        OrderStatus.DELIVERED,
        OrderStatus.COMPLETED,
    ]
    if order.status in terminal_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be cancelled. Current status is '{order.status.value}'."
        )

    # If buyer, check allowed cancellation window
    if is_buyer and not is_admin:
        allowed_buyer_cancel = [OrderStatus.PENDING, OrderStatus.CONFIRMED]
        if order.status not in allowed_buyer_cancel:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Buyers can only cancel orders in 'pending' or 'confirmed' status. Current status is '{order.status.value}'."
            )

    try:
        # Atomically restore stock for all products in the order
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

        order.status = OrderStatus.CANCELLED
        if status_update and status_update.notes:
            order.notes = (order.notes or "") + f" | Cancellation: {status_update.notes}"

        notify_order_cancelled(
            db=db,
            order=order,
            cancelled_by=current_user,
            notes=status_update.notes if status_update else None,
        )

        db.commit()
        db.refresh(order)
        return order

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel order: {str(exc)}"
        )
