from decimal import Decimal
from datetime import datetime
from app.models.user import User, UserRole, BuyerType
from app.models.product import Product, ProductCategory, UnitType, ListingStatus
from app.models.order import Order, OrderStatus, OrderItem, FulfillmentMethod


def test_user_model_creation(db_session):
    user = User(
        full_name="Ananya Roy",
        email="ananya.roy@sample.in",
        hashed_password="hashed_dummy_password",
        role=UserRole.BUYER,
        buyer_type=BuyerType.RESTAURANT,
        location="Indiranagar, Bengaluru",
        district="Bengaluru Urban",
        state="Karnataka",
        pincode="560038",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.role == UserRole.BUYER
    assert user.buyer_type == BuyerType.RESTAURANT
    assert user.buyer_category == BuyerType.RESTAURANT
    assert user.state == "Karnataka"


def test_product_model_and_compatibility_properties(db_session):
    farmer = User(
        full_name="Kisan Singh",
        email="kisan.singh@sample.in",
        hashed_password="hashed_dummy_password",
        role=UserRole.FARMER,
        location="Karnal, Haryana",
    )
    db_session.add(farmer)
    db_session.flush()

    prod = Product(
        farmer_id=farmer.id,
        name="Basmati 1121 Extra Long Grain",
        description="Premium aged basmati rice grains",
        category=ProductCategory.GRAINS_PULSES,
        price=Decimal("110.00"),
        unit=UnitType.KG,
        available_quantity=Decimal("5000.00"),
        minimum_order_quantity=Decimal("50.00"),
        growing_location="Karnal, Haryana",
        is_organic=True,
    )
    db_session.add(prod)
    db_session.commit()
    db_session.refresh(prod)

    assert prod.id is not None
    assert prod.farmer_id == farmer.id
    # Test compatibility properties
    assert prod.title == "Basmati 1121 Extra Long Grain"
    assert prod.price_per_unit == 110.00
    assert prod.origin_location == "Karnal, Haryana"
    assert prod.listing_status == ListingStatus.ACTIVE


def test_order_and_order_item_single_farmer(db_session):
    farmer = User(
        full_name="Farmer Rajesh",
        email="rajesh.farmer@sample.in",
        hashed_password="dummy_password",
        role=UserRole.FARMER,
    )
    buyer = User(
        full_name="Chef Vikram",
        email="vikram.chef@sample.in",
        hashed_password="dummy_password",
        role=UserRole.BUYER,
        buyer_type=BuyerType.RESTAURANT,
    )
    db_session.add_all([farmer, buyer])
    db_session.flush()

    prod = Product(
        farmer_id=farmer.id,
        name="Fresh Coriander Herbs",
        description="Hydroponic fresh green coriander",
        category=ProductCategory.HERBS_SPICES,
        price=Decimal("40.00"),
        unit=UnitType.KG,
        available_quantity=Decimal("200.00"),
        minimum_order_quantity=Decimal("5.00"),
        growing_location="Pune, Maharashtra",
    )
    db_session.add(prod)
    db_session.flush()

    # Create Order
    order = Order(
        buyer_id=buyer.id,
        farmer_id=farmer.id,
        status=OrderStatus.PENDING,
        total_amount=Decimal("400.00"),
        fulfillment_method=FulfillmentMethod.TEMPERATURE_CONTROLLED_FREIGHT,
        delivery_address="Connaught Place, New Delhi",
        delivery_city="New Delhi",
        delivery_state="Delhi",
        delivery_pincode="110001",
    )
    db_session.add(order)
    db_session.flush()

    item = OrderItem(
        order_id=order.id,
        product_id=prod.id,
        quantity=Decimal("10.00"),
        unit_price_at_purchase=Decimal("40.00"),
        subtotal=Decimal("400.00"),
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(order)

    assert order.id is not None
    assert order.farmer_id == farmer.id
    assert order.buyer_id == buyer.id
    assert len(order.items) == 1
    assert order.items[0].subtotal == Decimal("400.00")
    assert order.items[0].product.name == "Fresh Coriander Herbs"
