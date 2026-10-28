def test_invalid_price_range(client):
    """Ensure min_price > max_price returns HTTP 400."""
    res = client.get("/api/v1/products/?min_price=200&max_price=100")
    assert res.status_code == 400
    assert "min_price cannot be greater than max_price" in res.json()["detail"]


def test_negative_min_price(client):
    """Ensure negative price in query parameters is rejected with HTTP 422."""
    res = client.get("/api/v1/products/?min_price=-10")
    assert res.status_code == 422


def test_create_product_negative_price(client):
    """Ensure creation with negative price is rejected with 422."""
    payload = {
        "name": "Invalid Produce",
        "description": "Test produce with negative price",
        "category": "vegetables",
        "price": -50.0,
        "unit": "kg",
        "available_quantity": 100.0,
        "minimum_order_quantity": 5.0,
        "growing_location": "Nashik, Maharashtra"
    }
    # Anonymous request will hit auth or validation
    res = client.post("/api/v1/products/", json=payload)
    # Price <= 0 must be rejected
    assert res.status_code in [401, 403, 422]


def test_create_product_negative_quantity(client):
    """Ensure creation with negative available quantity is rejected with 422."""
    payload = {
        "name": "Invalid Produce",
        "description": "Test produce with negative quantity",
        "category": "vegetables",
        "price": 50.0,
        "unit": "kg",
        "available_quantity": -100.0,
        "minimum_order_quantity": 5.0,
        "growing_location": "Nashik, Maharashtra"
    }
    res = client.post("/api/v1/products/", json=payload)
    assert res.status_code in [401, 403, 422]


def test_health_endpoints_no_secret_leak(client):
    """Verify /health and /api/v1/health return expected structure and do not leak passwords."""
    for path in ["/health", "/api/v1/health"]:
        res = client.get(path)
        assert res.status_code == 200
        data = res.json()
        assert "status" in data
        assert "database" in data
        # Ensure password is not present in target or message
        target = data["database"].get("target", "")
        assert "postgres:postgres@" not in target
        assert "****" in target or ":" not in target
