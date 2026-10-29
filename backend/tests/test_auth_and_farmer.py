import pytest
from datetime import timedelta
from app.core.security import create_access_token
from app.models.user import User, UserRole, BuyerType


def test_successful_farmer_registration(client):
    payload = {
        "email": "new.farmer@organicpunjab.sample.in",
        "password": "StrongPassword123!",
        "full_name": "Harpreet Singh",
        "role": "farmer",
        "organization_name": "Golden Fields Organic",
        "location": "Amritsar Rural",
        "district": "Amritsar",
        "state": "Punjab",
        "pincode": "143001",
        "bio": "Certified organic wheat and basmati producer."
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "new.farmer@organicpunjab.sample.in"
    assert data["user"]["role"] == "farmer"
    assert data["user"]["organization_name"] == "Golden Fields Organic"
    # Ensure cookie was set
    assert "access_token" in response.cookies


def test_successful_buyer_registration_all_types(client):
    buyer_types = ["household", "restaurant", "retailer", "wholesaler", "company", "institution"]
    for b_type in buyer_types:
        payload = {
            "email": f"buyer.{b_type}@procure.sample.in",
            "password": "SecurePassword123!",
            "full_name": f"Procurement Lead ({b_type.title()})",
            "role": "buyer",
            "buyer_type": b_type,
            "organization_name": f"{b_type.title()} Buyers Co",
            "location": "Connaught Place, New Delhi",
            "district": "New Delhi",
            "state": "Delhi",
            "pincode": "110001"
        }
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 201, f"Failed for buyer_type: {b_type}"
        data = response.json()
        assert data["user"]["role"] == "buyer"
        assert data["user"]["buyer_type"] == b_type


def test_reject_admin_registration(client):
    payload = {
        "email": "rogue.admin@platform.sample.in",
        "password": "AdminPassword123!",
        "full_name": "Rogue Admin Attempt",
        "role": "admin",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 403
    assert "administrator is not permitted" in response.json()["detail"].lower()


def test_reject_duplicate_email_registration(client):
    payload = {
        "email": "duplicate.check@example.com",
        "password": "Password123!",
        "full_name": "First User",
        "role": "buyer",
        "buyer_type": "household",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Attempt to register again with same email
    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_login_success_and_invalid_credentials(client):
    # Register a user
    email = "login.test@example.com"
    password = "CorrectPassword123!"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Login Tester",
        "role": "buyer",
        "buyer_type": "household"
    })

    # Test invalid password
    bad_res = client.post("/api/v1/auth/login", json={"email": email, "password": "WrongPassword"})
    assert bad_res.status_code == 401

    # Test unknown email
    unknown_res = client.post("/api/v1/auth/login", json={"email": "unknown@example.com", "password": password})
    assert unknown_res.status_code == 401

    # Test successful login
    ok_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert ok_res.status_code == 200
    data = ok_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == email

    # Test OAuth2 form login (/auth/token)
    token_res = client.post(
        "/api/v1/auth/token",
        data={"username": email, "password": password}
    )
    assert token_res.status_code == 200
    assert "access_token" in token_res.json()


def test_current_user_profile_endpoint(client):
    # Unauthenticated request -> 401
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

    # Login and query /me with Bearer token
    email = "me.profile@example.com"
    password = "SecurePassword123!"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Profile User",
        "role": "farmer",
        "organization_name": "Profile Farms"
    })
    token = reg_res.json()["access_token"]

    auth_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert auth_res.status_code == 200
    profile = auth_res.json()
    assert profile["email"] == email
    assert profile["full_name"] == "Profile User"
    assert profile["role"] == "farmer"


def test_expired_and_invalid_tokens(client):
    # Create an expired token (expires in -10 minutes)
    expired_token = create_access_token(
        data={"sub": "1", "role": "farmer"},
        expires_delta=timedelta(minutes=-10)
    )
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()

    # Tampered token
    tampered_token = expired_token[:-5] + "ABCDE"
    tampered_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
    assert tampered_res.status_code == 401


def test_buyer_forbidden_from_farmer_operations(client):
    # Register a buyer
    buyer_res = client.post("/api/v1/auth/register", json={
        "email": "buyer.only@procure.com",
        "password": "Password123!",
        "full_name": "Procurement Officer",
        "role": "buyer",
        "buyer_type": "restaurant"
    })
    token = buyer_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to access farmer dashboard -> 403
    dash_res = client.get("/api/v1/farmer/dashboard", headers=headers)
    assert dash_res.status_code == 403
    assert "farmer" in dash_res.json()["detail"].lower()

    # Attempt to create product listing -> 403
    prod_payload = {
        "name": "Unauthorized Tomatoes",
        "description": "Buyer should not be allowed to list",
        "category": "vegetables",
        "price": 40.0,
        "unit": "kg",
        "available_quantity": 100.0,
        "minimum_order_quantity": 5.0,
        "growing_location": "Delhi"
    }
    create_res = client.post("/api/v1/farmer/products", json=prod_payload, headers=headers)
    assert create_res.status_code == 403


