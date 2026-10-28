"""
FarmLink Database Seeding Script
=================================
Seeds the PostgreSQL database with:
- 5 Verified Indian Farmer profiles across diverse agricultural states
- 15 Authentic agricultural produce lots priced realistically in INR

Idempotency:
- Checks existing records by email and product name before inserting.
- Safe to run multiple times without duplicating data.
- Does NOT execute automatically on application startup.

Usage:
  python scripts/seed_data.py
"""

import sys
import os
from decimal import Decimal
from datetime import datetime, timezone, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, check_db_connection
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole, BuyerType
from app.models.product import Product, ProductCategory, UnitType, ListingStatus


FARMERS_DATA = [
    {
        "full_name": "Rameshwar Patil",
        "email": "rameshwar.patil@sahyadri-farms.sample.in",
        "phone_number": "+91-98220-12345",
        "role": UserRole.FARMER,
        "organization_name": "Sahyadri Natural Horticulture & Grapes",
        "location": "Dindori Road, Nashik",
        "district": "Nashik",
        "state": "Maharashtra",
        "pincode": "422004",
        "bio": "[Sample Data] Third-generation onion and pomegranate farmer specializing in drip-fertigated, low-residue horticulture in the Godavari basin.",
        "is_verified": True,
    },
    {
        "full_name": "Gurmeet Singh Dhillon",
        "email": "gurmeet.dhillon@doaba-heritage.sample.in",
        "phone_number": "+91-98140-54321",
        "role": UserRole.FARMER,
        "organization_name": "Doaba Heritage Agro Farms",
        "location": "Nakodar Tehsil, Jalandhar",
        "district": "Jalandhar",
        "state": "Punjab",
        "pincode": "144040",
        "bio": "[Sample Data] Progressive grain and oilseed cultivator practicing zero-stubble burning, green manuring, and solar micro-irrigation.",
        "is_verified": True,
    },
    {
        "full_name": "Venkata Subba Rao",
        "email": "subbarao.v@krishna-delta.sample.in",
        "phone_number": "+91-94401-67890",
        "role": UserRole.FARMER,
        "organization_name": "Krishna Delta Spice Producers Co-op",
        "location": "Tenali Rural, Guntur",
        "district": "Guntur",
        "state": "Andhra Pradesh",
        "pincode": "522201",
        "bio": "[Sample Data] Chilli and spice grower cooperative leader managing GI-tagged Guntur chilli drying yards and moisture-tested cold storage.",
        "is_verified": True,
    },
    {
        "full_name": "Meenakshi Sundaram",
        "email": "meenakshi.s@cauvery-basin.sample.in",
        "phone_number": "+91-94432-11223",
        "role": UserRole.FARMER,
        "organization_name": "Cauvery Basin Organic Rice & Jaggery Mill",
        "location": "Kumbakonam Road, Thanjavur",
        "district": "Thanjavur",
        "state": "Tamil Nadu",
        "pincode": "613001",
        "bio": "[Sample Data] Traditional organic paddy conservator cultivating heirloom indigenous red and black rice varieties with zero synthetic inputs.",
        "is_verified": True,
    },
    {
        "full_name": "Tara Chand Sharma",
        "email": "tarachand.sharma@him-orchards.sample.in",
        "phone_number": "+91-98160-99887",
        "role": UserRole.FARMER,
        "organization_name": "Himalayan High-Altitude Apple Estates",
        "location": "Kotgarh Valley, Shimla",
        "district": "Shimla",
        "state": "Himachal Pradesh",
        "pincode": "172031",
        "bio": "[Sample Data] High-elevation temperate orchardist harvesting crisp apples, walnuts, and wild mountain flora honey at 7,500 feet.",
        "is_verified": True,
    },
]

