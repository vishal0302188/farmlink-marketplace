import pytest
from fastapi.testclient import TestClient
from app.models.user import User, UserRole
from app.models.product import Product, ListingStatus
from app.models.order import Order, OrderStatus
from app.models.notification import Notification, NotificationType
from app.core.security import create_access_token, get_password_hash


def create_test_user(client: TestClient, db_session, email: str, role: UserRole) -> str:
    user = db_session.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash("Password123!"),
            full_name=f"Test {role.value.capitalize()}",
            role=role,
            is_verified=True,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

    client.cookies.clear()
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return token


def test_anonymous_access_rejected(client: TestClient):
    client.cookies.clear()
    endpoints = [
        ("GET", "/api/v1/notifications"),
        ("GET", "/api/v1/notifications/unread-count"),
        ("PATCH", "/api/v1/notifications/1/read"),
        ("PATCH", "/api/v1/notifications/read-all"),
        ("DELETE", "/api/v1/notifications/1"),
    ]
    for method, ep in endpoints:
        if method == "GET":
            res = client.get(ep)
        elif method == "PATCH":
            res = client.patch(ep)
        elif method == "DELETE":
            res = client.delete(ep)
        assert res.status_code == 401, f"Expected 401 for {method} {ep}, got {res.status_code}"


def test_user_notification_listing_and_unread_counts(client: TestClient, db_session):
    buyer_token = create_test_user(client, db_session, "notif_buyer1@farmlink.org", UserRole.BUYER)
    headers = {"Authorization": f"Bearer {buyer_token}"}

    # Fetch buyer user ID
    me = client.get("/api/v1/auth/me", headers=headers).json()
    buyer_id = me["id"]

    # Insert 3 notifications for this buyer (2 unread, 1 read)
    n1 = Notification(
        recipient_id=buyer_id,
        type=NotificationType.ORDER_CREATED.value,
        title="Order Placed",
        message="Your order #101 was placed.",
        is_read=False,
    )
    n2 = Notification(
        recipient_id=buyer_id,
        type=NotificationType.ORDER_ACCEPTED.value,
        title="Order Accepted",
        message="Your order #101 was accepted.",
        is_read=False,
    )
    n3 = Notification(
        recipient_id=buyer_id,
        type=NotificationType.SYSTEM_ALERT.value,
        title="Welcome to FarmLink",
        message="Welcome to direct farm commerce.",
        is_read=True,
    )
    db_session.add_all([n1, n2, n3])
    db_session.commit()

    # 1. Test unread count endpoint
    res_count = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert res_count.status_code == 200
    assert res_count.json()["unread_count"] >= 2

    # 2. Test list all notifications
    res_list = client.get("/api/v1/notifications", headers=headers)
    assert res_list.status_code == 200
    data = res_list.json()
    assert data["total"] >= 3
    assert data["unread_count"] >= 2
    assert len(data["items"]) >= 3

    # 3. Test filter unread_only=true
    res_unread = client.get("/api/v1/notifications?unread_only=true", headers=headers)
    assert res_unread.status_code == 200
    unread_data = res_unread.json()
    assert all(item["is_read"] is False for item in unread_data["items"])


def test_mark_single_notification_read_and_ownership_isolation(client: TestClient, db_session):
    buyer_token = create_test_user(client, db_session, "notif_buyer2@farmlink.org", UserRole.BUYER)
    other_token = create_test_user(client, db_session, "notif_other@farmlink.org", UserRole.BUYER)

    b_headers = {"Authorization": f"Bearer {buyer_token}"}
    o_headers = {"Authorization": f"Bearer {other_token}"}

    b_id = client.get("/api/v1/auth/me", headers=b_headers).json()["id"]
    o_id = client.get("/api/v1/auth/me", headers=o_headers).json()["id"]

    # Create notification for buyer
    notif = Notification(
        recipient_id=b_id,
        type=NotificationType.ORDER_READY.value,
        title="Order Ready",
        message="Order is ready for pickup.",
        is_read=False,
    )
    db_session.add(notif)
    db_session.commit()
    db_session.refresh(notif)

    # 1. Other user tries to mark it as read -> must return 404 Not Found (no info leak)
    fail_res = client.patch(f"/api/v1/notifications/{notif.id}/read", headers=o_headers)
    assert fail_res.status_code == 404

    # 2. Owner marks it as read -> 200 OK
    ok_res = client.patch(f"/api/v1/notifications/{notif.id}/read", headers=b_headers)
    assert ok_res.status_code == 200
    res_data = ok_res.json()
    assert res_data["is_read"] is True
    assert res_data["read_at"] is not None


