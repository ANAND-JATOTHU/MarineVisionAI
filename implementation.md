# Implementation Roadmap

> **Project:** AI-Powered Automated Underwater Marine Debris & Anomaly Detection System (SIH 26057)  
> **Phases:** 8 sequential implementation phases from environment setup to final deployment.

---

## Phase 1: Environment & Repository Setup

### Action Steps

**Directory Structure Initialization:** Create a clean, modular repository layout:

```
marine_vision/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── core/
│   │   ├── parser.py
│   │   ├── preprocessor.py
│   │   ├── inference.py
│   │   ├── fusion.py
│   │   └── geotag.py
│   ├── db/
│   │   └── database.py
│   └── static/
│       ├── css/style.css
│       ├── js/app.js
│       ├── tiles/          # Offline Leaflet map tiles
│       └── index.html
├── models/
│   └── yolo11n-seg.onnx   # Quantized INT8 ONNX model
├── sample_data/            # Sample .xtf / .jsf test logs
└── requirements.txt
```

**Virtual Environment & Dependencies:** Initialize Python 3.10 venv and populate `requirements.txt`:

- `fastapi`, `uvicorn[standard]`, `python-multipart`
- `onnxruntime` (or `onnxruntime-gpu` for CUDA/TensorRT target hardware)
- `opencv-python-headless`, `numpy`, `scipy`, `pyxtf`
- `pandas`, `reportlab`, `jinja2`, `sqlite3` (stdlib)

**ONNX Model & Test Assets:** Download pre-trained/converted `yolo11n-seg.onnx` into `models/` and place test `.xtf` logs into `sample_data/`.

### Deliverables

- [x] Fully initialized project repository with virtual environment and locked dependencies.
- [x] Executable configuration module (`config.py`) loading default paths and fusion weights.

---

## Phase 2: Security, Isolation & Database Implementation

### Action Steps

**Security & Air-Gapped Binding:** Configure Uvicorn to bind strictly to loopback IP (`127.0.0.1:8000`). Omit external login/auth layers to maintain zero-friction operation in isolated marine environments. Set OS file permissions (`0600`) for the database file.

**Database Engine Setup (`app/db/database.py`):**

Write SQLite connector function applying WAL mode, 64MB page cache, and foreign key enforcement on startup:

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000;
```

**DDL Execution:** Write schema execution scripts creating the 5 core tables: `missions`, `telemetry_pings`, `detections`, `operator_audit_logs`, and `system_config`.

**Database Indexes & Seeds:** Apply indexes on `telemetry_pings(mission_id, ping_number)` and `detections(latitude, longitude)`. Seed default pipeline weights into `system_config`.

### Deliverables

- [x] `app/db/database.py` script handling connection pooling, schema initialization, and WAL configuration.
- [x] Fully functional SQLite database file (`marine_vision.db`) verified with sample data inserts.

---

## Phase 3: Core UI Framework & Command Shell

### Action Steps

**Static Layout Construction (`app/static/index.html`):** Build a responsive, non-scrolling 3-column CSS Grid desktop layout adhering to the Dark Oceanic Command Center theme (`#030F1C` background).

**Component Integration:**

| Component | Content |
|---|---|
| **Top Navbar** | System title, `[OFFLINE READY]` badge, upload controls, export button. |
| **Left Sidebar** | Telemetry readouts and fusion weight sliders (Wₘ, Wₛ, Wₚ). |
| **Center Workspace** | HTML5 Canvas for sonar waterfall rendering + container div for Leaflet map. |
| **Right Drawer** | Scrollable container for anomaly detection cards. |

**Offline Map Initialization (`app/static/js/app.js`):** Initialize Leaflet.js pointing to local tile directory (`/static/tiles/{z}/{x}/{y}.png`) to eliminate internet calls.

### Deliverables

- [x] Functional single-page UI shell loading static CSS/JS without external CDN calls.
- [x] Responsive dark-themed dashboard layout with Leaflet map rendering pre-cached offline tiles.

---

## Phase 4: DSP & AI Model Pipeline (Main Features)

### Action Steps

**Raw Log Parser (`app/core/parser.py`):** Implement `.xtf` and `.jsf` ingestion using `pyxtf`, extracting ping intensity arrays alongside GPS, pitch, roll, and heave telemetry vectors.

**Adaptive Signal Preprocessor (`app/core/preprocessor.py`):**

