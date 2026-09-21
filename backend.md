# Backend & Database Architecture Document

> **Project:** AI-Powered Automated Underwater Marine Debris & Anomaly Detection System (SIH 26057)  
> **Database Engine:** SQLite 3 (Configured with Write-Ahead Logging WAL mode for high-throughput concurrency and power-loss fault tolerance)  
> **Security Model:** Air-gapped single-tenant local application (Bound exclusively to `127.0.0.1:8000`)

---

## 1. Database Initialization & Configuration Script

To ensure data integrity and prevent corruption during sudden power loss on AUVs or marine research vessels, SQLite must be initialized with the following PRAGMA settings upon server startup:

```sql
-- Enable foreign key constraint enforcement
PRAGMA foreign_keys = ON;

-- Write-Ahead Logging for non-blocking concurrent reads/writes and power-fault protection
PRAGMA journal_mode = WAL;

-- Optimize disk synchronization for performance without sacrificing crash resilience in WAL mode
PRAGMA synchronous = NORMAL;

-- Set busy timeout to wait for lock resolution during heavy batch inserts (5000ms)
PRAGMA busy_timeout = 5000;

-- Store temporary tables and indexes in RAM for maximum processing speed
PRAGMA temp_store = MEMORY;

-- Increase memory page cache size to 64MB
PRAGMA cache_size = -64000;
```

---

## 2. Complete SQL DDL Schema

### TABLE 1: `missions`

> Stores high-level survey log metadata for each ingested `.xtf` / `.jsf` file.

