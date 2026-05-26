from sqlalchemy import create_engine, text
from app.database import DATABASE_URL
from app.models.vessel import Base

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE vessel_inspections ADD COLUMN address_short VARCHAR(60);"))
    except Exception as e:
        print("address_short exists or error:", e)
    try:
        conn.execute(text("ALTER TABLE vessel_inspections ADD COLUMN fishing_gear VARCHAR(80);"))
    except Exception as e:
        print("fishing_gear exists or error:", e)
    try:
        conn.execute(text("ALTER TABLE vessel_inspections ADD COLUMN source_filename VARCHAR(255);"))
    except Exception as e:
        print("source_filename exists or error:", e)
    try:
        conn.execute(text("ALTER TABLE vessel_inspections ADD CONSTRAINT uq_vessel_inspection UNIQUE (registration_no, inspection_date);"))
    except Exception as e:
        print("uq_vessel_inspection exists or error:", e)
    
    conn.commit()

# Ensure all tables exist
Base.metadata.create_all(bind=engine)
print("DB check and upgrade complete.")