def test_mark_all_notifications_read(client: TestClient, db_session):
    buyer_token = create_test_user(client, db_session, "notif_buyer3@farmlink.org", UserRole.BUYER)
    headers = {"Authorization": f"Bearer {buyer_token}"}
    b_id = client.get("/api/v1/auth/me", headers=headers).json()["id"]

    # Insert 3 unread notifications
    for i in range(3):
        db_session.add(Notification(
            recipient_id=b_id,
            type=NotificationType.ORDER_CREATED.value,
            title=f"Update #{i}",
            message=f"Message #{i}",
            is_read=False,
        ))
    db_session.commit()

    # Mark all read
    res = client.patch("/api/v1/notifications/read-all", headers=headers)
    assert res.status_code == 200
    assert res.json()["unread_count"] == 0
    assert res.json()["marked_count"] >= 3

    # Verify unread count is 0
    c_res = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert c_res.json()["unread_count"] == 0


def test_order_creation_triggers_notifications(client: TestClient, db_session):
    farmer_token = create_test_user(client, db_session, "farmer_ord_notif@farmlink.org", UserRole.FARMER)
    buyer_token = create_test_user(client, db_session, "buyer_ord_notif@farmlink.org", UserRole.BUYER)

    f_headers = {"Authorization": f"Bearer {farmer_token}"}
    b_headers = {"Authorization": f"Bearer {buyer_token}"}

    f_id = client.get("/api/v1/auth/me", headers=f_headers).json()["id"]
    b_id = client.get("/api/v1/auth/me", headers=b_headers).json()["id"]

    # Farmer creates product
    prod_res = client.post("/api/v1/farmer/products", json={
        "name": "Kashmir Cherries",
        "description": "Sweet red cherries",
        "category": "fruits",
        "price": 250.0,
        "unit": "kg",
        "available_quantity": 80.0,
        "minimum_order_quantity": 5.0,
        "growing_location": "Srinagar, J&K",
        "is_organic": True,
    }, headers=f_headers)
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    # Buyer creates order
    order_res = client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod_id, "quantity": 10.0}],
        "fulfillment_method": "temperature_controlled_freight",
        "delivery_address": "77 Civil Lines",
        "delivery_city": "Delhi",
        "delivery_state": "Delhi",
        "delivery_pincode": "110054",
    }, headers=b_headers)
    assert order_res.status_code == 201
    order_id = order_res.json()["id"]

    # Verify farmer received notification
    f_notifs = client.get("/api/v1/notifications", headers=f_headers).json()["items"]
    assert any(n["order_id"] == order_id and n["type"] == NotificationType.ORDER_CREATED.value for n in f_notifs)

    # Verify buyer received confirmation notification
    b_notifs = client.get("/api/v1/notifications", headers=b_headers).json()["items"]
    assert any(n["order_id"] == order_id and n["type"] == NotificationType.ORDER_CREATED.value for n in b_notifs)


def test_order_lifecycle_notifications_accept_ready_complete(client: TestClient, db_session):
    farmer_token = create_test_user(client, db_session, "farmer_flow_notif@farmlink.org", UserRole.FARMER)
    buyer_token = create_test_user(client, db_session, "buyer_flow_notif@farmlink.org", UserRole.BUYER)

    f_headers = {"Authorization": f"Bearer {farmer_token}"}
    b_headers = {"Authorization": f"Bearer {buyer_token}"}

    # Farmer creates product
    prod = client.post("/api/v1/farmer/products", json={
        "name": "Golden Saffron",
        "description": "Pure organic saffron",
        "category": "herbs_spices",
        "price": 400.0,
        "unit": "piece",
        "available_quantity": 50.0,
        "minimum_order_quantity": 1.0,
        "growing_location": "Pampore, J&K",
        "is_organic": True,
    }, headers=f_headers).json()

    # Buyer creates order
    order = client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod["id"], "quantity": 2.0}],
        "fulfillment_method": "temperature_controlled_freight",
    }, headers=b_headers).json()
    order_id = order["id"]

    # 1. Farmer accepts order
    acc_res = client.patch(f"/api/v1/farmer/orders/{order_id}/accept", headers=f_headers)
    assert acc_res.status_code == 200

    b_notifs = client.get("/api/v1/notifications", headers=b_headers).json()["items"]
    assert any(n["order_id"] == order_id and n["type"] == NotificationType.ORDER_ACCEPTED.value for n in b_notifs)

    # 2. Farmer marks order ready
    ready_res = client.patch(f"/api/v1/farmer/orders/{order_id}/ready", headers=f_headers)
    assert ready_res.status_code == 200

    b_notifs = client.get("/api/v1/notifications", headers=b_headers).json()["items"]
    assert any(n["order_id"] == order_id and n["type"] == NotificationType.ORDER_READY.value for n in b_notifs)

    # 3. Farmer completes order
    comp_res = client.patch(f"/api/v1/farmer/orders/{order_id}/complete", headers=f_headers)
    assert comp_res.status_code == 200

    b_notifs = client.get("/api/v1/notifications", headers=b_headers).json()["items"]
    assert any(n["order_id"] == order_id and n["type"] == NotificationType.ORDER_COMPLETED.value for n in b_notifs)


