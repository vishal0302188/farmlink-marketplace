from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.models.product import Product, ProductCategory, ListingStatus
from app.schemas.product import ProductCreate, ProductRead

router = APIRouter()


@router.get("/", response_model=List[ProductRead], summary="List Public Marketplace Produce")
def list_products(
    response: Response,
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Search keyword in produce name or description"),
    category: Optional[ProductCategory] = Query(None, description="Filter by crop category"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price (INR)"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price (INR)"),
    growing_location: Optional[str] = Query(None, description="Filter by growing region / district"),
    is_organic: Optional[bool] = Query(None, description="Filter natural/organic certified produce"),
    skip: int = Query(0, ge=0, description="Number of items to skip (pagination)"),
    limit: int = Query(20, ge=1, le=100, description="Maximum items to return (1-100)"),
):
    """
    List active, approved agricultural produce from regional farmers.
    Only returns products where listing_status == ACTIVE and is_active == True.
    """
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_price cannot be greater than max_price."
        )

    # Base query: only active, approved public listings
    query = db.query(Product).filter(
        Product.listing_status == ListingStatus.ACTIVE,
        Product.is_active == True
    )

    # 1. Search filter across name, description, and growing_location
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.growing_location.ilike(search_term),
            )
        )

    # 2. Category filter
    if category:
        query = query.filter(Product.category == category)

    # 3. Minimum price filter
    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    # 4. Maximum price filter
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # 5. Growing location filter
    if growing_location:
        query = query.filter(Product.growing_location.ilike(f"%{growing_location.strip()}%"))

    # 6. Organic filter
    if is_organic is not None:
        query = query.filter(Product.is_organic == is_organic)

    # Total count for pagination metadata
    total_count = query.count()
    response.headers["X-Total-Count"] = str(total_count)

    # Order by newest listings first, then paginate
    products = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=ProductRead, summary="Get Single Produce Details")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Retrieve single produce item by ID.
    Returns 404 if the product does not exist or is not active.
    """
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.listing_status == ListingStatus.ACTIVE,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produce item with ID {product_id} was not found or is no longer active."
        )
    return product


@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED, summary="Create Produce Listing")
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.FARMER, UserRole.ADMIN)),
):
    """
    Create a new produce listing.
    Restricted strictly to authenticated Farmers and Administrators.
    Buyers cannot create farmer listings.
    """
    # Strict validation of values
    if product_in.price <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Product price must be greater than 0."
        )
    if product_in.available_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Available quantity cannot be negative."
        )
    if product_in.minimum_order_quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Minimum order quantity must be greater than 0."
        )

    product = Product(
        farmer_id=current_user.id,
        name=product_in.name,
        description=product_in.description,
        category=product_in.category,
        price=product_in.price,
        unit=product_in.unit,
        available_quantity=product_in.available_quantity,
        minimum_order_quantity=product_in.minimum_order_quantity,
        growing_location=product_in.growing_location,
        harvest_date=product_in.harvest_date,
        is_organic=product_in.is_organic,
        image_url=product_in.image_url,
        listing_status=ListingStatus.ACTIVE,
        is_active=True,
    )

    db.add(product)
    db.commit()
    db.refresh(product)
    return product
