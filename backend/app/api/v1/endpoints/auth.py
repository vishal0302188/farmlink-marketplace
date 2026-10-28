from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user
from app.models.user import User, UserRole, BuyerType
from app.schemas.user import UserCreate, UserRead, UserRegister, LoginRequest, Token

router = APIRouter()


def set_auth_cookie(response: Response, token: str) -> None:
    """Sets a secure, HttpOnly JWT authentication cookie on the HTTP response."""
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserRegister,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Register a new user account as a Farmer or Buyer.
    Strictly forbids public registration as Administrator.
    Sets HttpOnly authentication cookie and returns JWT bearer token.
    """
    # 1. Reject public registration as an administrator
    if user_in.role == UserRole.ADMIN or str(user_in.role).lower() == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration as an administrator is not permitted."
        )

    # 2. Reject duplicate email addresses (case-insensitive check)
    existing_user = db.query(User).filter(User.email.ilike(user_in.email.strip())).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # 3. Validate buyer classification logic
    buyer_type = None
    if user_in.role == UserRole.BUYER:
        buyer_type = user_in.buyer_type or BuyerType.HOUSEHOLD

    user = User(
        email=user_in.email.lower().strip(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        phone_number=user_in.phone_number.strip() if user_in.phone_number else None,
        role=user_in.role,
        buyer_type=buyer_type if user_in.role == UserRole.BUYER else None,
        organization_name=user_in.organization_name.strip() if user_in.organization_name else None,
        location=user_in.location.strip() if user_in.location else None,
        district=user_in.district.strip() if user_in.district else None,
        state=user_in.state.strip() if user_in.state else None,
        pincode=user_in.pincode.strip() if user_in.pincode else None,
        bio=user_in.bio.strip() if user_in.bio else None,
        is_verified=False,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    set_auth_cookie(response, access_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/login", response_model=Token)
def login_json(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Authenticate user via JSON credentials (email + password).
    Sets an HttpOnly session cookie and returns a JWT bearer token.
    """
    user = db.query(User).filter(User.email.ilike(login_data.email.strip())).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    set_auth_cookie(response, access_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/token", response_model=Token, summary="OAuth2 Form Login for API documentation")
def login_form(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Standard OAuth2 password-form login endpoint for Swagger UI & automated tools.
    """
    user = db.query(User).filter(User.email.ilike(form_data.username.strip())).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    set_auth_cookie(response, access_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/logout")
def logout(response: Response):
    """
    Clears the HttpOnly access token authentication cookie.
    """
    response.delete_cookie(
        key="access_token",
        path="/",
        samesite="lax",
    )
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the authenticated user's verified profile and authorization role.
    """
    return current_user

