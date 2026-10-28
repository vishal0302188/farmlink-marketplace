from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus
from app.models.product import Product, ListingStatus
from app.models.notification import Notification, NotificationType


def create_notification(
    db: Session,
    recipient_id: int,
    type: str,
    title: str,
    message: str,
    order_id: Optional[int] = None,
) -> Notification:
    """
    Create a new database notification for a user.
    Prevents duplicate unread notifications for the same (recipient_id, order_id, type).
    """
    if order_id is not None:
        existing = (
            db.query(Notification)
            .filter(
                Notification.recipient_id == recipient_id,
                Notification.order_id == order_id,
                Notification.type == type,
                Notification.is_read == False,
            )
            .first()
        )
        if existing:
            # Avoid duplicate spam if request is retried
            return existing

    notification = Notification(
        recipient_id=recipient_id,
        type=type,
        title=title,
        message=message,
        order_id=order_id,
        is_read=False,
    )
    db.add(notification)
    return notification


def notify_order_created(db: Session, order: Order, buyer: User, farmer: User) -> None:
    """
    Notify farmer of a new incoming order, and notify buyer that their order was submitted.
    """
    # 1. Farmer notification
    farmer_name = farmer.organization_name or farmer.full_name or "Farmer"
    create_notification(
        db=db,
        recipient_id=farmer.id,
        type=NotificationType.ORDER_CREATED.value,
        title=f"New Order #{order.id} Received",
        message=f"Buyer {buyer.full_name} has placed Order #{order.id} for ₹{float(order.total_amount):.2f}. Please review and accept the order.",
        order_id=order.id,
    )

    # 2. Buyer notification
    create_notification(
        db=db,
        recipient_id=buyer.id,
        type=NotificationType.ORDER_CREATED.value,
        title=f"Order #{order.id} Placed Successfully",
        message=f"Your order #{order.id} with {farmer_name} has been placed for ₹{float(order.total_amount):.2f}. Awaiting farmer confirmation.",
        order_id=order.id,
    )


def notify_order_accepted(db: Session, order: Order, farmer: User, buyer: User) -> None:
    """
    Notify buyer that the farmer accepted the order.
    """
    farmer_name = farmer.organization_name or farmer.full_name or "The farmer"
    create_notification(
        db=db,
        recipient_id=buyer.id,
        type=NotificationType.ORDER_ACCEPTED.value,
        title=f"Order #{order.id} Confirmed by Farmer",
        message=f"{farmer_name} has accepted and confirmed your order #{order.id}. Packing and preparation are underway.",
        order_id=order.id,
    )


def notify_order_rejected(db: Session, order: Order, farmer: User, buyer: User, reason: Optional[str] = None) -> None:
    """
    Notify buyer that the farmer rejected the order.
    """
    farmer_name = farmer.organization_name or farmer.full_name or "The farmer"
    reason_text = f" Reason: {reason}" if reason else ""
    create_notification(
        db=db,
        recipient_id=buyer.id,
        type=NotificationType.ORDER_REJECTED.value,
        title=f"Order #{order.id} Declined",
        message=f"Your order #{order.id} could not be accepted by {farmer_name}.{reason_text} All reserved stock has been released.",
        order_id=order.id,
    )


def notify_order_ready(db: Session, order: Order, farmer: User, buyer: User) -> None:
    """
    Notify buyer that the order is packed and ready.
    """
    farmer_name = farmer.organization_name or farmer.full_name or "The farmer"
    create_notification(
        db=db,
        recipient_id=buyer.id,
        type=NotificationType.ORDER_READY.value,
        title=f"Order #{order.id} Ready for Fulfillment",
        message=f"{farmer_name} has prepared your order #{order.id}. It is now ready for {order.fulfillment_method.value.replace('_', ' ')}.",
        order_id=order.id,
    )


def notify_order_completed(db: Session, order: Order, farmer: User, buyer: User) -> None:
    """
    Notify buyer and farmer upon order completion.
    """
    farmer_name = farmer.organization_name or farmer.full_name or "The producer"
    # Notify Buyer
    create_notification(
        db=db,
        recipient_id=buyer.id,
        type=NotificationType.ORDER_COMPLETED.value,
        title=f"Order #{order.id} Delivered & Completed",
        message=f"Your order #{order.id} from {farmer_name} has been marked as completed. Thank you for choosing direct agricultural commerce!",
        order_id=order.id,
    )
    # Notify Farmer
    create_notification(
        db=db,
        recipient_id=farmer.id,
        type=NotificationType.ORDER_COMPLETED.value,
        title=f"Order #{order.id} Completed",
        message=f"Order #{order.id} for {buyer.full_name} has been fulfilled and completed successfully.",
        order_id=order.id,
    )


