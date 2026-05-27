import sqlite3

DB_PATH = "D:/laragon/www/dangkiem-tau-ca/fishing.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

print("=== TABLES ===")
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print([r[0] for r in cur.fetchall()])

print("\n=== VESSELS (count) ===")
cur.execute("SELECT COUNT(*) FROM vessels")
print(f"Total: {cur.fetchone()[0]}")

print("\n=== VESSELS (last 10) ===")
cur.execute("""
    SELECT id, registration_number, owner_name, province_code, lmax, material, inspection_type, created_at
    FROM vessels ORDER BY id DESC LIMIT 10
""")
for r in cur.fetchall():
    print(r)

print("\n=== REPORT_HISTORY (count) ===")
cur.execute("SELECT COUNT(*) FROM report_history")
print(f"Total: {cur.fetchone()[0]}")

print("\n=== REPORT_HISTORY (all) ===")
cur.execute("""
    SELECT id, created_at, quarter, year, file_count, provinces, status
    FROM report_history ORDER BY id DESC
""")
for r in cur.fetchall():
    print(r)

conn.close()
