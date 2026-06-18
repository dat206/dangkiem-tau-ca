# -*- coding: utf-8 -*-
"""
Script tạo tài khoản admin mới hoặc reset mật khẩu admin.
Chạy: python create_admin.py
"""
import hashlib
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.user import UserORM, UserRoleEnum
from datetime import datetime


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_or_reset_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin_email = "admin@dangkiem.gov.vn"
        admin_password = "Admin@123"

        existing = db.query(UserORM).filter(UserORM.email == admin_email).first()

        if existing:
            # Reset password and name
            existing.full_name = "Hồ Tuấn Minh"
            existing.hashed_password = hash_password(admin_password)
            existing.is_active = True
            existing.role = UserRoleEnum.ADMIN.value
            db.commit()
            db.refresh(existing)
            print(f"✅ Đã reset mật khẩu cho tài khoản admin:")
            print(f"   Email: {admin_email}")
            print(f"   Mật khẩu mới: {admin_password}")
            print(f"   Tên: {existing.full_name}")
            print(f"   Role: {existing.role}")
        else:
            admin = UserORM(
                full_name="Hồ Tuấn Minh",
                email=admin_email,
                hashed_password=hash_password(admin_password),
                role=UserRoleEnum.ADMIN.value,
                is_active=True,
                created_at=datetime.utcnow(),
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"🎉 Đã tạo tài khoản admin mới:")
            print(f"   Email: {admin_email}")
            print(f"   Mật khẩu: {admin_password}")
            print(f"   Tên: {admin.full_name}")
            print(f"   Role: {admin.role}")

        print()
        print("⚠️  Hãy đổi mật khẩu sau khi đăng nhập lần đầu!")

    finally:
        db.close()


if __name__ == "__main__":
    create_or_reset_admin()