def notify_order_cancelled(db: Session, order: Order, cancelled_by: User, notes: Optional[str] = None) -> None:
    """
    Notify relevant parties when an order is cancelled.
    """
    is_buyer = cancelled_by.id == order.buyer_id
    is_farmer = cancelled_by.id == order.farmer_id
    is_admin = cancelled_by.role == UserRole.ADMIN

    if is_buyer:
        # Notify Farmer
        create_notification(
            db=db,
            recipient_id=order.farmer_id,
            type=NotificationType.ORDER_CANCELLED.value,
            title=f"Order #{order.id} Cancelled by Buyer",
            message=f"Buyer {cancelled_by.full_name} has cancelled Order #{order.id}. All reserved inventory has been automatically returned to your available stock.",
            order_id=order.id,
        )
    elif is_farmer:
        # Notify Buyer
        create_notification(
            db=db,
            recipient_id=order.buyer_id,
            type=NotificationType.ORDER_CANCELLED.value,
            title=f"Order #{order.id} Cancelled by Farmer",
            message=f"Your order #{order.id} has been cancelled by the farmer.{f' Notes: {notes}' if notes else ''} Reserved inventory was restored.",
            order_id=order.id,
        )
    elif is_admin:
        # Notify both Buyer and Farmer
        create_notification(
            db=db,
            recipient_id=order.buyer_id,
            type=NotificationType.ORDER_CANCELLED.value,
            title=f"Order #{order.id} Cancelled by Administration",
            message=f"Order #{order.id} was cancelled by marketplace administration.{f' Reason: {notes}' if notes else ''}",
            order_id=order.id,
        )
        create_notification(
            db=db,
            recipient_id=order.farmer_id,
            type=NotificationType.ORDER_CANCELLED.value,
            title=f"Order #{order.id} Cancelled by Administration",
            message=f"Order #{order.id} was cancelled by marketplace administration.{f' Reason: {notes}' if notes else ''} Reserved inventory was restored.",
            order_id=order.id,
        )


def notify_admin_order_status_update(
    db: Session,
    order: Order,
    new_status: OrderStatus,
    admin_notes: Optional[str] = None,
) -> None:
    """
    Notify buyer and farmer when an admin changes order status.
    """
    status_label = new_status.value.upper()
    note_text = f" Note: {admin_notes}" if admin_notes else ""

    # Notify Buyer
    create_notification(
        db=db,
        recipient_id=order.buyer_id,
        type=NotificationType.ORDER_STATUS_UPDATED.value,
        title=f"Order #{order.id} Updated to {status_label}",
        message=f"Order #{order.id} status was administratively updated to {new_status.value}.{note_text}",
        order_id=order.id,
    )

    # Notify Farmer
    create_notification(
        db=db,
        recipient_id=order.farmer_id,
        type=NotificationType.ORDER_STATUS_UPDATED.value,
        title=f"Order #{order.id} Updated to {status_label}",
        message=f"Order #{order.id} status was administratively updated to {new_status.value}.{note_text}",
        order_id=order.id,
    )


def notify_product_moderation(
    db: Session,
    product: Product,
    new_status: ListingStatus,
    moderation_reason: Optional[str] = None,
) -> None:
    """
    Notify farmer when their product is approved or rejected by administration.
    """
    if new_status == ListingStatus.ACTIVE:
        create_notification(
            db=db,
            recipient_id=product.farmer_id,
            type=NotificationType.PRODUCT_APPROVED.value,
            title=f"Listing '{product.name}' Approved",
            message=f"Congratulations! Your listing for '{product.name}' has been verified and published to the FarmLink marketplace.",
        )
    elif new_status == ListingStatus.REJECTED:
        reason_text = f" Reason: {moderation_reason}" if moderation_reason else ""
        create_notification(
            db=db,
            recipient_id=product.farmer_id,
            type=NotificationType.PRODUCT_REJECTED.value,
            title=f"Listing '{product.name}' Not Approved",
            message=f"Your listing for '{product.name}' could not be approved at this time.{reason_text}",
        )