1. Implement **Lee/Frost despeckling** filter and **CLAHE contrast normalization**.
2. Build **slant-range correction** formula converting slant-range pixels to uniform ground resolution.
3. Implement **motion dropout repair** using `cv2.inpaint` on pings flagged with attitude spikes.

**ONNX Inference Engine (`app/core/inference.py`):** Set up `onnxruntime.InferenceSession` for `yolo11n-seg.onnx`. Parse bounding boxes for rigid targets and polygon instance masks for ghost nets.

**Multi-Signal Confidence Fusion (`app/core/fusion.py`):** Combine native model score (Cₘ), physical acoustic shadow match (Cₛ), and cross-ping persistence (Cₚ) into `final_confidence`.

### Deliverables

- [x] Ingestion script extracting clean ping arrays and telemetry headers from `.xtf` files.
- [x] Image preprocessing module executing slant-range normalization and inpainting.
- [x] Functional ONNX inference and multi-signal confidence calculation module.

---

## Phase 5: System Integrations & Export Engine

### Action Steps

**Geotagging Engine (`app/core/geotag.py`):** Map target pixel coordinates (px, py) to real-world WGS84 latitude and longitude using INS trackline interpolation and vehicle attitude correction.

**FastAPI Endpoints (`app/main.py`):**

| Method | Route | Behavior |
|---|---|---|
| `POST` | `/api/mission/upload` | Ingest file, execute DSP/AI pipeline, save record, return mission summary. |
| `GET` | `/api/mission/{id}/detections` | Return JSON payload of all detected anomalies with GPS coordinates. |
| `POST` | `/api/detection/{id}/review` | Accept `CONFIRMED` / `REJECTED` status updates from UI and log to `operator_audit_logs`. |

**WebSocket Simulation Stream (`/ws/simulation/{id}`):** Build WebSocket handler streaming historical pings sequentially to simulate live AUV mission playback.

**PDF/CSV Report Generator:** Implement ReportLab PDF generator outputting formatted dive target sheets with maps, coordinates, and cropped thumbnails.

### Deliverables

- [x] Complete FastAPI server hosting REST routes and WebSocket live simulation endpoint.
- [x] Working PDF and CSV export engine producing dive-ready target reports.

---

## Phase 6: System Integration & UI Interaction Wiring

### Action Steps

**Two-Way UI Binding (`app/static/js/app.js`):**

1. Wire file **drag-and-drop** to trigger `POST /api/mission/upload` and render progress modal.
2. Bind anomaly **card clicks** in Right Drawer to auto-pan the Leaflet map and scroll the Waterfall Canvas to the matching ping row.
3. Bind Leaflet **map marker clicks** to highlight the matching detection card in the Right Drawer.

**Review Feedback Loop:** Wire Confirm (green) and Reject (red) buttons to send immediate status updates to `/api/detection/{id}/review` and update card/marker opacity dynamically.

### Deliverables

- [x] Fully reactive frontend dynamically rendering incoming detection streams.
- [x] Bidirectional canvas-map synchronization linking visual sonar pings to GPS map locations.

---

## Phase 7: Testing & Quality Assurance

### Action Steps

**Unit Testing:** Write `pytest` test suites verifying:

- `.xtf` parser accurately decouples telemetry headers.
- Slant-range correction transforms pixel arrays without array index errors.
- ONNX inference outputs valid bounding box/polygon dimensions.

**Air-Gap Network Audit:** Run Wireshark / `tcpdump` during full system execution to verify **0 external network requests** are made.

**Fault Tolerance Verification:** Simulate corrupted `.xtf` files with missing ping rows and power cuts mid-processing to confirm SQLite WAL mode prevents database corruption.

### Deliverables

- [x] Test suite passing with target code coverage.
- [x] Audit report confirming 100% offline network compliance and crash recovery resilience.

---

## Phase 8: Offline Deployment & Final Polish

### Action Steps

**Standalone Packaging:** Package application into a single executable shell script or Docker container bundling Python dependencies, static tiles, and ONNX runtime assets.

**Desktop Launcher Script (`run_offline.sh`):**

```bash
#!/bin/bash
echo "Starting NIOT Marine Vision System (Offline Mode)..."
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1
```

**Final UI Polish:** Verify contrast ratios, button hover glows, dark theme aesthetics, and toast notification alerts.

### Deliverables

- [x] Production-ready, single-click launcher script (`run_offline.sh`) starting local web server at `http://127.0.0.1:8000`.
- [x] Fully validated, zero-cloud software prototype matching all requirements of SIH Problem Statement ID 26057.
