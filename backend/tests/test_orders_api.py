import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.models.user import User, UserRole, BuyerType
from app.models.product import Product, ProductCategory, UnitType, ListingStatus
from app.models.order import Order, OrderStatus, OrderItem, FulfillmentMethod


def register_and_get_token(client: TestClient, email: str, role: str = "buyer", buyer_type: str = "restaurant") -> str:
    res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "ValidPassword123!",
        "full_name": f"User {email}",
        "role": role,
        "buyer_type": buyer_type if role == "buyer" else None,
        "organization_name": "Test Org",
    })
    assert res.status_code == 201, f"Failed to register {email}: {res.text}"
    return res.json()["access_token"]


def test_buyer_successful_order_placement(client: TestClient, db_session):
    buyer_token = register_and_get_token(client, "buyer_order_test@farmlink.org", "buyer", "restaurant")
    
    # Pick a seeded product from DB
    product = db_session.query(Product).filter(
        Product.listing_status == ListingStatus.ACTIVE,
        Product.is_active == True,
        Product.available_quantity >= 50
    ).first()
    assert product is not None

    initial_stock = float(product.available_quantity)
    unit_price = float(product.price)
    order_qty = float(product.minimum_order_quantity) + 5.0
    expected_subtotal = round(unit_price * order_qty, 2)

    headers = {"Authorization": f"Bearer {buyer_token}"}
    order_payload = {
        "farmer_id": product.farmer_id,
        "fulfillment_method": "temperature_controlled_freight",
        "payment_method": "cash_on_delivery",
        "delivery_address": "123 Indiranagar, 100ft Road",
        "delivery_city": "Bengaluru",
        "delivery_state": "Karnataka",
        "delivery_pincode": "560038",
        "notes": "Please pack in wooden crates",
        "items": [
            {
                "product_id": product.id,
                "quantity": order_qty
            }
        ]
    }

    res = client.post("/api/v1/orders/", json=order_payload, headers=headers)
    assert res.status_code == 201, f"Order placement failed: {res.text}"
    data = res.json()

    assert data["id"] is not None
    assert data["status"] == "pending"
    assert data["total_amount"] == expected_subtotal
    assert data["farmer_id"] == product.farmer_id
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == order_qty
    assert data["items"][0]["unit_price_at_purchase"] == unit_price
    assert data["items"][0]["subtotal"] == expected_subtotal

    # Verify inventory was decremented in database
    db_session.refresh(product)
    expected_remaining_stock = round(initial_stock - order_qty, 2)
    assert float(product.available_quantity) == expected_remaining_stock


def test_buyer_view_own_orders_and_single_order(client: TestClient, db_session):
    buyer_token = register_and_get_token(client, "buyer_view_test@farmlink.org", "buyer", "household")
    headers = {"Authorization": f"Bearer {buyer_token}"}

    product = db_session.query(Product).filter(
        Product.listing_status == ListingStatus.ACTIVE,
        Product.available_quantity >= 20
    ).first()

    order_payload = {
        "items": [{"product_id": product.id, "quantity": float(product.minimum_order_quantity)}]
    }
    create_res = client.post("/api/v1/orders/", json=order_payload, headers=headers)
    assert create_res.status_code == 201
    order_id = create_res.json()["id"]

    # List orders
    list_res = client.get("/api/v1/orders/", headers=headers)
    assert list_res.status_code == 200
    orders = list_res.json()
    assert any(o["id"] == order_id for o in orders)

    # Get single order detail
    detail_res = client.get(f"/api/v1/orders/{order_id}", headers=headers)
    assert detail_res.status_code == 200
    order_detail = detail_res.json()
    assert order_detail["id"] == order_id
    assert order_detail["status"] == "pending"
    assert len(order_detail["items"]) >= 1


def test_cross_buyer_isolation(client: TestClient, db_session):
    buyer1_token = register_and_get_token(client, "buyer_iso1@farmlink.org", "buyer")
    buyer2_token = register_and_get_token(client, "buyer_iso2@farmlink.org", "buyer")

    product = db_session.query(Product).filter(Product.listing_status == ListingStatus.ACTIVE).first()
    create_res = client.post("/api/v1/orders/", json={
        "items": [{"product_id": product.id, "quantity": float(product.minimum_order_quantity)}]
    }, headers={"Authorization": f"Bearer {buyer1_token}"})
    assert create_res.status_code == 201
    order_id = create_res.json()["id"]

    # Buyer 2 attempts to fetch Buyer 1's order -> MUST BE 403 Forbidden
    cross_res = client.get(f"/api/v1/orders/{order_id}", headers={"Authorization": f"Bearer {buyer2_token}"})
    assert cross_res.status_code == 403


