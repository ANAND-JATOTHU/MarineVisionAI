import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "marine_vision.db"))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    # Apply all 6 Edge PRAGMAs required by TRD for power-loss fault tolerance
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("PRAGMA temp_store = MEMORY;")
    conn.execute("PRAGMA cache_size = -64000;")
    
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Missions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY NOT NULL,
        filename TEXT NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        total_pings INTEGER DEFAULT 0,
        swath_width_meters REAL,
        status TEXT DEFAULT 'PROCESSING'
            CHECK(status IN ('PROCESSING', 'COMPLETED', 'FAILED'))
    );
    """)

    # 2. Detections Table (With Acoustic Material features)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS detections (
        id TEXT PRIMARY KEY NOT NULL,
        mission_id TEXT NOT NULL,
        ping_number INTEGER NOT NULL,
        class_name TEXT NOT NULL,
        detection_type TEXT NOT NULL,
        bbox_json TEXT NOT NULL,
        mask_polygon_json TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        depth_m REAL DEFAULT 0.0,
        yolo_confidence REAL NOT NULL,
        shadow_confidence REAL NOT NULL,
        persistence_confidence REAL NOT NULL,
        final_confidence REAL NOT NULL,
        acoustic_reflectivity REAL,
        material_estimate TEXT,
        review_status TEXT DEFAULT 'UNREVIEWED',
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
    );
    """)
    
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH} with WAL mode.")

if __name__ == "__main__":
    init_db()
