import pytest
from fastapi.testclient import TestClient

from app.core.security import get_password_hash
from app.models.user import User, UserRole, BuyerType
from app.models.product import Product, ListingStatus, ProductCategory, UnitType
from app.models.order import Order, OrderStatus, OrderItem


def create_user_and_token(client: TestClient, db_session, email: str, role: UserRole) -> str:
    user = User(
        email=email,
        full_name=f"Test {role.value.capitalize()}",
        hashed_password=get_password_hash("SecurePassword123!"),
        role=role,
        buyer_type=BuyerType.HOUSEHOLD if role == UserRole.BUYER else None,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    return login_res.json()["access_token"]


def test_admin_access_allowed_and_overview(client: TestClient, db_session):
    admin_token = create_user_and_token(client, db_session, "admin_overview@farmlink.org", UserRole.ADMIN)
    headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.get("/api/v1/admin/overview", headers=headers)
    assert res.status_code == 200, f"Failed to get admin overview: {res.text}"
    data = res.json()

    assert "total_farmers" in data
    assert "total_buyers" in data
    assert "active_products" in data
    assert "pending_moderation_products" in data
    assert "total_orders" in data
    assert "completed_orders" in data
    assert isinstance(data["recent_orders"], list)
    assert isinstance(data["recent_users"], list)


def test_buyers_and_farmers_forbidden_from_admin_endpoints(client: TestClient, db_session):
    buyer_token = create_user_and_token(client, db_session, "buyer_forbidden_admin@farmlink.org", UserRole.BUYER)
    farmer_token = create_user_and_token(client, db_session, "farmer_forbidden_admin@farmlink.org", UserRole.FARMER)

    admin_endpoints = [
        "/api/v1/admin/overview",
        "/api/v1/admin/products",
        "/api/v1/admin/users",
        "/api/v1/admin/orders",
    ]

    for ep in admin_endpoints:
        # Buyer access must be 403
        b_res = client.get(ep, headers={"Authorization": f"Bearer {buyer_token}"})
        assert b_res.status_code == 403, f"Buyer was not forbidden from {ep}: {b_res.status_code}"

        # Farmer access must be 403
        f_res = client.get(ep, headers={"Authorization": f"Bearer {farmer_token}"})
        assert f_res.status_code == 403, f"Farmer was not forbidden from {ep}: {f_res.status_code}"

        # Unauthenticated access must be 401
        client.cookies.clear()
        u_res = client.get(ep)
        assert u_res.status_code == 401, f"Unauthenticated was not 401 from {ep}: {u_res.status_code}"


def test_public_registration_rejects_admin_role(client: TestClient):
    res = client.post("/api/v1/auth/register", json={
        "email": "infiltrator_admin@evil.org",
        "password": "Password123!",
        "full_name": "Wannabe Admin",
        "role": "admin"
    })
    assert res.status_code == 403, f"Expected 403 on admin registration, got {res.status_code}"


def test_product_approval_and_rejection_moderation(client: TestClient, db_session):
    admin_token = create_user_and_token(client, db_session, "admin_mod@farmlink.org", UserRole.ADMIN)
    farmer_token = create_user_and_token(client, db_session, "farmer_mod@farmlink.org", UserRole.FARMER)

    # Farmer creates a new product
    prod_res = client.post("/api/v1/farmer/products", json={
        "name": "Organic Honeycrisp Apples",
        "description": "Premium sweet crisp apples",
        "category": "fruits",
        "price": 180.0,
        "unit": "kg",
        "available_quantity": 250.0,
        "minimum_order_quantity": 10.0,
        "growing_location": "Kinnaur, Himachal Pradesh",
        "is_organic": True,
    }, headers={"Authorization": f"Bearer {farmer_token}"})
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin rejects listing with moderation reason
    rej_res = client.patch(f"/api/v1/admin/products/{prod_id}/moderate", json={
        "listing_status": "rejected",
        "moderation_reason": "Incomplete organic certification uploaded.",
        "is_active": False,
    }, headers=admin_headers)
    assert rej_res.status_code == 200
    rej_data = rej_res.json()
    assert rej_data["listing_status"] == "rejected"
    assert rej_data["is_active"] is False
    assert rej_data["moderation_reason"] == "Incomplete organic certification uploaded."

    # Public catalog check: Rejected product MUST NOT appear in public catalog
    pub_res = client.get(f"/api/v1/products/{prod_id}")
    assert pub_res.status_code == 404

    # Search check: Rejected product must not appear in search results
    search_res = client.get("/api/v1/products/?search=Honeycrisp")
    assert search_res.status_code == 200
    assert not any(p["id"] == prod_id for p in search_res.json())

    # Admin approves listing after review
    app_res = client.patch(f"/api/v1/admin/products/{prod_id}/moderate", json={
        "listing_status": "active",
        "moderation_reason": "Certification verified by regional agricultural board.",
        "is_active": True,
    }, headers=admin_headers)
    assert app_res.status_code == 200
    app_data = app_res.json()
    assert app_data["listing_status"] == "active"
    assert app_data["is_active"] is True

    # Now it appears in public catalog
    pub_res_approved = client.get(f"/api/v1/products/{prod_id}")
    assert pub_res_approved.status_code == 200


def test_user_management_and_self_lockout_prevention(client: TestClient, db_session):
    admin_token = create_user_and_token(client, db_session, "admin_mgr@farmlink.org", UserRole.ADMIN)
    buyer_token = create_user_and_token(client, db_session, "buyer_to_suspend@farmlink.org", UserRole.BUYER)

    # Get admin user ID
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    admin_id = me_res.json()["id"]

    # Get buyer user ID
    buyer_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {buyer_token}"})
    buyer_id = buyer_me.json()["id"]

    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin lists users
    users_res = client.get("/api/v1/admin/users", headers=admin_headers)
    assert users_res.status_code == 200
    users_list = users_res.json()
    assert any(u["id"] == buyer_id for u in users_list)

    # Admin suspends buyer
    susp_res = client.patch(f"/api/v1/admin/users/{buyer_id}/status", json={"is_active": False}, headers=admin_headers)
    assert susp_res.status_code == 200
    assert susp_res.json()["is_active"] is False

    # Verify suspended buyer cannot login
    b_login = client.post("/api/v1/auth/login", json={
        "email": "buyer_to_suspend@farmlink.org",
        "password": "SecurePassword123!"
    })
    # Auth checks is_active
    assert b_login.status_code == 400
    assert "inactive" in b_login.json()["detail"].lower()

    # Admin reactivates buyer
    react_res = client.patch(f"/api/v1/admin/users/{buyer_id}/status", json={"is_active": True}, headers=admin_headers)
    assert react_res.status_code == 200
    assert react_res.json()["is_active"] is True

    # Self-lockout prevention: Admin cannot deactivate themselves!
    self_lockout_res = client.patch(f"/api/v1/admin/users/{admin_id}/status", json={"is_active": False}, headers=admin_headers)
    assert self_lockout_res.status_code == 400
    assert "cannot deactivate their own administrative account" in self_lockout_res.json()["detail"].lower()


def test_admin_order_oversight_and_safe_transitions(client: TestClient, db_session):
    admin_token = create_user_and_token(client, db_session, "admin_orders@farmlink.org", UserRole.ADMIN)
    farmer_token = create_user_and_token(client, db_session, "farmer_ord@farmlink.org", UserRole.FARMER)
    buyer_token = create_user_and_token(client, db_session, "buyer_ord@farmlink.org", UserRole.BUYER)

    # Farmer creates product
    prod = client.post("/api/v1/farmer/products", json={
        "name": "Kashmiri Walnuts",
        "description": "In-shell organic walnuts",
        "category": "specialty",
        "price": 500.0,
        "unit": "kg",
        "available_quantity": 100.0,
        "minimum_order_quantity": 5.0,
        "growing_location": "Srinagar, Jammu & Kashmir",
    }, headers={"Authorization": f"Bearer {farmer_token}"}).json()
    prod_id = prod["id"]

    # Buyer places order for 10 kg (stock: 100 -> 90)
    order = client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod_id, "quantity": 10.0}]
    }, headers={"Authorization": f"Bearer {buyer_token}"}).json()
    order_id = order["id"]

    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin lists orders
    res = client.get(f"/api/v1/admin/orders?search={order_id}", headers=admin_headers)
    assert res.status_code == 200
    orders_data = res.json()
    assert any(o["id"] == order_id for o in orders_data)

    # Admin inspects single order
    res_detail = client.get(f"/api/v1/admin/orders/{order_id}", headers=admin_headers)
    assert res_detail.status_code == 200
    assert res_detail.json()["id"] == order_id

    # Admin confirms order (PENDING -> CONFIRMED)
    res_conf = client.patch(f"/api/v1/admin/orders/{order_id}/status", json={
        "status": "confirmed",
        "notes": "Verified by administrative dispatch desk"
    }, headers=admin_headers)
    assert res_conf.status_code == 200
    assert res_conf.json()["status"] == "confirmed"

    # Admin cancels order with stock restoration
    res_cancel = client.patch(f"/api/v1/admin/orders/{order_id}/status", json={
        "status": "cancelled",
        "notes": "Cancelled due to road closure in high altitude pass"
    }, headers=admin_headers)
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "cancelled"

    # Verify stock restored back to 100
    p_check = client.get(f"/api/v1/products/{prod_id}").json()
    assert p_check["available_quantity"] == 100.0