def test_cross_farmer_isolation(client: TestClient, db_session):
    farmer1_token = register_and_get_token(client, "farmer_iso1@farmlink.org", "farmer")
    farmer2_token = register_and_get_token(client, "farmer_iso2@farmlink.org", "farmer")
    buyer_token = register_and_get_token(client, "buyer_for_farmer_iso@farmlink.org", "buyer")

    # Farmer 1 creates a product
    prod_res = client.post("/api/v1/farmer/products", json={
        "name": "Organic Honeycomb",
        "description": "Pure mountain honeycomb",
        "category": "specialty",
        "price": 600.0,
        "unit": "kg",
        "available_quantity": 40.0,
        "minimum_order_quantity": 2.0,
        "growing_location": "Coorg, Karnataka",
        "is_organic": True,
    }, headers={"Authorization": f"Bearer {farmer1_token}"})
    assert prod_res.status_code == 201
    product_id = prod_res.json()["id"]

    # Buyer places order for Farmer 1's product
    order_res = client.post("/api/v1/orders/", json={
        "items": [{"product_id": product_id, "quantity": 5.0}]
    }, headers={"Authorization": f"Bearer {buyer_token}"})
    assert order_res.status_code == 201
    order_id = order_res.json()["id"]

    # Farmer 2 attempts to view or manage Farmer 1's order -> MUST BE 403 Forbidden
    res = client.get(f"/api/v1/farmer/orders/{order_id}", headers={"Authorization": f"Bearer {farmer2_token}"})
    assert res.status_code == 403

    res_accept = client.patch(f"/api/v1/farmer/orders/{order_id}/accept", headers={"Authorization": f"Bearer {farmer2_token}"})
    assert res_accept.status_code == 403


def test_invalid_product_and_quantities(client: TestClient, db_session):
    buyer_token = register_and_get_token(client, "buyer_invalid_qty@farmlink.org", "buyer")
    headers = {"Authorization": f"Bearer {buyer_token}"}

    # Non-existent product ID
    res = client.post("/api/v1/orders/", json={"items": [{"product_id": 999999, "quantity": 10.0}]}, headers=headers)
    assert res.status_code == 404

    # Quantity below MOQ
    product = db_session.query(Product).filter(
        Product.listing_status == ListingStatus.ACTIVE,
        Product.minimum_order_quantity > 2.0
    ).first()
    if product:
        below_moq = float(product.minimum_order_quantity) - 1.0
        res = client.post("/api/v1/orders/", json={"items": [{"product_id": product.id, "quantity": below_moq}]}, headers=headers)
        assert res.status_code == 400
        assert "below the minimum order quantity" in res.json()["detail"].lower()


def test_insufficient_stock_rejection(client: TestClient, db_session):
    buyer_token = register_and_get_token(client, "buyer_stock_test@farmlink.org", "buyer")
    product = db_session.query(Product).filter(Product.listing_status == ListingStatus.ACTIVE).first()
    
    excess_qty = float(product.available_quantity) + 50000.0
    res = client.post("/api/v1/orders/", json={
        "items": [{"product_id": product.id, "quantity": excess_qty}]
    }, headers={"Authorization": f"Bearer {buyer_token}"})
    
    assert res.status_code == 400
    assert "insufficient" in res.json()["detail"].lower()


def test_inactive_product_rejection(client: TestClient, db_session):
    farmer_token = register_and_get_token(client, "farmer_inactive_test@farmlink.org", "farmer")
    buyer_token = register_and_get_token(client, "buyer_inactive_test@farmlink.org", "buyer")

    # Create and archive a product
    prod_res = client.post("/api/v1/farmer/products", json={
        "name": "Deactivated Spinach",
        "description": "Archived lot",
        "category": "vegetables",
        "price": 30.0,
        "unit": "kg",
        "available_quantity": 50.0,
        "minimum_order_quantity": 5.0,
        "growing_location": "Mysuru, Karnataka",
    }, headers={"Authorization": f"Bearer {farmer_token}"})
    prod_id = prod_res.json()["id"]

    # Archive it
    client.delete(f"/api/v1/farmer/products/{prod_id}", headers={"Authorization": f"Bearer {farmer_token}"})

    # Attempt to order
    res = client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod_id, "quantity": 10.0}]
    }, headers={"Authorization": f"Bearer {buyer_token}"})
    assert res.status_code == 400
    assert "inactive" in res.json()["detail"].lower()