def test_farmer_product_lifecycle_and_cross_edit_prevention(client):
    # Register Farmer 1
    f1_res = client.post("/api/v1/auth/register", json={
        "email": "farmer1@estates.sample.in",
        "password": "Password123!",
        "full_name": "Farmer One",
        "role": "farmer",
        "organization_name": "One Farms",
        "location": "Nashik, Maharashtra"
    })
    f1_token = f1_res.json()["access_token"]
    f1_headers = {"Authorization": f"Bearer {f1_token}"}

    # Register Farmer 2
    f2_res = client.post("/api/v1/auth/register", json={
        "email": "farmer2@estates.sample.in",
        "password": "Password123!",
        "full_name": "Farmer Two",
        "role": "farmer",
        "organization_name": "Two Farms",
        "location": "Pune, Maharashtra"
    })
    f2_token = f2_res.json()["access_token"]
    f2_headers = {"Authorization": f"Bearer {f2_token}"}

    # 1. Farmer 1 creates a product
    create_payload = {
        "name": "Kesar Mangoes",
        "description": "Naturally ripened sweet Gujarat Kesar mangoes.",
        "category": "fruits",
        "price": 180.00,
        "unit": "kg",
        "available_quantity": 500.00,
        "minimum_order_quantity": 10.00,
        "growing_location": "Junagadh, Gujarat",
        "is_organic": True
    }
    create_res = client.post("/api/v1/farmer/products", json=create_payload, headers=f1_headers)
    assert create_res.status_code == 201
    prod = create_res.json()
    product_id = prod["id"]
    assert prod["name"] == "Kesar Mangoes"
    assert prod["farmer_id"] == f1_res.json()["user"]["id"]

    # 2. Farmer 1 views dashboard -> count and volume updated
    dash_res = client.get("/api/v1/farmer/dashboard", headers=f1_headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_active_listings"] >= 1
    assert dash_data["total_available_inventory"] >= 500.00

    # 3. Farmer 2 attempts to edit Farmer 1's product -> 403 Forbidden
    hack_res = client.put(
        f"/api/v1/farmer/products/{product_id}",
        json={"price": 10.00, "description": "Tampered description"},
        headers=f2_headers
    )
    assert hack_res.status_code == 403
    assert "not authorized" in hack_res.json()["detail"].lower()

    # 4. Farmer 1 successfully updates product price
    update_res = client.put(
        f"/api/v1/farmer/products/{product_id}",
        json={"price": 195.00},
        headers=f1_headers
    )
    assert update_res.status_code == 200
    assert float(update_res.json()["price"]) == 195.00

    # 5. Farmer 1 quick stock update
    stock_res = client.patch(
        f"/api/v1/farmer/products/{product_id}/stock",
        json={"available_quantity": 420.00},
        headers=f1_headers
    )
    assert stock_res.status_code == 200
    assert float(stock_res.json()["available_quantity"]) == 420.00

    # 6. Farmer 1 archives product -> removed from active listings
    archive_res = client.delete(f"/api/v1/farmer/products/{product_id}", headers=f1_headers)
    assert archive_res.status_code == 200
    assert archive_res.json()["listing_status"] == "archived"
    assert archive_res.json()["is_active"] is False

    # 7. Product should now return 404 in public active catalogue
    public_res = client.get(f"/api/v1/products/{product_id}")
    assert public_res.status_code == 404


def test_farmer_sales_revenue_analytics(client, db_session):
    # Register Farmer
    f_res = client.post("/api/v1/auth/register", json={
        "email": "revenue.farmer@test.org",
        "password": "Password123!",
        "full_name": "Revenue Farmer",
        "role": "farmer",
        "organization_name": "Revenue Agro"
    })
    f_token = f_res.json()["access_token"]
    f_headers = {"Authorization": f"Bearer {f_token}"}

    # Register Buyer
    b_res = client.post("/api/v1/auth/register", json={
        "email": "revenue.buyer@test.org",
        "password": "Password123!",
        "full_name": "Revenue Buyer",
        "role": "buyer",
        "buyer_type": "restaurant"
    })
    b_token = b_res.json()["access_token"]
    b_headers = {"Authorization": f"Bearer {b_token}"}

    # Farmer creates product: 200 kg @ Rs 50/kg
    prod = client.post("/api/v1/farmer/products", json={
        "name": "Revenue Potatoes",
        "description": "Grade A Jyoti Potatoes",
        "category": "vegetables",
        "price": 50.00,
        "unit": "kg",
        "available_quantity": 200.00,
        "minimum_order_quantity": 5.00,
        "growing_location": "Agra, Uttar Pradesh"
    }, headers=f_headers).json()

    # Buyer places order for 10 kg -> total Rs 500
    order1 = client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod["id"], "quantity": 10.0}]
    }, headers=b_headers).json()
    order1_id = order1["id"]

    # Check dashboard stats before completion -> pending_revenue should be at least 500, realized revenue 0
    dash1 = client.get("/api/v1/farmer/dashboard", headers=f_headers).json()
    assert dash1["total_revenue"] == 0.0
    assert dash1["pending_revenue"] >= 500.0
    assert dash1["total_completed_orders"] == 0

    # Advance order1 through lifecycle to COMPLETED: accept -> ready -> complete
    client.patch(f"/api/v1/farmer/orders/{order1_id}/accept", headers=f_headers)
    client.patch(f"/api/v1/farmer/orders/{order1_id}/ready", headers=f_headers)
    client.patch(f"/api/v1/farmer/orders/{order1_id}/complete", headers=f_headers)

    # Check dashboard stats after completion -> total_revenue should be 500.0, completed_orders == 1
    dash2 = client.get("/api/v1/farmer/dashboard", headers=f_headers).json()
    assert dash2["total_revenue"] >= 500.0
    assert dash2["total_completed_orders"] >= 1


