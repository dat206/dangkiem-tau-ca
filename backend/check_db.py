from sqlalchemy import create_engine, inspect, text

from app.database import DATABASE_URL
from app.models.vessel import Base


engine = create_engine(DATABASE_URL)


def run_optional_upgrade(conn, statement: str, label: str) -> None:
    try:
        conn.execute(text(statement))
    except Exception as exc:
        print(f"{label} exists or error: {exc}")


with engine.connect() as conn:
    run_optional_upgrade(
        conn,
        "ALTER TABLE vessel_inspections ADD COLUMN address_short VARCHAR(60);",
        "address_short",
    )
    run_optional_upgrade(
        conn,
        "ALTER TABLE vessel_inspections ADD COLUMN fishing_gear VARCHAR(80);",
        "fishing_gear",
    )
    run_optional_upgrade(
        conn,
        "ALTER TABLE vessel_inspections ADD COLUMN source_filename VARCHAR(255);",
        "source_filename",
    )
    run_optional_upgrade(
        conn,
        "ALTER TABLE vessel_inspections ADD CONSTRAINT uq_vessel_inspection UNIQUE (registration_no, inspection_date);",
        "uq_vessel_inspection",
    )
    conn.commit()

Base.metadata.create_all(bind=engine)

inspector = inspect(engine)
print("=== TABLES ===")
print(inspector.get_table_names())

with engine.connect() as conn:
    for table_name in ("vessel_inspections", "report_history"):
        if table_name not in inspector.get_table_names():
            continue
        count = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar_one()
        print(f"\n=== {table_name.upper()} ===")
        print(f"Total: {count}")

print("\nDB check and upgrade complete.")
