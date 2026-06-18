# -*- coding: utf-8 -*-
"""
Script tạo tài khoản admin mặc định nếu chưa tồn tại.
Chạy: python seed_admin.py
"""
import hashlib
import sys
import os

# Thêm thư mục backend vào path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.user import UserORM, UserRoleEnum
from datetime import datetime


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def seed_admin():
    # Tạo bảng nếu chưa có
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        admin_email = "admin@dangkiem.gov.vn"
        existing = db.query(UserORM).filter(UserORM.email == admin_email).first()

        if existing:
            print(f"✅ Tài khoản admin đã tồn tại: {admin_email}")
            print(f"   Tên: {existing.full_name}")
            print(f"   Role: {existing.role}")
            return

        admin = UserORM(
            full_name="Hồ Tuấn Minh",
            email=admin_email,
            hashed_password=hash_password("Admin@123"),
            role=UserRoleEnum.ADMIN.value,
            is_active=True,
            created_at=datetime.utcnow(),
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("🎉 Đã tạo tài khoản admin thành công!")
        print(f"   Email: {admin_email}")
        print(f"   Mật khẩu: Admin@123")
        print(f"   Tên: {admin.full_name}")
        print(f"   Role: {admin.role}")
        print()
        print("⚠️  Hãy đổi mật khẩu sau khi đăng nhập lần đầu!")

    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