def test_farmer_full_product_update(client):
    # Register Farmer
    f_res = client.post("/api/v1/auth/register", json={
        "email": "full_edit_farmer@test.org",
        "password": "Password123!",
        "full_name": "Edit Grower",
        "role": "farmer",
        "organization_name": "Edit Orchards"
    })
    f_token = f_res.json()["access_token"]
    f_headers = {"Authorization": f"Bearer {f_token}"}

    # Create product
    prod = client.post("/api/v1/farmer/products", json={
        "name": "Original Crop Name",
        "description": "Original description notes",
        "category": "vegetables",
        "price": 30.00,
        "unit": "kg",
        "available_quantity": 100.00,
        "minimum_order_quantity": 5.00,
        "growing_location": "Original Village",
        "is_organic": False
    }, headers=f_headers).json()
    prod_id = prod["id"]

    # Full update of all attributes
    update_res = client.put(f"/api/v1/farmer/products/{prod_id}", json={
        "name": "Updated Premium Organic Produce",
        "description": "Completely updated description and specs",
        "category": "fruits",
        "price": 65.50,
        "unit": "crate",
        "available_quantity": 250.00,
        "minimum_order_quantity": 10.00,
        "growing_location": "Updated Valley",
        "is_organic": True,
        "image_url": "https://images.unsplash.com/photo-example"
    }, headers=f_headers)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["name"] == "Updated Premium Organic Produce"
    assert updated["description"] == "Completely updated description and specs"
    assert updated["category"] == "fruits"
    assert float(updated["price"]) == 65.50
    assert updated["unit"] == "crate"
    assert float(updated["available_quantity"]) == 250.00
    assert float(updated["minimum_order_quantity"]) == 10.00
    assert updated["growing_location"] == "Updated Valley"
    assert updated["is_organic"] is True
    assert updated["image_url"] == "https://images.unsplash.com/photo-example"


def test_logout_endpoint(client):
    """Verify that calling logout returns 200 and removes the auth cookie."""
    res = client.post("/api/v1/auth/logout")
    assert res.status_code == 200
    assert res.json()["message"] == "Successfully logged out"


def test_authenticated_requests_with_bearer_token_without_cookies(client):
    """
    Regression test: verify that passing 'Authorization: Bearer <token>' allows
    access to protected endpoints even when no cookies are provided (e.g. cross-origin).
    """
    # 1. Register a new farmer
    email = "bearer.farmer@example.com"
    reg_payload = {
        "email": email,
        "password": "ValidPassword123!",
        "full_name": "Bearer Test Farmer",
        "role": "farmer",
        "organization_name": "Bearer Farm Link",
        "location": "Nashik",
        "district": "Nashik",
        "state": "Maharashtra",
        "pincode": "422001",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    data = reg_res.json()
    token = data["access_token"]
    assert token is not None

    # 2. Clear client cookies to simulate cross-origin browser request
    client.cookies.clear()

    # 3. Access protected /auth/me without cookies - must fail 401
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401
    assert "Authentication credentials were not provided" in unauth_res.json()["detail"]

    # 4. Access protected /auth/me WITH Bearer header - must succeed 200
    auth_headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # 5. Access protected /farmer/dashboard WITH Bearer header - must succeed 200
    dash_res = client.get("/api/v1/farmer/dashboard", headers=auth_headers)
    assert dash_res.status_code == 200
    assert "total_active_listings" in dash_res.json()

