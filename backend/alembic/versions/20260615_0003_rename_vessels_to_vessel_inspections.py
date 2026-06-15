"""rename vessels to vessel_inspections and add missing columns

Revision ID: 20260615_0003
Revises: 20260528_0002
Create Date: 2026-06-15

Migration này thực hiện:
1. Rename bảng 'vessels' -> 'vessel_inspections'
2. Rename cột 'registration_number' -> 'registration_no'
3. Thêm các cột còn thiếu: inspection_date, address_short, vessel_class, source_filename
4. Thêm UniqueConstraint(registration_no, inspection_date)
5. Cập nhật index theo tên mới
"""

from alembic import op
import sqlalchemy as sa


revision = "20260615_0003"
down_revision = "20260528_0002"
branch_labels = None
depends_on = None


def upgrade():
    # 1. Rename bảng
    op.rename_table("vessels", "vessel_inspections")

    # 2. Rename cột registration_number -> registration_no
    op.alter_column(
        "vessel_inspections",
        "registration_number",
        new_column_name="registration_no",
    )

    # 3. Thêm các cột còn thiếu
    op.add_column(
        "vessel_inspections",
        sa.Column("address_short", sa.String(length=60), nullable=True),
    )
    op.add_column(
        "vessel_inspections",
        sa.Column("vessel_class", sa.String(length=20), nullable=True),
    )
    op.add_column(
        "vessel_inspections",
        sa.Column(
            "inspection_date",
            sa.Date(),
            nullable=True,  # nullable trước để không lỗi với data cũ
        ),
    )
    op.add_column(
        "vessel_inspections",
        sa.Column("source_filename", sa.String(length=255), nullable=True),
    )

    # 4. Xóa index cũ (tên cũ theo bảng 'vessels')
    op.drop_index("ix_vessels_id", table_name="vessel_inspections")
    op.drop_index("ix_vessels_province_code", table_name="vessel_inspections")
    op.drop_index("ix_vessels_length_group", table_name="vessel_inspections")
    op.drop_index("ix_vessels_registration_number", table_name="vessel_inspections")

    # 5. Tạo index mới theo bảng 'vessel_inspections'
    op.create_index(
        "ix_vessel_inspections_id", "vessel_inspections", ["id"], unique=False
    )
    op.create_index(
        "ix_vessel_inspections_registration_no",
        "vessel_inspections",
        ["registration_no"],
        unique=False,  # không unique vì có thể 1 tàu nhiều lần kiểm tra
    )
    op.create_index(
        "ix_vessel_inspections_province_code",
        "vessel_inspections",
        ["province_code"],
        unique=False,
    )
    op.create_index(
        "ix_vessel_inspections_inspection_date",
        "vessel_inspections",
        ["inspection_date"],
        unique=False,
    )

    # 6. Thêm UniqueConstraint(registration_no, inspection_date)
    op.create_unique_constraint(
        "uq_vessel_inspection",
        "vessel_inspections",
        ["registration_no", "inspection_date"],
    )


def downgrade():
    # Ngược lại: rollback về schema cũ
    op.drop_constraint("uq_vessel_inspection", "vessel_inspections", type_="unique")

    op.drop_index("ix_vessel_inspections_inspection_date", table_name="vessel_inspections")
    op.drop_index("ix_vessel_inspections_province_code", table_name="vessel_inspections")
    op.drop_index("ix_vessel_inspections_registration_no", table_name="vessel_inspections")
    op.drop_index("ix_vessel_inspections_id", table_name="vessel_inspections")

    op.drop_column("vessel_inspections", "source_filename")
    op.drop_column("vessel_inspections", "inspection_date")
    op.drop_column("vessel_inspections", "vessel_class")
    op.drop_column("vessel_inspections", "address_short")

    op.alter_column(
        "vessel_inspections",
        "registration_no",
        new_column_name="registration_number",
    )

    op.create_index("ix_vessels_registration_number", "vessel_inspections", ["registration_number"], unique=True)
    op.create_index("ix_vessels_length_group", "vessel_inspections", ["length_group"], unique=False)
    op.create_index("ix_vessels_province_code", "vessel_inspections", ["province_code"], unique=False)
    op.create_index("ix_vessels_id", "vessel_inspections", ["id"], unique=False)

    op.rename_table("vessel_inspections", "vessels")