PRODUCTS_DATA = [
    # Farmer 1: Rameshwar Patil (Nashik, Maharashtra)
    {
        "farmer_email": "rameshwar.patil@sahyadri-farms.sample.in",
        "name": "[Sample Data] Nashik Red Onions (Garwa Storage Quality)",
        "description": "Medium-sized, deep-red field-cured Nashik onions with high dry-matter content and thick skin. Ideal for bulk restaurant storage and transit without sprouting.",
        "category": ProductCategory.VEGETABLES,
        "price": Decimal("32.50"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("15000.00"),
        "minimum_order_quantity": Decimal("100.00"),
        "growing_location": "Nashik, Maharashtra",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=5),
        "is_organic": False,
        "image_url": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80",
    },
    {
        "farmer_email": "rameshwar.patil@sahyadri-farms.sample.in",
        "name": "[Sample Data] Export-Grade Seedless Thomson Green Grapes",
        "description": "Hand-clipped sweet green table grapes grown under rain shelters. Measured brix sugar content between 18° and 20° with zero sulfur bleaching.",
        "category": ProductCategory.FRUITS,
        "price": Decimal("85.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("4500.00"),
        "minimum_order_quantity": Decimal("25.00"),
        "growing_location": "Dindori, Nashik, Maharashtra",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=2),
        "is_organic": False,
        "image_url": "https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=800&q=80",
    },
    {
        "farmer_email": "rameshwar.patil@sahyadri-farms.sample.in",
        "name": "[Sample Data] Bhagwa Red Pomegranates (Aril Rich)",
        "description": "Glossy red Bhagwa pomegranates with soft edible seeds and deep ruby juice arils. Graded for premium retail counters and fresh culinary juice bars.",
        "category": ProductCategory.FRUITS,
        "price": Decimal("145.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("2200.00"),
        "minimum_order_quantity": Decimal("20.00"),
        "growing_location": "Nashik, Maharashtra",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=4),
        "is_organic": True,
        "image_url": "https://images.unsplash.com/photo-1541344999736-83eca872f241?auto=format&fit=crop&w=800&q=80",
    },

    # Farmer 2: Gurmeet Singh Dhillon (Jalandhar, Punjab)
    {
        "farmer_email": "gurmeet.dhillon@doaba-heritage.sample.in",
        "name": "[Sample Data] Sharbati Golden Whole Wheat Grain",
        "description": "Heavy golden grain harvested from alluvial soil, sun-dried to under 10% moisture. Makes exceptionally soft rotis with sweet natural aroma.",
        "category": ProductCategory.GRAINS_PULSES,
        "price": Decimal("46.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("25000.00"),
        "minimum_order_quantity": Decimal("250.00"),
        "growing_location": "Jalandhar, Punjab",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=20),
        "is_organic": True,
        "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80",
    },
    {
        "farmer_email": "gurmeet.dhillon@doaba-heritage.sample.in",
        "name": "[Sample Data] Cold-Pressed Pure Yellow Mustard Oil (Kachi Ghani)",
        "description": "First cold expeller extracted from estate-grown yellow mustard seeds. Pungent allylisothiocyanate aroma preserved without chemical neutralization.",
        "category": ProductCategory.SPECIALTY,
        "price": Decimal("175.00"),
        "unit": UnitType.LITRE,
        "available_quantity": Decimal("3000.00"),
        "minimum_order_quantity": Decimal("15.00"),
        "growing_location": "Nakodar, Punjab",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=12),
        "is_organic": True,
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
    },
    {
        "farmer_email": "gurmeet.dhillon@doaba-heritage.sample.in",
        "name": "[Sample Data] Fresh Green Winter Mustard Leaves (Sarson Saag)",
        "description": "Tender unbruised morning-harvested Sarson leaves bundled in aerated bamboo hampers. Free from post-harvest wash chemicals.",
        "category": ProductCategory.VEGETABLES,
        "price": Decimal("28.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("800.00"),
        "minimum_order_quantity": Decimal("10.00"),
        "growing_location": "Jalandhar, Punjab",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=1),
        "is_organic": True,
        "image_url": "https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=800&q=80",
    },

    # Farmer 3: Venkata Subba Rao (Guntur, Andhra Pradesh)
    {
        "farmer_email": "subbarao.v@krishna-delta.sample.in",
        "name": "[Sample Data] Guntur Sannam S4 Stemless Red Chillies",
        "description": "Deep crimson, hot and pungent whole dried chillies with SHU rating of 35,000 to 40,000. Cleaned and moisture-calibrated in food-grade gunny bags.",
        "category": ProductCategory.HERBS_SPICES,
        "price": Decimal("225.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("6000.00"),
        "minimum_order_quantity": Decimal("50.00"),
        "growing_location": "Guntur, Andhra Pradesh",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=15),
        "is_organic": False,
        "image_url": "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80",
    },
    {
        "farmer_email": "subbarao.v@krishna-delta.sample.in",
        "name": "[Sample Data] Salem Curcumin-Rich Whole Turmeric Fingers",
        "description": "Double-polished golden yellow turmeric fingers with laboratory verified curcumin content above 4.5%. Matured 9 months in virgin black cotton soil.",
        "category": ProductCategory.HERBS_SPICES,
        "price": Decimal("185.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("4000.00"),
        "minimum_order_quantity": Decimal("30.00"),
        "growing_location": "Guntur, Andhra Pradesh",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=25),
        "is_organic": True,
        "image_url": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80",
    },
    {
        "farmer_email": "subbarao.v@krishna-delta.sample.in",
        "name": "[Sample Data] Andhra Byadgi Semi-Wrinkled Mild Chillies",
        "description": "High natural color value (ASTA 140+) with low pungency. Renowned by commercial curry powder manufacturers and restaurant gravies.",
        "category": ProductCategory.HERBS_SPICES,
        "price": Decimal("265.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("3200.00"),
        "minimum_order_quantity": Decimal("25.00"),
        "growing_location": "Guntur, Andhra Pradesh",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=18),
        "is_organic": False,
        "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80",
    },

    # Farmer 4: Meenakshi Sundaram (Thanjavur, Tamil Nadu)
    {
        "farmer_email": "meenakshi.s@cauvery-basin.sample.in",
        "name": "[Sample Data] Mappillai Samba Heritage Unpolished Rice",
        "description": "Traditional red kernel rice cultivated in the fertile Cauvery Delta. Packed with iron, zinc, and low glycemic index carbohydrates.",
        "category": ProductCategory.GRAINS_PULSES,
        "price": Decimal("95.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("8500.00"),
        "minimum_order_quantity": Decimal("50.00"),
        "growing_location": "Thanjavur, Tamil Nadu",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=30),
        "is_organic": True,
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    },
    {
        "farmer_email": "meenakshi.s@cauvery-basin.sample.in",
        "name": "[Sample Data] Organic Palm Jaggery (Karupatti)",
        "description": "Slow-boiled unrefined palm sap boiled in traditional open cast-iron vats without chemical clarifyers or calcium carbonate bleaching.",
        "category": ProductCategory.SPECIALTY,
        "price": Decimal("190.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("1800.00"),
        "minimum_order_quantity": Decimal("10.00"),
        "growing_location": "Thanjavur, Tamil Nadu",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=14),
        "is_organic": True,
        "image_url": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80",
    },
    {
        "farmer_email": "meenakshi.s@cauvery-basin.sample.in",
        "name": "[Sample Data] Single-Origin Malabar Black Peppercorns",
        "description": "Late-harvested vine-ripened black peppercorns from spice gardens. Rich piperine essential oil kick with citrus undertones.",
        "category": ProductCategory.HERBS_SPICES,
        "price": Decimal("640.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("1100.00"),
        "minimum_order_quantity": Decimal("5.00"),
        "growing_location": "Thanjavur, Tamil Nadu",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=10),
        "is_organic": True,
        "image_url": "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80",
    },

    # Farmer 5: Tara Chand Sharma (Shimla, Himachal Pradesh)
    {
        "farmer_email": "tarachand.sharma@him-orchards.sample.in",
        "name": "[Sample Data] Shimla Royal Delicious Apples (Tree-Matured)",
        "description": "High-altitude crisp mountain apples packed in corrugated telescopic cartons. Balanced acidity and crisp flesh with natural bloom.",
        "category": ProductCategory.FRUITS,
        "price": Decimal("135.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("7500.00"),
        "minimum_order_quantity": Decimal("50.00"),
        "growing_location": "Kotgarh, Shimla, Himachal Pradesh",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=6),
        "is_organic": False,
        "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80",
    },
    {
        "farmer_email": "tarachand.sharma@him-orchards.sample.in",
        "name": "[Sample Data] Raw Wildflower & Plectranthus Mountain Honey",
        "description": "Unpasteurized, unfiltered honey extracted from traditional wooden hives situated in alpine flora zones at 7,000 feet. Thick enzymatic texture.",
        "category": ProductCategory.SPECIALTY,
        "price": Decimal("620.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("650.00"),
        "minimum_order_quantity": Decimal("2.00"),
        "growing_location": "Shimla, Himachal Pradesh",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=15),
        "is_organic": True,
        "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
    },
    {
        "farmer_email": "tarachand.sharma@him-orchards.sample.in",
        "name": "[Sample Data] Shelled Himalayan Golden Walnut Kernels",
        "description": "Light half-kernels cracked from thin-shelled high-altitude walnuts. High in omega-3 ALA fatty acids with zero chemical bleach treatments.",
        "category": ProductCategory.SPECIALTY,
        "price": Decimal("890.00"),
        "unit": UnitType.KG,
        "available_quantity": Decimal("900.00"),
        "minimum_order_quantity": Decimal("5.00"),
        "growing_location": "Shimla, Himachal Pradesh",
        "harvest_date": datetime.now(timezone.utc) - timedelta(days=22),
        "is_organic": True,
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    },
]


