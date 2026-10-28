import math
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationRead,
    NotificationListResponse,
    UnreadCountResponse,
    NotificationBatchReadResponse,
)

router = APIRouter()


@router.get("", response_model=NotificationListResponse, summary="List Current User's Notifications")
def list_notifications(
    unread_only: Optional[bool] = Query(None, description="Filter for unread notifications only"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve paginated notifications belonging strictly to the authenticated user.
    Newest notifications are ordered first.
    """
    base_query = db.query(Notification).filter(Notification.recipient_id == current_user.id)

    # Compute unread count for the user regardless of filter
    unread_count = (
        db.query(func.count(Notification.id))
        .filter(Notification.recipient_id == current_user.id, Notification.is_read == False)
        .scalar()
        or 0
    )

    filtered_query = base_query
    if unread_only is True:
        filtered_query = filtered_query.filter(Notification.is_read == False)
    elif unread_only is False:
        filtered_query = filtered_query.filter(Notification.is_read == True)

    total = filtered_query.count()
    total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1

    skip = (page - 1) * page_size
    items = (
        filtered_query
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .offset(skip)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "unread_count": unread_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/unread-count", response_model=UnreadCountResponse, summary="Get Unread Notification Count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Quick count endpoint for Navbar badges and interval polling.
    """
    unread_count = (
        db.query(func.count(Notification.id))
        .filter(Notification.recipient_id == current_user.id, Notification.is_read == False)
        .scalar()
        or 0
    )
    return {"unread_count": unread_count}


@router.patch("/{notification_id}/read", response_model=NotificationRead, summary="Mark Notification as Read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a specific notification as read and set read_at timestamp.
    Returns 404 if notification does not exist or belongs to another user.
    """
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.recipient_id == current_user.id)
        .first()
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)

    return notification


@router.patch("/read-all", response_model=NotificationBatchReadResponse, summary="Mark All Notifications as Read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Bulk mark all unread notifications for the authenticated user as read.
    """
    now = datetime.now(timezone.utc)
    marked_count = (
        db.query(Notification)
        .filter(Notification.recipient_id == current_user.id, Notification.is_read == False)
        .update({"is_read": True, "read_at": now}, synchronize_session=False)
    )
    db.commit()

    return {
        "marked_count": marked_count,
        "unread_count": 0,
    }


@router.delete("/{notification_id}", summary="Delete Notification")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allow users to remove individual notifications from their notification history.
    """
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.recipient_id == current_user.id)
        .first()
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    db.delete(notification)
    db.commit()
    return {"success": True, "message": "Notification removed."}
