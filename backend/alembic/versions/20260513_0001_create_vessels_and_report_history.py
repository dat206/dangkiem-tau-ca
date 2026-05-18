"""create vessels and report history tables

Revision ID: 20260513_0001
Revises:
Create Date: 2026-05-13
"""

from alembic import op
import sqlalchemy as sa


revision = "20260513_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
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

    op.create_table(
        "report_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("quarter", sa.Integer(), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("file_count", sa.Integer(), nullable=True),
        sa.Column("provinces", sa.String(length=500), nullable=True),
        sa.Column("file_path", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_report_history_created_at"), "report_history", ["created_at"], unique=False)
    op.create_index(op.f("ix_report_history_id"), "report_history", ["id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_report_history_id"), table_name="report_history")
    op.drop_index(op.f("ix_report_history_created_at"), table_name="report_history")
    op.drop_table("report_history")

    op.drop_index(op.f("ix_vessels_registration_number"), table_name="vessels")
    op.drop_index(op.f("ix_vessels_province_code"), table_name="vessels")
    op.drop_index(op.f("ix_vessels_length_group"), table_name="vessels")
    op.drop_index(op.f("ix_vessels_id"), table_name="vessels")
    op.drop_table("vessels")
