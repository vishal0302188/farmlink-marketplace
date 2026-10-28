def test_list_products_success(client):
    response = client.get("/api/v1/products/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "X-Total-Count" in response.headers
    # Check shape of first product
    prod = data[0]
    assert "id" in prod
    assert "name" in prod
    assert "price" in prod
    assert "unit" in prod
    assert "growing_location" in prod
    assert "available_quantity" in prod


def test_get_product_detail_success(client):
    # Fetch first product to get a valid ID
    list_res = client.get("/api/v1/products/")
    products = list_res.json()
    first_id = products[0]["id"]

    res = client.get(f"/api/v1/products/{first_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == first_id
    assert data["name"] == products[0]["name"]
    assert float(data["price"]) == float(products[0]["price"])


def test_get_product_not_found(client):
    res = client.get("/api/v1/products/999999")
    assert res.status_code == 404
    assert "was not found" in res.json()["detail"]


def test_search_filter(client):
    res = client.get("/api/v1/products/?search=Nashik")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    for item in data:
        assert (
            "nashik" in item["name"].lower()
            or "nashik" in item["description"].lower()
            or "nashik" in item["growing_location"].lower()
        )


def test_category_filter(client):
    res = client.get("/api/v1/products/?category=fruits")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    for item in data:
        assert item["category"] == "fruits"


def test_price_range_filter(client):
    min_p, max_p = 50.0, 150.0
    res = client.get(f"/api/v1/products/?min_price={min_p}&max_price={max_p}")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    for item in data:
        assert min_p <= float(item["price"]) <= max_p


def test_organic_filter(client):
    res = client.get("/api/v1/products/?is_organic=true")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    for item in data:
        assert item["is_organic"] is True


def test_pagination(client):
    res_page_1 = client.get("/api/v1/products/?skip=0&limit=3")
    assert res_page_1.status_code == 200
    data_1 = res_page_1.json()
    assert len(data_1) == 3

    res_page_2 = client.get("/api/v1/products/?skip=3&limit=3")
    assert res_page_2.status_code == 200
    data_2 = res_page_2.json()
    assert len(data_2) == 3

    # IDs between page 1 and page 2 must be disjoint
    ids_1 = {p["id"] for p in data_1}
    ids_2 = {p["id"] for p in data_2}
    assert ids_1.isdisjoint(ids_2)
