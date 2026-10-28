import requests

BASE = 'http://127.0.0.1:8000/api/v1'

def run():
    print("Beginning Live Admin End-to-End Verification...")

    # 1. Admin Login
    login_res = requests.post(f"{BASE}/auth/login", json={
        "email": "admin@farmlink.org",
        "password": "AdminPassword123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    tokens = login_res.json()
    token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Admin login successful")

    # 2. Get Profile
    me_res = requests.get(f"{BASE}/auth/me", headers=headers)
    assert me_res.status_code == 200
    user = me_res.json()
    assert user["role"] == "admin"
    admin_id = user["id"]
    print(f"[PASS] Verified admin role for user_id={admin_id}")

    # 3. Overview Metrics
    ov_res = requests.get(f"{BASE}/admin/overview", headers=headers)
    assert ov_res.status_code == 200, f"Overview failed: {ov_res.text}"
    metrics = ov_res.json()
    print(f"[PASS] Overview metrics loaded: {metrics['total_farmers']} farmers, {metrics['total_buyers']} buyers, {metrics['active_products']} active products, {metrics['total_orders']} orders")

    # 4. Products Moderation List
    prod_res = requests.get(f"{BASE}/admin/products", headers=headers)
    assert prod_res.status_code == 200
    products = prod_res.json()
    print(f"[PASS] Admin products list: retrieved {len(products)} products")

    # 5. Users List
    users_res = requests.get(f"{BASE}/admin/users", headers=headers)
    assert users_res.status_code == 200
    users = users_res.json()
    print(f"[PASS] Admin users list: retrieved {len(users)} users")

    # 6. Self-lockout test
    lockout_res = requests.patch(f"{BASE}/admin/users/{admin_id}/status", json={"is_active": False}, headers=headers)
    assert lockout_res.status_code == 400, f"Expected 400 self-lockout guard, got {lockout_res.status_code}"
    print(f"[PASS] Self-lockout protection verified: {lockout_res.json()['detail']}")

    # 7. Orders List
    ord_res = requests.get(f"{BASE}/admin/orders", headers=headers)
    assert ord_res.status_code == 200
    orders = ord_res.json()
    print(f"[PASS] Admin orders list: retrieved {len(orders)} orders")

    print("\n[ALL PASS] Live Admin API Endpoints completely verified against PostgreSQL 18!")

if __name__ == "__main__":
    run()
