"""migrate vessels table to vessel_inspections with new schema

Revision ID: 20260604_0003
Revises: 20260528_0002
Create Date: 2026-06-04
"""

from alembic import op
import sqlalchemy as sa


revision = "20260604_0003"
down_revision = "20260528_0002"
branch_labels = None
depends_on = None


def upgrade():
    # SQLite does not support ALTER TABLE RENAME COLUMN or ADD CONSTRAINT well,
    # so we use the batch-migration pattern: create new table, copy data, drop old.

    # 1. Create the new table with the correct schema
    op.create_table(
        "vessel_inspections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("registration_no", sa.String(length=25), nullable=True),
        sa.Column("province_code", sa.String(length=10), nullable=False),
        sa.Column("owner_name", sa.String(length=120), nullable=True),
        sa.Column("address", sa.String(length=250), nullable=True),
        sa.Column("address_short", sa.String(length=60), nullable=True),
        sa.Column("fishing_gear", sa.String(length=80), nullable=True),
        sa.Column("material", sa.String(length=20), nullable=True),
        sa.Column("lmax", sa.Float(), nullable=True),
        sa.Column("power_kw", sa.Float(), nullable=True),
        sa.Column("inspection_type", sa.String(length=20), nullable=False),
        sa.Column("length_group", sa.String(length=20), nullable=False),
        sa.Column("vessel_class", sa.String(length=20), nullable=True),
        sa.Column("inspection_date", sa.Date(), nullable=False),
        sa.Column("valid_until", sa.Date(), nullable=True),
        sa.Column("issued_date", sa.Date(), nullable=True),
        sa.Column("source_filename", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("registration_no", "inspection_date", name="uq_vessel_inspection"),
    )
    op.create_index(op.f("ix_vessel_inspections_id"), "vessel_inspections", ["id"], unique=False)
    op.create_index(op.f("ix_vessel_inspections_registration_no"), "vessel_inspections", ["registration_no"], unique=False)
    op.create_index(op.f("ix_vessel_inspections_province_code"), "vessel_inspections", ["province_code"], unique=False)
    op.create_index(op.f("ix_vessel_inspections_inspection_date"), "vessel_inspections", ["inspection_date"], unique=False)

    # 2. Copy existing data from old 'vessels' table to new 'vessel_inspections'
    #    Map old column names → new column names
    op.execute("""
        INSERT INTO vessel_inspections (
            id, registration_no, province_code, owner_name, address,
            address_short, fishing_gear, material, lmax, power_kw,
            inspection_type, length_group, vessel_class,
            inspection_date, valid_until, issued_date,
            source_filename, created_at
        )
        SELECT
            id,
            registration_number,
            COALESCE(province_code, 'UNK'),
            owner_name,
            address,
            '',
            fishing_gear,
            material,
            lmax,
            power_kw,
            COALESCE(inspection_type, 'khong_xac_dinh'),
            COALESCE(length_group, 'khong_xac_dinh'),
            'khong_xac_dinh',
            COALESCE(issued_date, date('now')),
            valid_until,
            issued_date,
            '',
            created_at
        FROM vessels
    """)

    # 3. Drop the old table
    op.drop_index(op.f("ix_vessels_registration_number"), table_name="vessels")
    op.drop_index(op.f("ix_vessels_province_code"), table_name="vessels")
    op.drop_index(op.f("ix_vessels_length_group"), table_name="vessels")
    op.drop_index(op.f("ix_vessels_id"), table_name="vessels")
    op.drop_table("vessels")


def downgrade():
    # Recreate old 'vessels' table
    op.create_table(
        "vessels",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("registration_number", sa.String(length=50), nullable=True),
        sa.Column("owner_name", sa.String(length=255), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("province_code", sa.String(length=10), nullable=True),
        sa.Column("province_name", sa.String(length=100), nullable=True),
        sa.Column("lmax", sa.Float(), nullable=True),
        sa.Column("power_kw", sa.Float(), nullable=True),
        sa.Column("material", sa.String(length=20), nullable=True),
        sa.Column("inspection_type", sa.String(length=50), nullable=True),
        sa.Column("length_group", sa.String(length=20), nullable=True),
        sa.Column("valid_until", sa.String(length=10), nullable=True),
        sa.Column("issued_date", sa.String(length=10), nullable=True),
        sa.Column("fishing_gear", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_vessels_id"), "vessels", ["id"], unique=False)
    op.create_index(op.f("ix_vessels_length_group"), "vessels", ["length_group"], unique=False)
    op.create_index(op.f("ix_vessels_province_code"), "vessels", ["province_code"], unique=False)
    op.create_index(op.f("ix_vessels_registration_number"), "vessels", ["registration_number"], unique=True)

    # Copy data back
    op.execute("""
        INSERT INTO vessels (
            id, registration_number, owner_name, address, province_code,
            lmax, power_kw, material, inspection_type, length_group,
            valid_until, issued_date, fishing_gear, created_at
        )
        SELECT
            id, registration_no, owner_name, address, province_code,
            lmax, power_kw, material, inspection_type, length_group,
            valid_until, issued_date, fishing_gear, created_at
        FROM vessel_inspections
    """)

    # Drop new table
    op.drop_index(op.f("ix_vessel_inspections_inspection_date"), table_name="vessel_inspections")
    op.drop_index(op.f("ix_vessel_inspections_province_code"), table_name="vessel_inspections")
    op.drop_index(op.f("ix_vessel_inspections_registration_no"), table_name="vessel_inspections")
    op.drop_index(op.f("ix_vessel_inspections_id"), table_name="vessel_inspections")
    op.drop_table("vessel_inspections")
