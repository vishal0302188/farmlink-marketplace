from fastapi import APIRouter
from app.core.database import check_db_connection
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Service Health and Database Readiness Check")
def check_health():
    """
    Returns the operational status of FarmLink API and PostgreSQL connectivity.
    Transparently reports database reachability without crashing or leaking secrets.
    """
    is_connected, db_message = check_db_connection()

    return {
        "status": "healthy" if is_connected else "degraded",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": {
            "connected": is_connected,
            "status": "connected" if is_connected else "disconnected",
            "message": db_message,
            "target": settings.masked_database_url,
        },
        "version": "0.1.0",
    }
