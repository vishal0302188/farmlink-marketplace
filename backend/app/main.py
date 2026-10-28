from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import check_db_connection
from app.api.v1.router import api_v1_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FarmLink - Direct agricultural commerce connecting farmers, consumers, and institutions.",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 routes
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/", summary="Root Index")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "docs_url": f"{settings.API_V1_STR}/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "status": "operational",
    }


@app.get("/health", summary="Top-Level Health Check")
def health():
    """Top-level health check endpoint returning service and database status."""
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