def seed_database(db: Session) -> dict:
    """
    Executes idempotent insertion of 5 farmers and 15 produce items.
    Returns counts of newly created vs existing records.
    """
    farmers_created = 0
    farmers_existing = 0
    products_created = 0
    products_existing = 0

    farmer_map = {}

    # 1. Seed or resolve Farmers
    default_password_hash = get_password_hash("FarmlinkSeed2026!Secure")

    for farmer_data in FARMERS_DATA:
        existing = db.query(User).filter(User.email == farmer_data["email"]).first()
        if existing:
            farmer_map[farmer_data["email"]] = existing
            farmers_existing += 1
        else:
            new_farmer = User(
                full_name=farmer_data["full_name"],
                email=farmer_data["email"],
                hashed_password=default_password_hash,
                phone_number=farmer_data["phone_number"],
                role=farmer_data["role"],
                buyer_type=None,
                organization_name=farmer_data["organization_name"],
                location=farmer_data["location"],
                district=farmer_data["district"],
                state=farmer_data["state"],
                pincode=farmer_data["pincode"],
                bio=farmer_data["bio"],
                is_verified=farmer_data["is_verified"],
                is_active=True,
            )
            db.add(new_farmer)
            db.flush()  # populate new_farmer.id
            farmer_map[farmer_data["email"]] = new_farmer
            farmers_created += 1

    # 2. Seed or update Products
    for prod_data in PRODUCTS_DATA:
        farmer = farmer_map.get(prod_data["farmer_email"])
        if not farmer:
            continue

        existing_prod = db.query(Product).filter(
            Product.farmer_id == farmer.id,
            Product.name == prod_data["name"]
        ).first()

        if existing_prod:
            # Update attributes to ensure consistency without duplicating
            existing_prod.price = prod_data["price"]
            existing_prod.available_quantity = prod_data["available_quantity"]
            existing_prod.minimum_order_quantity = prod_data["minimum_order_quantity"]
            existing_prod.is_organic = prod_data["is_organic"]
            existing_prod.image_url = prod_data["image_url"]
            existing_prod.listing_status = ListingStatus.ACTIVE
            existing_prod.is_active = True
            products_existing += 1
        else:
            new_product = Product(
                farmer_id=farmer.id,
                name=prod_data["name"],
                description=prod_data["description"],
                category=prod_data["category"],
                price=prod_data["price"],
                unit=prod_data["unit"],
                available_quantity=prod_data["available_quantity"],
                minimum_order_quantity=prod_data["minimum_order_quantity"],
                growing_location=prod_data["growing_location"],
                harvest_date=prod_data["harvest_date"],
                is_organic=prod_data["is_organic"],
                image_url=prod_data["image_url"],
                listing_status=ListingStatus.ACTIVE,
                is_active=True,
            )
            db.add(new_product)
            products_created += 1

    db.commit()

    return {
        "farmers_created": farmers_created,
        "farmers_existing": farmers_existing,
        "products_created": products_created,
        "products_existing": products_existing,
    }