def test_order_cancellation_and_rejection_notifications(client: TestClient, db_session):
    farmer_token = create_test_user(client, db_session, "farmer_cancel_notif@farmlink.org", UserRole.FARMER)
    buyer_token = create_test_user(client, db_session, "buyer_cancel_notif@farmlink.org", UserRole.BUYER)

    f_headers = {"Authorization": f"Bearer {farmer_token}"}
    b_headers = {"Authorization": f"Bearer {buyer_token}"}

    prod = client.post("/api/v1/farmer/products", json={
        "name": "Nagpur Oranges",
        "description": "Juicy citrus oranges",
        "category": "fruits",
        "price": 90.0,
        "unit": "kg",
        "available_quantity": 100.0,
        "minimum_order_quantity": 10.0,
        "growing_location": "Nagpur, Maharashtra",
        "is_organic": False,
    }, headers=f_headers).json()

    # Case 1: Farmer rejects order
    ord1 = client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod["id"], "quantity": 15.0}],
        "fulfillment_method": "direct_local_delivery",
    }, headers=b_headers).json()

    rej_res = client.patch(f"/api/v1/farmer/orders/{ord1['id']}/reject?reason=FrostDamage", headers=f_headers)
    assert rej_res.status_code == 200

    b_notifs = client.get("/api/v1/notifications", headers=b_headers).json()["items"]
    assert any(n["order_id"] == ord1["id"] and n["type"] == NotificationType.ORDER_REJECTED.value for n in b_notifs)

    # Case 2: Buyer cancels order
    ord2 = client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod["id"], "quantity": 10.0}],
        "fulfillment_method": "direct_local_delivery",
    }, headers=b_headers).json()

    cancel_res = client.patch(f"/api/v1/orders/{ord2['id']}/cancel", json={"notes": "Changed mind"}, headers=b_headers)
    assert cancel_res.status_code == 200

    f_notifs = client.get("/api/v1/notifications", headers=f_headers).json()["items"]
    assert any(n["order_id"] == ord2["id"] and n["type"] == NotificationType.ORDER_CANCELLED.value for n in f_notifs)


def test_admin_product_moderation_notifications(client: TestClient, db_session):
    admin_token = create_test_user(client, db_session, "admin_notif@farmlink.org", UserRole.ADMIN)
    farmer_token = create_test_user(client, db_session, "farmer_mod_notif@farmlink.org", UserRole.FARMER)

    a_headers = {"Authorization": f"Bearer {admin_token}"}
    f_headers = {"Authorization": f"Bearer {farmer_token}"}

    # Farmer creates a new product
    prod = client.post("/api/v1/farmer/products", json={
        "name": "Alphonso Mangoes",
        "description": "Ratnagiri GI tagged mangoes",
        "category": "fruits",
        "price": 800.0,
        "unit": "crate",
        "available_quantity": 20.0,
        "minimum_order_quantity": 1.0,
        "growing_location": "Ratnagiri, Maharashtra",
        "is_organic": True,
    }, headers=f_headers).json()

    # Admin approves product
    app_res = client.patch(f"/api/v1/admin/products/{prod['id']}/moderate", json={
        "listing_status": "active",
        "moderation_reason": "Verified GI tag certificate",
        "is_active": True,
    }, headers=a_headers)
    assert app_res.status_code == 200

    # Farmer should receive product approved notification
    f_notifs = client.get("/api/v1/notifications", headers=f_headers).json()["items"]
    assert any(n["type"] == NotificationType.PRODUCT_APPROVED.value for n in f_notifs)
