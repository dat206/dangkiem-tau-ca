"""Auth router: register, login, logout, me."""
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import (
    AuthResponse,
    UserLoginRequest,
    UserORM,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# ─── Simple in-memory token store (production: dùng Redis / JWT) ─────────────
# { token: user_id }
_active_tokens: dict[str, int] = {}


def _hash_password(password: str) -> str:
    """Very simple hash for demo — in production use bcrypt/argon2."""
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()


def _verify_password(plain: str, hashed: str) -> bool:
    return _hash_password(plain) == hashed


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
) -> UserORM:
    """Dependency: extract Bearer token and return current user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa đăng nhập.")
    token = authorization.split(" ", 1)[1]
    user_id = _active_tokens.get(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ hoặc đã hết hạn.")
    user = db.query(UserORM).filter(UserORM.id == user_id, UserORM.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tài khoản không tồn tại.")
    return user


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Đăng ký tài khoản mới."""
    existing = db.query(UserORM).filter(UserORM.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email này đã được sử dụng. Vui lòng chọn email khác.",
        )
    user = UserORM(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=_hash_password(payload.password),
        role=payload.role.value,
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Đăng nhập — trả về token phiên."""
    user = db.query(UserORM).filter(UserORM.email == payload.email).first()
    if not user or not _verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai email hoặc mật khẩu. Vui lòng thử lại.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị vô hiệu hoá. Liên hệ quản trị viên.",
        )
    # Generate session token
    token = secrets.token_urlsafe(32)
    _active_tokens[token] = user.id
    # Update last_login
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return AuthResponse(
        user=UserResponse.model_validate(user),
        token=token,
        message="Đăng nhập thành công.",
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(authorization: str = Header(None)):
    """Đăng xuất — vô hiệu hoá token."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        _active_tokens.pop(token, None)
    return {"message": "Đã đăng xuất thành công."}


@router.get("/me", response_model=UserResponse)
def me(current_user: UserORM = Depends(get_current_user)):
    """Trả về thông tin người dùng hiện tại."""
    return current_user
