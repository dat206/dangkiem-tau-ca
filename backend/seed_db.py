from app.database import engine, SessionLocal, Base
from app.models.user import UserORM, UserRoleEnum
from app.models.vessel import VesselORM, ReportHistoryORM
import hashlib
from datetime import datetime

Base.metadata.create_all(bind=engine)

db = SessionLocal()
admin_email = "admin@dangkiem.gov.vn"
if not db.query(UserORM).filter(UserORM.email == admin_email).first():
    db.add(UserORM(
        full_name="Quản trị viên",
        email=admin_email,
        hashed_password=hashlib.sha256(b"admin123").hexdigest(),
        role="admin",
        is_active=True,
        created_at=datetime.utcnow()
    ))
    
staff_email = "nhanvien@dangkiem.gov.vn"
if not db.query(UserORM).filter(UserORM.email == staff_email).first():
    db.add(UserORM(
        full_name="Nhân viên",
        email=staff_email,
        hashed_password=hashlib.sha256(b"nhanvien123").hexdigest(),
        role="staff",
        is_active=True,
        created_at=datetime.utcnow()
    ))
db.commit()
print("Tạo bảng và seed dữ liệu thành công!")
