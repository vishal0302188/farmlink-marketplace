from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, products, users, farmer, orders, admin, notifications

api_v1_router = APIRouter()

api_v1_router.include_router(health.router, tags=["Health"])
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(products.router, prefix="/products", tags=["Products"])
api_v1_router.include_router(orders.router, prefix="/orders", tags=["Orders & Checkout"])
api_v1_router.include_router(farmer.router, prefix="/farmer", tags=["Farmer Dashboard & Management"])
api_v1_router.include_router(admin.router, prefix="/admin", tags=["Admin Operations & Moderation"])
api_v1_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications & Alerts"])
api_v1_router.include_router(users.router, prefix="/users", tags=["Users"])