def main():
    print("=" * 70)
    print("FARMLINK SEED SCRIPT (INDIAN AGRICULTURAL MARKETPLACE)")
    print("=" * 70)
    print(f"Target Database: {settings.masked_database_url}")

    is_connected, msg = check_db_connection()
    if not is_connected:
        print(f"\n[ERROR] Database is not accessible: {msg}")
        print("\nTo seed your database:")
        print("1. Ensure PostgreSQL is running on your machine.")
        print("2. Set your valid credentials in 'backend/.env' (copy from .env.example).")
        print("   Example: DATABASE_URL=postgresql://postgres:your_password@localhost:5432/farmlink_db")
        print("3. Run: alembic upgrade head")
        print("4. Re-run: python scripts/seed_data.py")
        sys.exit(1)

    print(f"[OK] Database connection verified: {msg}")
    print("Seeding sample farmers and produce catalog...")

    db = SessionLocal()
    try:
        results = seed_database(db)
        print("\nSeed Summary:")
        print(f"  - Farmers created:  {results['farmers_created']} (Existing: {results['farmers_existing']})")
        print(f"  - Products created: {results['products_created']} (Existing: {results['products_existing']})")
        print("\n[SUCCESS] Sample data seeded safely with Indian agricultural lots and INR pricing.")
    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] Failed to seed database: {type(exc).__name__}: {exc}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
