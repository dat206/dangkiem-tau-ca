# models.py
from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import declarative_base

# Tạo Base class để các models khác kế thừa
Base = declarative_base()

# Định nghĩa bảng Tàu Cá
class TauCa(Base):
    __tablename__ = "tau_ca"

    id = Column(Integer, primary_key=True, index=True)
    so_hieu = Column(String(50), unique=True, index=True, nullable=False)
    chu_tau = Column(String(100), nullable=False)
    chieu_dai = Column(Float)
    
    # Bạn có thể thêm các cột khác ở đây...