```sql
CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY NOT NULL,                   -- UUID v4
    filename TEXT NOT NULL,                         -- Original sonar log file name
    file_path TEXT NOT NULL,                        -- Local absolute path to stored raw log
    file_type TEXT NOT NULL CHECK(file_type IN ('xtf', 'jsf', 'png', 'jpg')),
    file_size_bytes INTEGER NOT NULL,
    total_pings INTEGER DEFAULT 0,
    swath_width_meters REAL DEFAULT 0.0,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    processing_status TEXT DEFAULT 'PENDING'
        CHECK(processing_status IN ('PENDING', 'PARSING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    error_log TEXT,                                 -- Stack trace or error details if processing fails
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TABLE 2: `telemetry_pings`

> Time-series telemetry and position records extracted from sonar ping headers.

```sql
CREATE TABLE IF NOT EXISTS telemetry_pings (
    id TEXT PRIMARY KEY NOT NULL,                   -- UUID v4
    mission_id TEXT NOT NULL,                       -- FK to missions
    ping_number INTEGER NOT NULL,                   -- Sequential ping index within the sonar log
    timestamp_utc TIMESTAMP,
    latitude REAL NOT NULL,                         -- WGS84 Decimal Degrees
    longitude REAL NOT NULL,                        -- WGS84 Decimal Degrees
    speed_knots REAL DEFAULT 0.0,
    heading_deg REAL DEFAULT 0.0,
    pitch_deg REAL DEFAULT 0.0,                     -- Vehicle pitch angle
    roll_deg REAL DEFAULT 0.0,                      -- Vehicle roll angle
    heave_m REAL DEFAULT 0.0,                       -- Vertical heave displacement
    altitude_m REAL DEFAULT 0.0,                    -- Altitude above seafloor
    has_motion_dropout BOOLEAN DEFAULT 0,           -- Flagged 1 if attitude spike caused row corruption
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    UNIQUE(mission_id, ping_number)                 -- Prevents duplicate ping entries per mission
);
```

### TABLE 3: `detections`

> AI model inferenced anomalies and multi-signal confidence scores.

```sql
CREATE TABLE IF NOT EXISTS detections (
    id TEXT PRIMARY KEY NOT NULL,                   -- UUID v4
    mission_id TEXT NOT NULL,                       -- FK to missions
    ping_number INTEGER NOT NULL,                   -- Ping row index where target centers
    class_name TEXT NOT NULL
        CHECK(class_name IN ('ghost_net', 'pipe', 'cylinder', 'shipwreck')),
    detection_type TEXT NOT NULL
        CHECK(detection_type IN ('mask', 'bbox')),
    bbox_json TEXT NOT NULL,                        -- Array [xmin, ymin, xmax, ymax] in pixel coordinates
    mask_polygon_json TEXT,                         -- Array [[x1,y1], [x2,y2], ...] for net contours
    latitude REAL NOT NULL,                         -- Calculated INS-corrected GPS Lat
    longitude REAL NOT NULL,                        -- Calculated INS-corrected GPS Long
    depth_m REAL DEFAULT 0.0,                       -- Seafloor depth at detection site
    yolo_confidence REAL NOT NULL,                  -- Native ONNX model confidence score [0.0 - 1.0]
    shadow_confidence REAL NOT NULL,                -- Shadow geometry consistency score [0.0 - 1.0]
    persistence_confidence REAL NOT NULL,           -- Multi-ping IoU tracker score [0.0 - 1.0]
    final_confidence REAL NOT NULL,                 -- Composite weighted confidence score [0.0 - 1.0]
    review_status TEXT DEFAULT 'UNREVIEWED'
        CHECK(review_status IN ('UNREVIEWED', 'CONFIRMED', 'REJECTED')),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
);
```

### TABLE 4: `operator_audit_logs`

> Human-in-the-loop review trail capturing operator adjustments for AI fine-tuning.

```sql
CREATE TABLE IF NOT EXISTS operator_audit_logs (
    id TEXT PRIMARY KEY NOT NULL,                   -- UUID v4
    detection_id TEXT NOT NULL,                     -- FK to detections
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    operator_notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (detection_id) REFERENCES detections(id) ON DELETE CASCADE
);
```

### TABLE 5: `system_config`

> Local persistent configuration for AI pipeline weights, thresholds, and paths.

```sql
CREATE TABLE IF NOT EXISTS system_config (
    config_key TEXT PRIMARY KEY NOT NULL,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Database Indexes & Optimization

To maintain **sub-50ms query response times** when rendering map viewports and scrollable anomaly lists across millions of sonar pings:

```sql
-- Fast lookup of telemetry pings by mission and ping sequence
CREATE INDEX IF NOT EXISTS idx_telemetry_mission_ping
ON telemetry_pings(mission_id, ping_number);

-- Fast filtering of detections in the Right Drawer UI by status and confidence
CREATE INDEX IF NOT EXISTS idx_detections_mission_status_conf
ON detections(mission_id, review_status, final_confidence DESC);

-- Geospatial indexing for fast bounding-box queries on Leaflet map pans
CREATE INDEX IF NOT EXISTS idx_detections_geospatial
ON detections(latitude, longitude);

-- Fast tracking of operator review history
CREATE INDEX IF NOT EXISTS idx_audit_detection
ON operator_audit_logs(detection_id);
```

---

## 4. Default Seed Data (System Configuration)

```sql
INSERT OR REPLACE INTO system_config (config_key, config_value) VALUES
    ('weight_yolo',              '0.50'),
    ('weight_shadow',            '0.25'),
    ('weight_persistence',       '0.25'),
    ('clahe_clip_limit',         '3.0'),
    ('clahe_grid_size',          '8'),
    ('min_confidence_threshold', '0.60'),
    ('tile_cache_directory',     '/app/static/tiles/'),
    ('onnx_execution_provider',  'CPU');  -- Set to 'CUDA' or 'TensorRT' on Jetson boards
```

---

## 5. Security Architecture, Permissions, & Data Ownership

### 5.1 Authentication & Session Strategy

| Policy | Detail |
|---|---|
| **Authentication** | **Explicitly Disabled** |
| **Justification** | The software operates strictly in an air-gapped, isolated environment onboard maritime vessels or embedded within an AUV compute container. Forcing a login UI introduces unnecessary friction during high-stress marine recovery operations. |

### 5.2 Service Binding & Network Isolation

| Rule | Detail |
|---|---|
| **Host Binding** | The FastAPI application server must bind exclusively to the loopback address (`127.0.0.1` / `localhost`) on port `8000`. |
| **Network Constraint** | It must **NEVER** bind to `0.0.0.0` or expose public network interfaces. All communication between the browser frontend and backend remains confined to local IPC (Inter-Process Communication). |

### 5.3 Data Ownership & OS File System Rules

**Process Privileges:** The backend process runs under a restricted local system user (`niot_operator`).

**File System Permissions:**

| Path | Permission | Purpose |
|---|---|---|
| `app/db/marine_vision.db` | `0600` (Read/Write) | Restricted to `niot_operator` only |
| `sample_data/` & `/app/static/tiles/` | `0644` (Read-Only) | Prevent accidental deletion of cached map tiles or raw sonar logs |
| `/tmp/exports/` | `0700` (Read/Write) | Temporary generation of PDF/CSV dive reports |
