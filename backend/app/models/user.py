"""SQLAlchemy ORM model and Pydantic schemas for User authentication."""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.database import Base


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"


# ─── SQLAlchemy ORM ───────────────────────────────────────────────────────────

class UserORM(Base):
    """Database model for user accounts."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRoleEnum.STAFF, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    """Payload to create a new user account."""

    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(..., min_length=2, max_length=255, description="Họ và tên đầy đủ")
    email: EmailStr = Field(..., description="Email đăng nhập")
    password: str = Field(..., min_length=6, description="Mật khẩu (tối thiểu 6 ký tự)")
    role: UserRoleEnum = Field(default=UserRoleEnum.STAFF)


class UserLoginRequest(BaseModel):
    """Payload for user login."""

    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr
    password: str


class UserUpdateRequest(BaseModel):
    """Payload to update an existing user."""

    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: Optional[str] = Field(None, min_length=2, max_length=255, description="Họ và tên đầy đủ")
    email: Optional[EmailStr] = Field(None, description="Email đăng nhập")
    password: Optional[str] = Field(None, min_length=6, description="Mật khẩu mới")
    role: Optional[UserRoleEnum] = Field(None)
    is_active: Optional[bool] = Field(None)


class UserResponse(BaseModel):
    """Public user data returned after login/register."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class AuthResponse(BaseModel):
    """Response returned on successful login."""

    user: UserResponse
    token: str
    message: str
