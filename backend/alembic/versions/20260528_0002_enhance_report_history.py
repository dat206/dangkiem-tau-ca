"""enhance report history metadata

Revision ID: 20260528_0002
Revises: 20260513_0001
Create Date: 2026-05-28
"""

from alembic import op
import sqlalchemy as sa


revision = "20260528_0002"
down_revision = "20260513_0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("report_history", sa.Column("record_count", sa.Integer(), nullable=True))
    op.add_column("report_history", sa.Column("file_types", sa.String(length=100), nullable=True))
    op.add_column("report_history", sa.Column("created_by", sa.String(length=255), nullable=True))


def downgrade():
    op.drop_column("report_history", "created_by")
    op.drop_column("report_history", "file_types")
    op.drop_column("report_history", "record_count")