def test_multi_farmer_checkout_atomic_split(client: TestClient, db_session):
    farmer1_token = register_and_get_token(client, "split_farmer1@farmlink.org", "farmer")
    farmer2_token = register_and_get_token(client, "split_farmer2@farmlink.org", "farmer")
    buyer_token = register_and_get_token(client, "split_buyer@farmlink.org", "buyer")

    prod1 = client.post("/api/v1/farmer/products", json={
        "name": "Farmer 1 Carrots", "description": "Fresh", "category": "vegetables",
        "price": 50.0, "unit": "kg", "available_quantity": 200.0, "minimum_order_quantity": 5.0,
        "growing_location": "Ooty, Tamil Nadu"
    }, headers={"Authorization": f"Bearer {farmer1_token}"}).json()

    prod2 = client.post("/api/v1/farmer/products", json={
        "name": "Farmer 2 Mangoes", "description": "Alphonso", "category": "fruits",
        "price": 200.0, "unit": "kg", "available_quantity": 150.0, "minimum_order_quantity": 10.0,
        "growing_location": "Ratnagiri, Maharashtra"
    }, headers={"Authorization": f"Bearer {farmer2_token}"}).json()

    # Checkout cart with both items
    res = client.post("/api/v1/orders/checkout", json={
        "items": [
            {"product_id": prod1["id"], "quantity": 10.0},
            {"product_id": prod2["id"], "quantity": 10.0},
        ],
        "delivery_address": "MG Road, Bengaluru",
        "payment_method": "cash_on_delivery"
    }, headers={"Authorization": f"Bearer {buyer_token}"})

    assert res.status_code == 201
    checkout_data = res.json()
    assert checkout_data["total_orders_placed"] == 2
    expected_total = (50.0 * 10.0) + (200.0 * 10.0)
    assert checkout_data["grand_total"] == expected_total
    assert len(checkout_data["orders"]) == 2


def test_order_lifecycle_accept_ready_complete(client: TestClient, db_session):
    farmer_token = register_and_get_token(client, "lifecycle_farmer@farmlink.org", "farmer")
    buyer_token = register_and_get_token(client, "lifecycle_buyer@farmlink.org", "buyer")

    prod = client.post("/api/v1/farmer/products", json={
        "name": "Fresh Strawberries", "description": "Mahabaleshwar", "category": "fruits",
        "price": 120.0, "unit": "kg", "available_quantity": 100.0, "minimum_order_quantity": 2.0,
        "growing_location": "Mahabaleshwar, Maharashtra"
    }, headers={"Authorization": f"Bearer {farmer_token}"}).json()

    order = client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod["id"], "quantity": 5.0}]
    }, headers={"Authorization": f"Bearer {buyer_token}"}).json()
    order_id = order["id"]
    assert order["status"] == "pending"

    f_headers = {"Authorization": f"Bearer {farmer_token}"}

    # Step 1: Farmer Accepts (PENDING -> CONFIRMED)
    res_accept = client.patch(f"/api/v1/farmer/orders/{order_id}/accept", headers=f_headers)
    assert res_accept.status_code == 200
    assert res_accept.json()["status"] == "confirmed"

    # Step 2: Farmer Marks Ready (CONFIRMED -> READY)
    res_ready = client.patch(f"/api/v1/farmer/orders/{order_id}/ready", headers=f_headers)
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"

    # Step 3: Farmer Completes (READY -> COMPLETED)
    res_complete = client.patch(f"/api/v1/farmer/orders/{order_id}/complete", headers=f_headers)
    assert res_complete.status_code == 200
    assert res_complete.json()["status"] == "completed"

    # Terminal state check: cannot re-accept completed order
    res_repeat = client.patch(f"/api/v1/farmer/orders/{order_id}/accept", headers=f_headers)
    assert res_repeat.status_code == 400


def test_order_cancellation_and_stock_restoration(client: TestClient, db_session):
    farmer_token = register_and_get_token(client, "cancel_farmer@farmlink.org", "farmer")
    buyer_token = register_and_get_token(client, "cancel_buyer@farmlink.org", "buyer")

    prod = client.post("/api/v1/farmer/products", json={
        "name": "Sweet Corn", "description": "Golden sweet corn", "category": "vegetables",
        "price": 45.0, "unit": "kg", "available_quantity": 100.0, "minimum_order_quantity": 5.0,
        "growing_location": "Hassan, Karnataka"
    }, headers={"Authorization": f"Bearer {farmer_token}"}).json()
    prod_id = prod["id"]

    # Place order for 20 kg
    order = client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod_id, "quantity": 20.0}]
    }, headers={"Authorization": f"Bearer {buyer_token}"}).json()
    order_id = order["id"]

    # Check inventory was deducted: 100 - 20 = 80
    check_prod = client.get(f"/api/v1/products/{prod_id}").json()
    assert check_prod["available_quantity"] == 80.0

    # Buyer cancels order
    cancel_res = client.patch(f"/api/v1/orders/{order_id}/cancel", headers={"Authorization": f"Bearer {buyer_token}"})
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Check inventory was restored: 80 + 20 = 100
    restored_prod = client.get(f"/api/v1/products/{prod_id}").json()
    assert restored_prod["available_quantity"] == 100.0

    # Repeat cancellation must be rejected with 400 (prevents double restoration)
    res_repeat = client.patch(f"/api/v1/orders/{order_id}/cancel", headers={"Authorization": f"Bearer {buyer_token}"})
    assert res_repeat.status_code == 400
    # Confirm stock remains 100
    final_prod = client.get(f"/api/v1/products/{prod_id}").json()
    assert final_prod["available_quantity"] == 100.0


