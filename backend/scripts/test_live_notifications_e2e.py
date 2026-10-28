import requests

BASE = "http://127.0.0.1:8000/api/v1"

def run():
    print("Beginning Live Stage 7 End-to-End Verification on PostgreSQL 18 & FastAPI...")

    # Setup test credentials
    buyer_email = "live_buyer_stage7@farmlink.org"
    farmer_email = "live_farmer_stage7@farmlink.org"
    password = "SecurePassword123!"

    # 1. Register/Login Buyer
    b_session = requests.Session()
    b_reg = b_session.post(f"{BASE}/auth/register", json={
        "email": buyer_email,
        "password": password,
        "full_name": "Priya Bistro Live",
        "role": "buyer",
        "buyer_type": "restaurant",
    })
    if b_reg.status_code not in (201, 400):
        raise RuntimeError(f"Buyer registration failed: {b_reg.text}")

    b_login = b_session.post(f"{BASE}/auth/login", json={"email": buyer_email, "password": password})
    assert b_login.status_code == 200, f"Buyer login failed: {b_login.text}"
    b_token = b_login.json()["access_token"]
    b_headers = {"Authorization": f"Bearer {b_token}"}
    print("[PASS] Buyer authenticated")

    # 2. Register/Login Farmer
    f_session = requests.Session()
    f_reg = f_session.post(f"{BASE}/auth/register", json={
        "email": farmer_email,
        "password": password,
        "full_name": "Rajesh Kumar Live",
        "role": "farmer",
        "organization_name": "Himachal Apple Valley Orchards",
    })
    if f_reg.status_code not in (201, 400):
        raise RuntimeError(f"Farmer registration failed: {f_reg.text}")

    f_login = f_session.post(f"{BASE}/auth/login", json={"email": farmer_email, "password": password})
    assert f_login.status_code == 200, f"Farmer login failed: {f_login.text}"
    f_token = f_login.json()["access_token"]
    f_headers = {"Authorization": f"Bearer {f_token}"}
    print("[PASS] Farmer authenticated")

    # 3. Farmer creates a produce lot
    prod_res = requests.post(f"{BASE}/farmer/products", json={
        "name": "Live Royal Gala Apples",
        "description": "Crisp orchard apples",
        "category": "fruits",
        "price": 160.0,
        "unit": "kg",
        "available_quantity": 200.0,
        "minimum_order_quantity": 5.0,
        "growing_location": "Shimla, Himachal Pradesh",
        "is_organic": True,
    }, headers=f_headers)
    assert prod_res.status_code == 201, f"Product create failed: {prod_res.text}"
    prod_id = prod_res.json()["id"]
    print(f"[PASS] Farmer created produce lot #{prod_id}")

    # 4. Buyer places order
    order_res = requests.post(f"{BASE}/orders/", json={
        "items": [{"product_id": prod_id, "quantity": 10.0}],
        "fulfillment_method": "temperature_controlled_freight",
        "delivery_address": "42 Outer Ring Road",
        "delivery_city": "Delhi",
        "delivery_state": "Delhi",
        "delivery_pincode": "110025",
    }, headers=b_headers)
    assert order_res.status_code == 201, f"Order placement failed: {order_res.text}"
    order = order_res.json()
    order_id = order["id"]
    print(f"[PASS] Buyer placed Order #{order_id}")

    # 5. Verify notifications created for both
    f_notifs = requests.get(f"{BASE}/notifications", headers=f_headers).json()
    assert any(n["order_id"] == order_id and n["type"] == "order_created" for n in f_notifs["items"]), "Farmer did not receive order_created notif"
    print(f"[PASS] Farmer received order_created notification (Total unread: {f_notifs['unread_count']})")

    b_notifs = requests.get(f"{BASE}/notifications", headers=b_headers).json()
    assert any(n["order_id"] == order_id and n["type"] == "order_created" for n in b_notifs["items"]), "Buyer did not receive order_created notif"
    print(f"[PASS] Buyer received order confirmation notification")

    # 6. Farmer accepts order
    acc_res = requests.patch(f"{BASE}/farmer/orders/{order_id}/accept", headers=f_headers)
    assert acc_res.status_code == 200, f"Farmer accept failed: {acc_res.text}"
    print(f"[PASS] Farmer accepted Order #{order_id}")

    # 7. Verify buyer received order_accepted notification
    b_notifs_after_acc = requests.get(f"{BASE}/notifications", headers=b_headers).json()
    assert any(n["order_id"] == order_id and n["type"] == "order_accepted" for n in b_notifs_after_acc["items"])
    print(f"[PASS] Buyer received order_accepted notification")

    # 8. Farmer marks ready
    ready_res = requests.patch(f"{BASE}/farmer/orders/{order_id}/ready", headers=f_headers)
    assert ready_res.status_code == 200
    print(f"[PASS] Farmer marked Order #{order_id} ready")

    # 9. Verify buyer received order_ready notification
    b_notifs_after_ready = requests.get(f"{BASE}/notifications", headers=b_headers).json()
    assert any(n["order_id"] == order_id and n["type"] == "order_ready" for n in b_notifs_after_ready["items"])
    print(f"[PASS] Buyer received order_ready notification")

    # 10. Farmer completes order
    comp_res = requests.patch(f"{BASE}/farmer/orders/{order_id}/complete", headers=f_headers)
    assert comp_res.status_code == 200
    print(f"[PASS] Farmer completed Order #{order_id}")

    # 11. Verify buyer received order_completed notification
    b_notifs_after_comp = requests.get(f"{BASE}/notifications", headers=b_headers).json()
    assert any(n["order_id"] == order_id and n["type"] == "order_completed" for n in b_notifs_after_comp["items"])
    print(f"[PASS] Buyer received order_completed notification")

    # 12. Buyer marks all notifications read
    read_all_res = requests.patch(f"{BASE}/notifications/read-all", headers=b_headers)
    assert read_all_res.status_code == 200
    assert read_all_res.json()["unread_count"] == 0
    print(f"[PASS] Buyer marked all notifications as read (Unread count now 0)")

    # 13. Verify single notification read and delete
    f_first_notif_id = f_notifs["items"][0]["id"]
    read_one = requests.patch(f"{BASE}/notifications/{f_first_notif_id}/read", headers=f_headers)
    assert read_one.status_code == 200
    assert read_one.json()["is_read"] is True

    del_res = requests.delete(f"{BASE}/notifications/{f_first_notif_id}", headers=f_headers)
    assert del_res.status_code == 200
    print(f"[PASS] Single notification read and delete verified on live PostgreSQL")

    print("\n[ALL PASS] Stage 7 Notifications & Order Lifecycle completely verified on live PostgreSQL 18 & FastAPI!")

if __name__ == "__main__":
    run()