def test_farmer_rejection_and_stock_restoration(client: TestClient, db_session):
    farmer_token = register_and_get_token(client, "reject_farmer@farmlink.org", "farmer")
    buyer_token = register_and_get_token(client, "reject_buyer@farmlink.org", "buyer")

    prod = client.post("/api/v1/farmer/products", json={
        "name": "Organic Tomatoes", "description": "Vine ripened", "category": "vegetables",
        "price": 35.0, "unit": "kg", "available_quantity": 200.0, "minimum_order_quantity": 10.0,
        "growing_location": "Kolar, Karnataka"
    }, headers={"Authorization": f"Bearer {farmer_token}"}).json()
    prod_id = prod["id"]

    # Order 50 kg
    order = client.post("/api/v1/orders/", json={
        "items": [{"product_id": prod_id, "quantity": 50.0}]
    }, headers={"Authorization": f"Bearer {buyer_token}"}).json()
    order_id = order["id"]

    check_prod = client.get(f"/api/v1/products/{prod_id}").json()
    assert check_prod["available_quantity"] == 150.0

    # Farmer rejects order
    reject_res = client.patch(
        f"/api/v1/farmer/orders/{order_id}/reject?reason=Frost+damage+prevented+harvest",
        headers={"Authorization": f"Bearer {farmer_token}"}
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "rejected"

    # Verify stock restored to 200
    restored_prod = client.get(f"/api/v1/products/{prod_id}").json()
    assert restored_prod["available_quantity"] == 200.0


def test_farmer_and_admin_cannot_create_orders(client: TestClient, db_session):
    farmer_token = register_and_get_token(client, "order_test_farmer@farmlink.org", "farmer")
    
    # Get or create an admin token
    from app.core.security import get_password_hash, create_access_token
    admin_user = db_session.query(User).filter(User.role == UserRole.ADMIN).first()
    if not admin_user:
        admin_user = User(
            email="admin_order_test@farmlink.org",
            hashed_password=get_password_hash("AdminPassword123!"),
            full_name="Admin User",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
        db_session.add(admin_user)
        db_session.commit()
        db_session.refresh(admin_user)
    
    admin_token = create_access_token(data={"sub": str(admin_user.id)})

    product = db_session.query(Product).filter(
        Product.listing_status == ListingStatus.ACTIVE,
        Product.available_quantity >= 10
    ).first()

    payload = {
        "items": [{"product_id": product.id, "quantity": float(product.minimum_order_quantity)}]
    }

    # Farmer attempting POST /api/v1/orders/ -> 403 Forbidden
    res_f1 = client.post("/api/v1/orders/", json=payload, headers={"Authorization": f"Bearer {farmer_token}"})
    assert res_f1.status_code == 403
    assert "Buyer account required" in res_f1.json()["detail"]

    # Farmer attempting POST /api/v1/orders/checkout -> 403 Forbidden
    res_f2 = client.post("/api/v1/orders/checkout", json=payload, headers={"Authorization": f"Bearer {farmer_token}"})
    assert res_f2.status_code == 403
    assert "Buyer account required" in res_f2.json()["detail"]

    # Admin attempting POST /api/v1/orders/ -> 403 Forbidden (No implicit buyer privilege)
    res_a1 = client.post("/api/v1/orders/", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_a1.status_code == 403
    assert "Buyer account required" in res_a1.json()["detail"]

    # Admin attempting POST /api/v1/orders/checkout -> 403 Forbidden
    res_a2 = client.post("/api/v1/orders/checkout", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_a2.status_code == 403
    assert "Buyer account required" in res_a2.json()["detail"]

    # Unauthenticated guest attempting order -> 401 Unauthorized
    client.cookies.clear()
    res_guest = client.post("/api/v1/orders/", json=payload)
    assert res_guest.status_code == 401
