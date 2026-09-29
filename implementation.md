# Implementation Roadmap

> **Project:** AI-Powered Automated Underwater Marine Debris & Anomaly Detection System (SIH 26057)  
> **Phases:** 8 sequential implementation phases from environment setup to final deployment.  
> **Repository:** [MarineVisionAI](https://github.com/ANAND-JATOTHU/MarineVisionAI.git)  
> **Architecture:** 100% Offline, Air-Gapped Edge Deployment

---

## Phase 1: Environment & Repository Setup

> **Owner:** Team Lead (Anand) | **Support:** All Members  
> **Duration:** Day 1

### Action Steps

**Directory Structure Initialization:** Create the conflict-free workspace layout isolating each team member's code:

```
MarineVisionAI/
├── marine_vision/
│   ├── model_training/              # LEAD: Datasets, YOLO11n-seg training, ONNX export
│   │   ├── datasets/
│   │   │   ├── images/train/
│   │   │   ├── images/val/
│   │   │   ├── labels/train/
│   │   │   └── labels/val/
│   │   ├── configs/
│   │   │   └── marine_debris.yaml   # Ultralytics dataset config
│   │   └── scripts/
│   │       ├── train.py
│   │       ├── export_onnx.py
│   │       └── validate.py
│   ├── backend/
│   │   ├── core/
│   │   │   └── dsp/                 # MEMBER 1: pyxtf, CLAHE, slant-range, inpainting
│   │   │       ├── __init__.py
│   │   │       ├── parser.py
│   │   │       ├── preprocessor.py
│   │   │       └── utils.py
│   │   ├── db/                      # MEMBER 2: SQLite WAL schema, models
│   │   │   ├── __init__.py
│   │   │   ├── database.py
│   │   │   └── models.py
│   │   ├── api/                     # MEMBER 2: FastAPI, ONNX runner, reports
│   │   │   ├── __init__.py
│   │   │   ├── main.py              # FastAPI app entrypoint + Uvicorn launcher
│   │   │   ├── config.py            # Centralized configuration (paths, weights, thresholds)
│   │   │   ├── routes.py            # REST endpoint handlers
│   │   │   ├── websocket.py         # WebSocket simulation handler
│   │   │   ├── inference.py         # ONNX Runtime inference runner
│   │   │   ├── fusion.py            # Multi-signal confidence fusion engine
│   │   │   ├── geotag.py            # INS-corrected geotagging
│   │   │   ├── reports.py           # ReportLab PDF + Pandas CSV generators
│   │   │   └── security.py          # Upload validation, path traversal defense
│   │   └── requirements.txt         # Python dependencies (pinned versions)
│   ├── frontend/                    # MEMBER 3: React.js (Vite), Leaflet.js, UI
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   ├── src/
│   │   │   ├── main.jsx
│   │   │   ├── App.jsx
│   │   │   ├── index.css
│   │   │   ├── components/          # React components (Navbar, Sidebar, Map, etc.)
│   │   │   ├── hooks/               # Custom React hooks (useWebSocket, useMission)
│   │   │   ├── utils/               # API client (localhost:8000 only)
│   │   │   └── static/
│   │   │       └── tiles/           # Pre-cached OpenStreetMap tiles (offline)
│   │   └── public/
│   ├── edge_tests/                  # MEMBER 4: Docker, benchmarks, QA
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── benchmarks/
│   │   ├── tests/
│   │   └── scripts/
│   │       ├── run_offline.sh       # Linux/Mac launcher
│   │       └── run_offline.bat      # Windows launcher
│   ├── models/                      # Shared: INT8 ONNX model (best.onnx)
│   └── sample_data/                 # Shared: Raw .xtf / .jsf test sonar logs
├── shared_contracts.json            # Module API boundary specification
├── lead.md                          # Team Lead operational handbook
├── teammates.md                     # Member 1–5 detailed assignments
├── git.md                           # Git collaboration manual
├── .gitignore                       # Binary/secret exclusions
└── .cursorignore                    # AI agent token optimization
```

**Virtual Environment & Dependencies:** Initialize Python 3.10+ venv and create `marine_vision/backend/requirements.txt`:

```txt
# ── Web Framework ──────────────────────────────
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
python-multipart>=0.0.6
websockets>=12.0

# ── AI & Computer Vision ───────────────────────
onnxruntime>=1.16.0
# onnxruntime-gpu>=1.16.0          # Uncomment for CUDA/TensorRT on Jetson
opencv-python-headless>=4.8.0
numpy>=1.24.0
scipy>=1.11.0

# ── Sonar Log Parsing ─────────────────────────
pyxtf>=1.4.0

# ── Database (stdlib — no install needed) ──────
# sqlite3

# ── Reporting & Data Export ────────────────────
pandas>=2.1.0
reportlab>=4.0.0
jinja2>=3.1.0

# ── Testing ────────────────────────────────────
pytest>=7.4.0
pytest-asyncio>=0.21.0
httpx>=0.25.0
```

**Centralized Configuration (`marine_vision/backend/api/config.py`):**

```python
import os
from pathlib import Path

# ── Base Paths ──────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent  # marine_vision/
MODELS_DIR = PROJECT_ROOT / "models"
SAMPLE_DATA_DIR = PROJECT_ROOT / "sample_data"
FRONTEND_DIST_DIR = PROJECT_ROOT / "frontend" / "dist"
TILE_CACHE_DIR = PROJECT_ROOT / "frontend" / "src" / "static" / "tiles"
DB_PATH = PROJECT_ROOT / "backend" / "db" / "marine_vision.db"
EXPORT_DIR = PROJECT_ROOT / "exports"

# ── ONNX Model ──────────────────────────────────
ONNX_MODEL_PATH = MODELS_DIR / "best.onnx"
ONNX_PROVIDER = os.getenv("ONNX_PROVIDER", "CPUExecutionProvider")
INPUT_SIZE = 640  # YOLO input resolution

# ── Fusion Engine Weights ───────────────────────
WEIGHT_YOLO = 0.50
WEIGHT_SHADOW = 0.25
WEIGHT_PERSISTENCE = 0.25

# ── DSP Parameters ──────────────────────────────
CLAHE_CLIP_LIMIT = 3.0
CLAHE_GRID_SIZE = (8, 8)
DESPECKLE_WINDOW = 5
DESPECKLE_DAMPING = 1.0
INPAINT_RADIUS = 3

# ── Confidence Thresholds ───────────────────────
MIN_CONFIDENCE_THRESHOLD = 0.60

# ── Motion Dropout Thresholds ───────────────────
PITCH_SPIKE_THRESHOLD = 5.0   # degrees between consecutive pings
ROLL_SPIKE_THRESHOLD = 8.0    # degrees between consecutive pings

# ── Server ──────────────────────────────────────
HOST = "127.0.0.1"           # NEVER change to "0.0.0.0"
PORT = 8000
WORKERS = 1                  # Single worker for SQLite thread safety

# ── Allowed Upload Extensions ───────────────────
ALLOWED_EXTENSIONS = {".xtf", ".jsf", ".png", ".jpg"}
MAX_UPLOAD_SIZE_MB = 500
```

**ONNX Model & Test Assets:** Place the pre-trained INT8-quantized `best.onnx` into `marine_vision/models/` and test `.xtf` sonar logs into `marine_vision/sample_data/`.

**React Frontend Scaffold:** Initialize the Vite + React project:

```bash
cd marine_vision/frontend
npm create vite@latest . -- --template react
npm install
npm install leaflet react-leaflet
```

### Deliverables

- [ ] Fully initialized project repository with conflict-free directory structure.
- [ ] Python virtual environment with pinned `requirements.txt` dependencies.
- [ ] Centralized `config.py` module loading default paths, weights, and thresholds.
- [ ] React.js (Vite) frontend project scaffolded with Leaflet dependencies installed.
- [ ] `.gitignore` preventing binary assets from version control.

### Acceptance Criteria

- `pip install -r requirements.txt` completes without errors on Python 3.10+.
- `npm install` and `npm run dev` in `frontend/` launches Vite dev server.
- All team members can clone the repo and see their isolated working directories.

---

## Phase 2: Security, Isolation & Database Implementation

> **Owner:** Member 2 (Backend & Database Engineer)  
> **Duration:** Days 2–3

### Action Steps

**Security & Air-Gapped Binding:** Configure Uvicorn in `marine_vision/backend/api/main.py` to bind strictly to loopback IP (`127.0.0.1:8000`). Explicitly omit authentication — the application runs in an air-gapped environment aboard marine vessels where login friction is unacceptable during high-stress recovery operations.

**File Upload Security (`marine_vision/backend/api/security.py`):** Implement path traversal defense:

- Strip directory components from uploaded filenames using `os.path.basename()`.
- Reject filenames containing `..`, `/`, `\`, or URL-encoded path separators (`%2F`, `%5C`).
- Validate file extensions against the allowed set: `.xtf`, `.jsf`, `.png`, `.jpg`.
- Verify the resolved absolute path stays within the upload directory boundary.

**Database Engine Setup (`marine_vision/backend/db/database.py`):**

Write SQLite connector function applying all 6 PRAGMAs on startup for WAL mode, fault tolerance, and performance:

```sql
PRAGMA foreign_keys = ON;        -- Enforce referential integrity
PRAGMA journal_mode = WAL;       -- Write-Ahead Logging for crash resilience
PRAGMA synchronous = NORMAL;     -- Optimized sync without sacrificing WAL safety
PRAGMA busy_timeout = 5000;      -- Wait up to 5s for lock resolution during batch inserts
PRAGMA temp_store = MEMORY;      -- Temporary tables in RAM for max speed
PRAGMA cache_size = -64000;      -- 64MB memory page cache
```

**DDL Execution:** Create the 5 core tables as specified in [`backend.md`](backend.md):

| Table | Purpose |
|---|---|
| `missions` | Survey log metadata for each ingested `.xtf` / `.jsf` file |
| `telemetry_pings` | Time-series INS navigation and attitude records |
| `detections` | AI-inferred anomalies with multi-signal confidence scores |
| `operator_audit_logs` | Human-in-the-loop review trail |
| `system_config` | Local pipeline configuration key-value store |

**Database Indexes:** Apply all 4 performance indexes for sub-50ms query response:

```sql
CREATE INDEX IF NOT EXISTS idx_telemetry_mission_ping
  ON telemetry_pings(mission_id, ping_number);

CREATE INDEX IF NOT EXISTS idx_detections_mission_status_conf
  ON detections(mission_id, review_status, final_confidence DESC);

CREATE INDEX IF NOT EXISTS idx_detections_geospatial
  ON detections(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_audit_detection
  ON operator_audit_logs(detection_id);
```

**Seed Data:** Insert default fusion weights and pipeline configuration into `system_config`:

```sql
INSERT OR REPLACE INTO system_config (config_key, config_value) VALUES
    ('weight_yolo',              '0.50'),
    ('weight_shadow',            '0.25'),
    ('weight_persistence',       '0.25'),
    ('clahe_clip_limit',         '3.0'),
    ('clahe_grid_size',          '8'),
    ('min_confidence_threshold', '0.60'),
    ('tile_cache_directory',     '/static/tiles/'),
    ('onnx_execution_provider',  'CPU');
```

**Database File Permissions:** Set `marine_vision.db` to `0600` (read/write for `niot_operator` only):

```bash
chmod 0600 marine_vision/backend/db/marine_vision.db
```

### Deliverables

- [ ] `marine_vision/backend/db/database.py` — SQLite connector with all 6 PRAGMAs, schema initialization, and WAL configuration.
- [ ] `marine_vision/backend/db/models.py` — Python dataclasses/Pydantic models mapping to all 5 database tables.
- [ ] `marine_vision/backend/api/security.py` — File upload validator with path traversal defense.
- [ ] Fully functional `marine_vision.db` verified with sample data inserts and PRAGMA checks.

### Acceptance Criteria

- `PRAGMA journal_mode;` returns `wal` after database initialization.
- `PRAGMA foreign_keys;` returns `1`.
- Inserting a detection with an invalid `mission_id` fails with a foreign key constraint error.
- Uploading a file named `../../etc/passwd` returns HTTP 400.
- All 4 indexes are present when querying `sqlite_master`.

---

## Phase 3: Core UI Framework & Command Shell

> **Owner:** Member 3 (Frontend React Engineer)  
> **Duration:** Days 2–4 (parallel with Phase 2)

### Action Steps

**React Application Shell (`marine_vision/frontend/src/App.jsx`):** Build a responsive, non-scrolling single-screen desktop layout using CSS Grid, adhering to the **Dark Oceanic Command Center** theme.

**Design System (`marine_vision/frontend/src/index.css`):**

```css
:root {
    --color-navy:        #030F1C;    /* Primary background */
    --color-slate:       #0A2540;    /* Panel backgrounds, cards */
    --color-neon-teal:   #00E5FF;    /* Primary accent, interactive elements */
    --color-amber:       #FFB000;    /* Warning states, simulation mode */
    --color-green:       #00E676;    /* Success, confirmed states */
    --color-red:         #FF1744;    /* Error, rejected states */
    --color-text:        #E0E8F0;    /* Primary text */
    --color-text-dim:    #6B8299;    /* Dimmed/secondary text */
}
```

**React Component Architecture:**

| Component | Location | Content |
|---|---|---|
| `Navbar.jsx` | `src/components/` | System title ("NIOT Marine Vision"), `[OFFLINE READY]` status pill, "Upload Sonar Log" button (teal), "Simulate Live Mission" button (amber border), "Export Report" button (disabled until data loads). |
| `Sidebar.jsx` | `src/components/` | Telemetry readouts (Speed, Depth, Altitude, Heading) and fusion weight sliders (Wₘ, Wₛ, Wₚ) with range inputs. |
| `WaterfallCanvas.jsx` | `src/components/` | HTML5 `<canvas>` rendering sonar waterfall imagery with bounding box and polygon mask overlays. |
| `LeafletMap.jsx` | `src/components/` | Offline Leaflet map using pre-cached local tiles at `/static/tiles/{z}/{x}/{y}.png`. Default center: `13.02° N, 80.24° E`. |
| `DetectionDrawer.jsx` | `src/components/` | Scrollable right panel containing `DetectionCard` components sorted by `final_confidence` descending. |
| `DetectionCard.jsx` | `src/components/` | Target thumbnail, class badge, confidence breakdown bar (Cₘ, Cₛ, Cₚ, Final), Confirm (green) and Reject (red) buttons. |
| `ProcessingModal.jsx` | `src/components/` | Frosted-glass overlay with step-by-step progress bar showing pipeline stages. |
| `ExportModal.jsx` | `src/components/` | Filter checkboxes (Confirmed/Unreviewed/Rejected) and format radio buttons (PDF/CSV/JSON). |
| `SimulationControls.jsx` | `src/components/` | Floating dock with Play/Pause toggle, speed selector (1x/2x/5x), and Stop button. |
| `StatusFooter.jsx` | `src/components/` | Connection status, database health, model load status (polls `GET /api/health`). |

**Offline Map Initialization (`LeafletMap.jsx`):**

```jsx
import { MapContainer, TileLayer } from "react-leaflet";

<MapContainer center={[13.02, 80.24]} zoom={10} style={{ height: "100%" }}>
    <TileLayer
        url="/static/tiles/{z}/{x}/{y}.png"   // LOCAL tiles — no internet
        attribution="© OpenStreetMap (cached)"
        maxZoom={18}
    />
</MapContainer>
```

> ⚠️ **CRITICAL:** The tile URL must point to a local path. Never use `https://tile.openstreetmap.org`. Pre-cache tiles using the download script in `edge_tests/scripts/download_tiles.py` before deployment.

**API Client (`marine_vision/frontend/src/utils/api.js`):**

All HTTP calls target `http://127.0.0.1:8000` exclusively. No external URLs permitted. Request/response payloads must conform exactly to the schemas defined in [`shared_contracts.json`](shared_contracts.json).

### Deliverables

- [ ] Vite + React project with all 10 component files created.
- [ ] Dark Oceanic Command Center theme with full CSS custom property system.
- [ ] Non-scrolling 3-column CSS Grid layout matching the wireframe in [`ux.md`](ux.md).
- [ ] Leaflet map rendering pre-cached offline tiles with dark basemap.
- [ ] Drag-and-drop zone in the Waterfall Canvas area.

### Acceptance Criteria

- `npm run dev` starts successfully and renders the empty dashboard state.
- No `<script>` tags reference external CDN URLs.
- No `fetch()` or `import` references any URL other than `http://127.0.0.1:8000`.
- Leaflet map renders without an internet connection using local tiles.
- Layout is non-scrolling and fills the viewport on a 1920×1080 display.

---

## Phase 4: DSP & AI Model Pipeline (Main Features)

> **Owner:** Member 1 (DSP Engineer) + Team Lead (Model Training)  
> **Duration:** Days 3–5 (parallel with Phase 3)

### Action Steps

**Raw Log Parser (`marine_vision/backend/core/dsp/parser.py`):**

Implement `.xtf` and `.jsf` ingestion using `pyxtf`:

- Use `pyxtf.read_XTF(filepath)` to extract `XTFHeaderNav` (navigation) and channel data.
- Extract ping intensity arrays from sonar channel data (channels 0 and 1 for port/starboard).
- Stack all ping rows vertically into a single 2D NumPy array — the "waterfall matrix" (`shape: [num_pings, num_samples]`, `dtype: float32`).
- Parse INS attitude records (pitch, roll, heave, heading, speed) from navigation headers.
- Flag pings with `has_motion_dropout = True` when attitude change exceeds thresholds:
  - Pitch spike: `> 5.0°` between consecutive pings
  - Roll spike: `> 8.0°` between consecutive pings

**Output Contract:** Return a `ParsedSonarData` dataclass containing `waterfall_matrix`, `telemetry` list, and `metadata`.

**Adaptive Signal Preprocessor (`marine_vision/backend/core/dsp/preprocessor.py`):**

Execute the DSP pipeline in strict order:

```
Raw Waterfall → Lee/Frost Despeckling → Slant-Range Correction → Motion Dropout Inpainting → CLAHE Normalization → Output
```

| Step | Library | Function | Parameters |
|---|---|---|---|
| 1. Lee/Frost Despeckling | OpenCV / SciPy | Custom Lee filter | `window_size=5`, `damping_factor=1.0` |
| 2. Slant-Range Correction | NumPy | Resample each ping row from slant-range to uniform ground-range | Based on altitude + swath geometry |
| 3. Motion Dropout Inpainting | OpenCV | `cv2.inpaint()` on rows flagged `has_motion_dropout=True` | `inpaintRadius=3`, `flags=cv2.INPAINT_TELEA` |
| 4. CLAHE Normalization | OpenCV | `cv2.createCLAHE()` | `clipLimit=3.0`, `tileGridSize=(8, 8)` |

**Slant-Range Correction Formula:**

```python
def slant_range_to_ground_range(slant_range_pixels: np.ndarray, altitude_m: float, swath_width_m: float) -> np.ndarray:
    num_samples = slant_range_pixels.shape[0]
    slant_ranges = np.linspace(0, swath_width_m / 2, num_samples)
    ground_ranges = np.sqrt(np.maximum(slant_ranges**2 - altitude_m**2, 0))
    uniform_ground = np.linspace(ground_ranges[0], ground_ranges[-1], num_samples)
    return np.interp(uniform_ground, ground_ranges, slant_range_pixels)
```

**Output Contract:** Return a preprocessed `np.ndarray` (`shape: H×W`, `dtype: float32`, values normalized `0.0–1.0`).

**ONNX Inference Engine (`marine_vision/backend/api/inference.py`):**

```python
import onnxruntime as ort
import numpy as np

class ONNXDetector:
    def __init__(self, model_path: str):
        self.session = ort.InferenceSession(
            model_path,
            providers=[config.ONNX_PROVIDER],
        )
        self.input_name = self.session.get_inputs()[0].name

    def predict(self, image: np.ndarray) -> list[dict]:
        """
        Run YOLO11n-seg inference on a preprocessed sonar image tile.
        Returns list of detections with bounding boxes AND polygon masks.
        """
        blob = cv2.resize(image, (640, 640))
        blob = np.expand_dims(blob, axis=(0, 1)).astype(np.float32)
        blob = np.repeat(blob, 3, axis=1)  # Grayscale → 3-channel
        outputs = self.session.run(None, {self.input_name: blob})
        return self._postprocess(outputs)
```

**Multi-Signal Confidence Fusion (`marine_vision/backend/api/fusion.py`):**

Combine three independent confidence signals into `final_confidence`:

| Signal | Symbol | Weight (Default) | Source |
|---|---|---|---|
| YOLO Model Score | Cₘ | `0.50` | Native ONNX objectness confidence |
| Shadow Geometry Match | Cₛ | `0.25` | Physical acoustic shadow consistency |
| Cross-Ping Persistence | Cₚ | `0.25` | Multi-ping IoU temporal tracker |

```python
final_confidence = (Wₘ × Cₘ) + (Wₛ × Cₛ) + (Wₚ × Cₚ)
```

The fusion engine aggressively filters natural rocks (which have inconsistent shadows and don't persist across pings) from true anthropogenic debris.

**YOLO11n-seg Training (Lead — `marine_vision/model_training/`):**

- Annotate sonar waterfall images in YOLO segmentation format (polygon masks for ghost nets, bounding boxes for rigid targets).
- Train with shadow-aware augmentation parameters: `mixup=0.0`, `perspective=0.0`, `hsv_h=0.0`, `hsv_s=0.0`.
- Export to INT8 ONNX via `onnxruntime.quantization.quantize_dynamic()`.
- Deploy `best.onnx` to `marine_vision/models/`.

### Deliverables

- [ ] `parser.py` — Ingestion script extracting clean ping arrays and telemetry headers from `.xtf` files.
- [ ] `preprocessor.py` — Full 4-stage DSP pipeline producing normalized float32 waterfall images.
- [ ] `inference.py` — ONNX Runtime inference runner consuming `best.onnx` and returning detections.
- [ ] `fusion.py` — Multi-signal confidence fusion calculator with configurable weights.
- [ ] `best.onnx` — INT8-quantized YOLO11n-seg model (≤ 12 MB) in `models/`.

### Acceptance Criteria

- Parser extracts correct ping count matching `.xtf` file header.
- Preprocessor output shape matches input shape (no array index errors).
- ONNX inference returns valid bounding box coordinates (xmin < xmax, ymin < ymax).
- Fusion produces `final_confidence` values clamped to `[0.0, 1.0]`.
- Model inference runs at ≥ 15 FPS on CPU at 640×640 resolution.

---

## Phase 5: API Endpoints & Export Engine

> **Owner:** Member 2 (Backend & Database Engineer)  
> **Duration:** Days 5–7

### Action Steps

**Geotagging Engine (`marine_vision/backend/api/geotag.py`):**

Map target pixel coordinates `(px, py)` to real-world WGS84 latitude and longitude using:

1. INS trackline interpolation between adjacent ping GPS positions.
2. Vehicle attitude correction (pitch, roll, heave) for pixel-to-ground offset.
3. Slant-range geometry for cross-track distance calculation.

**FastAPI REST Endpoints (`marine_vision/backend/api/routes.py`):**

| Method | Route | Request | Response | Behavior |
|---|---|---|---|---|
| `GET` | `/api/health` | — | `SystemHealthCheck` | Return model load status, DB health, tile availability, uptime. |
| `POST` | `/api/mission/upload` | `multipart/form-data` | `MissionUploadResponse` | Validate file → Parse (DSP) → Infer (ONNX) → Fuse → Geotag → Save to DB. |
| `GET` | `/api/mission/{id}/detections` | Path param `id` | `DetectionObject[]` | Query all detections for a mission with GPS coordinates. |
| `POST` | `/api/detection/{id}/review` | `ReviewStatusUpdate` | `ReviewStatusResponse` | Update detection status, log to `operator_audit_logs`. |
| `GET` | `/api/mission/{id}/export/{format}` | Path + query params | File download | Generate and stream PDF/CSV/JSON report. |

> All request/response payloads **MUST** conform exactly to the schemas in [`shared_contracts.json`](shared_contracts.json).

**WebSocket Simulation Stream (`marine_vision/backend/api/websocket.py`):**

| Protocol | Route | Behavior |
|---|---|---|
| `WS` | `/ws/simulation/{id}` | Stream historical pings sequentially to simulate live AUV mission playback. Each message follows the `WebSocketSimulationMessage` schema. |

Message types: `ping` (telemetry + intensity row), `detection` (real-time alert), `mission_complete`, `error`.

**PDF/CSV Report Generator (`marine_vision/backend/api/reports.py`):**

- **PDF (ReportLab):** Formatted dive target sheet with cover summary, map snapshot, and table of targets (GPS, depth, dimensions, cropped thumbnail).
- **CSV (Pandas):** Tabular export with columns: `detection_id`, `class_name`, `latitude`, `longitude`, `depth_m`, `final_confidence`, `review_status`.
- **JSON:** Raw structured export matching `DetectionObject[]` schema.

Export filters (via query parameters):
- `include_confirmed=true` (default)
- `include_unreviewed=false`
- `include_rejected=false`

**Static File Serving:** Mount the React.js production build (`frontend/dist/`) as static files:

```python
from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory=config.FRONTEND_DIST_DIR, html=True), name="frontend")
```

### Deliverables

- [ ] `routes.py` — All 5 REST endpoints matching `shared_contracts.json` schemas.
- [ ] `websocket.py` — Live simulation WebSocket handler with 4 message types.
- [ ] `geotag.py` — INS-corrected pixel-to-GPS coordinate mapper.
- [ ] `reports.py` — PDF dive target sheet + CSV + JSON export generators.
- [ ] `main.py` — FastAPI app serving both API and static React frontend.

### Acceptance Criteria

- `POST /api/mission/upload` with a valid `.xtf` file returns `MissionUploadResponse` with `processing_status: "COMPLETED"`.
- `GET /api/mission/{id}/detections` returns a JSON array matching the `DetectionObject` schema.
- `POST /api/detection/{id}/review` with `{"status": "CONFIRMED"}` updates the database and returns `ReviewStatusResponse`.
- `GET /api/mission/{id}/export/pdf` downloads a valid PDF file.
- WebSocket connection at `/ws/simulation/{id}` streams `ping` messages in sequence.
- `GET /api/health` returns `{"status": "online", "model_loaded": true, "database_ok": true}`.

---

## Phase 6: System Integration & UI Interaction Wiring

> **Owner:** Member 3 (Frontend React Engineer) + Member 2 (Backend)  
> **Duration:** Days 7–9

### Action Steps

**API Integration (`marine_vision/frontend/src/utils/api.js`):**

Wire all React components to the backend API:

```javascript
const BASE_URL = "http://127.0.0.1:8000";

export async function uploadMission(file) { /* POST /api/mission/upload */ }
export async function getDetections(missionId) { /* GET /api/mission/{id}/detections */ }
export async function reviewDetection(detectionId, status, notes) { /* POST /api/detection/{id}/review */ }
export async function exportReport(missionId, format, filters) { /* GET /api/mission/{id}/export/{format} */ }
export function connectSimulation(missionId) { /* WS /ws/simulation/{id} */ }
export async function checkHealth() { /* GET /api/health */ }
```

**Drag-and-Drop File Upload:**

1. Wire the waterfall canvas drop zone to trigger `POST /api/mission/upload`.
2. Show the `ProcessingModal` with step-by-step progress updates.
3. On success (HTTP 200), fade out the modal and transition to the Active Dashboard state.
4. On error, display the error message with "Proceed with Partial Data" or "Cancel" options.

**Bidirectional Synchronized Selection:**

```
[User Clicks Card in Right Drawer]
      ├──► Waterfall Canvas auto-scrolls to target ping row & draws selection box
      └──► Leaflet Map auto-pans to target Lat/Long & opens popup marker

[User Clicks Marker on Leaflet Map]
      ├──► Right Drawer scrolls target Card into view & applies highlight outline
      └──► Waterfall Canvas auto-scrolls to matching ping row

[User Clicks Detection on Waterfall Canvas]
      ├──► Right Drawer highlights matching card
      └──► Leaflet Map pans to corresponding marker
```

**Operator Confirmation Workflow:**

| Action | Visual Feedback | API Call | Database Effect |
|---|---|---|---|
| Click **"Confirm"** | Card tint → dark green, badge → `CONFIRMED` | `POST /api/detection/{id}/review` | `review_status = 'CONFIRMED'` + audit log |
| Click **"Reject"** | Card opacity → 40%, title strikethrough, badge → `REJECTED`, map marker → translucent | `POST /api/detection/{id}/review` | `review_status = 'REJECTED'` + audit log |

**Live Simulation Mode:**

1. Click "Simulate Live Mission" → Opens WebSocket to `/ws/simulation/{id}`.
2. Waterfall canvas auto-scrolls downward at constant speed.
3. Leaflet map updates AUV trackline in real time.
4. On high-confidence detection: audible chime + toast notification + new card slides into drawer.
5. Floating control dock: Play/Pause, speed selector (1x/2x/5x), Stop.

**Status Footer Connectivity:**

Poll `GET /api/health` every 3 seconds. If unreachable:
- Status pill changes to `[DISCONNECTED]` (red).
- Full-screen overlay: "Local Server Disconnected. Retrying connection to localhost:8000..."
- Auto-reconnect every 3 seconds until server restores.

### Deliverables

- [ ] Fully wired React frontend communicating with all 5 REST + 1 WebSocket endpoints.
- [ ] Bidirectional canvas-map-drawer synchronization linking visual sonar pings to GPS map locations.
- [ ] Operator Confirm/Reject workflow with instant visual feedback and database persistence.
- [ ] Live simulation mode with WebSocket streaming and playback controls.
- [ ] Connection health monitoring with auto-reconnect overlay.

### Acceptance Criteria

- Dragging a `.xtf` file onto the drop zone triggers the full pipeline and renders detections.
- Clicking a detection card auto-pans the map and scrolls the waterfall canvas.
- Clicking a map marker highlights the corresponding card in the drawer.
- Confirming a detection turns the card green and persists `CONFIRMED` to the database.
- Rejecting a detection dims the card and map marker.
- Simulation mode streams pings and shows real-time detection alerts.
- Disconnecting the backend triggers the reconnection overlay within 3 seconds.

---

## Phase 7: Testing & Quality Assurance

> **Owner:** Member 4 (Deployment & QA Engineer) + All Members  
> **Duration:** Days 9–10

### Action Steps

**Unit Testing (`pytest`):**

| Test File | Location | Scope |
|---|---|---|
| `test_parser.py` | `backend/core/dsp/tests/` | Verify `.xtf` parser accurately extracts telemetry headers and waterfall matrix. |
| `test_preprocessor.py` | `backend/core/dsp/tests/` | Verify slant-range correction transforms without array index errors, CLAHE output is normalized. |
| `test_inference.py` | `edge_tests/tests/` | Verify ONNX inference outputs valid bounding box/polygon dimensions. |
| `test_fusion.py` | `edge_tests/tests/` | Verify fusion weights sum correctly and output is clamped to [0.0, 1.0]. |
| `test_security.py` | `edge_tests/tests/` | Verify path traversal filenames are rejected. |
| `test_database.py` | `edge_tests/tests/` | Verify WAL mode, foreign key constraints, and index presence. |
| `test_integration.py` | `edge_tests/tests/` | Full pipeline smoke test: upload → detect → review → export. |

**Air-Gap Network Audit (`edge_tests/tests/test_offline_audit.py`):**

Run during full system execution to verify **0 external network requests**:

```bash
# Method 1: Network monitoring (Linux)
tcpdump -i any 'not host 127.0.0.1' -c 1 -W 1 -G 60

# Method 2: Python socket patching
# Monkey-patch socket.connect to reject non-localhost connections

# Method 3: Wireshark capture during end-to-end demo
```

**Fault Tolerance Verification:**

| Test | Scenario | Expected Result |
|---|---|---|
| Corrupted `.xtf` | Feed a file with invalid ping headers at byte offset 4096 | Pipeline continues with partial data; error logged. |
| Missing Telemetry | Sonar file with no INS records in pings 400–600 | Fallback to spatial interpolation; warning toast. |
| Power-Cut Simulation | Kill the server mid-database-write (`SIGKILL`) | SQLite WAL prevents corruption; `PRAGMA integrity_check` returns `ok`. |
| Missing Tiles | Delete tile cache directory | Map shows "Offline map tiles not cached" gray overlay; app continues. |
| No Detections | Feed a clean seabed sonar log | Right Drawer shows empty state; Export generates "Clear Survey Audit Report". |

**Inference Benchmarking (`edge_tests/benchmarks/benchmark_inference.py`):**

| Metric | x86 CPU Target | Jetson Orin Nano Target |
|---|---|---|
| Inference FPS | ≥ 15 FPS | ≥ 25 FPS (TensorRT) |
| DSP Throughput | ≥ 50 pings/sec | ≥ 30 pings/sec |
| Memory Usage | ≤ 2 GB RAM | ≤ 4 GB RAM |
| Cold Start Time | ≤ 5 seconds | ≤ 8 seconds |

### Deliverables

- [ ] `pytest` test suite covering parser, preprocessor, inference, fusion, security, and database.
- [ ] Full-pipeline integration test (upload → detect → review → export).
- [ ] Air-gap network audit confirming 0 external network calls.
- [ ] Fault tolerance report for corrupted files, missing telemetry, and power cuts.
- [ ] Inference FPS benchmark report meeting ≥ 15 FPS target.

### Acceptance Criteria

- `pytest` passes with ≥ 80% code coverage on backend modules.
- Network audit logs 0 packets to external IPs during full demo run.
- `PRAGMA integrity_check` returns `ok` after simulated power cut.
- Inference benchmark meets 15 FPS on CPU with the INT8 ONNX model.

---

## Phase 8: Offline Deployment & Final Polish

> **Owner:** Member 4 (Deployment & QA) + Member 5 (Support)  
> **Duration:** Days 10–12

### Action Steps

**Docker Containerization (`marine_vision/edge_tests/Dockerfile`):**

Package the entire application into a single Docker container:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install OpenCV system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY frontend/dist/ ./frontend/dist/
COPY models/ ./models/
COPY sample_data/ ./sample_data/

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "backend.api.main:app", \
     "--host", "127.0.0.1", "--port", "8000", "--workers", "1"]
```

**React Production Build:**

```bash
cd marine_vision/frontend
npm run build    # Outputs to frontend/dist/
```

**Desktop Launcher Scripts:**

Linux/Mac (`marine_vision/edge_tests/scripts/run_offline.sh`):

```bash
#!/bin/bash
echo "============================================"
echo "  NIOT Marine Vision System (Offline Mode)"
echo "  SIH 26057 — Marine Debris Detection"
echo "============================================"

cd "$(dirname "$0")/../.."
source venv/bin/activate 2>/dev/null || { python3 -m venv venv && source venv/bin/activate; }
pip install -r backend/requirements.txt --quiet

echo ""
echo "Starting server at http://127.0.0.1:8000 ..."
echo "Press Ctrl+C to stop."
echo ""
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --workers 1
```

Windows (`marine_vision/edge_tests/scripts/run_offline.bat`):

```batch
@echo off
echo ============================================
echo   NIOT Marine Vision System (Offline Mode)
echo   SIH 26057 — Marine Debris Detection
echo ============================================

cd /d "%~dp0\..\.."
if not exist venv (python -m venv venv)
call venv\Scripts\activate.bat
pip install -r backend\requirements.txt --quiet

echo.
echo Starting server at http://127.0.0.1:8000 ...
echo Press Ctrl+C to stop.
echo.
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --workers 1
```

**Final UI Polish:**

- [ ] Verify WCAG contrast ratios on all text against `#030F1C` background.
- [ ] Test button hover glow animations and card highlight transitions.
- [ ] Confirm toast notification slide-in timing (300ms fade).
- [ ] Validate responsive behavior at standard display resolutions (1920×1080, 1366×768).
- [ ] Test dark theme consistency across all modal overlays.

**Demo & Submission (Member 5):**

- [ ] Record end-to-end demo video showing: upload → processing → detection → review → export.
- [ ] Prepare SIH presentation deck: Problem → Approach → Architecture → Live Demo → Impact.
- [ ] Write README.md with installation and usage instructions.

### Deliverables

- [ ] `Dockerfile` + `docker-compose.yml` for containerized offline deployment.
- [ ] Production-ready launcher scripts for Linux, Mac, and Windows.
- [ ] React production build bundled and served by FastAPI.
- [ ] Polished UI passing visual QA checklist.
- [ ] Demo video and SIH presentation deck.
- [ ] `README.md` with installation, usage, and architecture documentation.

### Acceptance Criteria

- `docker build` and `docker run` starts the application successfully.
- `run_offline.sh` (Linux) and `run_offline.bat` (Windows) launch the server at `http://127.0.0.1:8000`.
- Opening `http://127.0.0.1:8000` in a browser renders the full dashboard.
- The complete upload → detect → review → export workflow completes without errors.
- 0 external network requests logged during the entire demo (verified by network audit).
- Final video demonstrates the full pipeline end-to-end.

---

## Implementation Timeline Summary

```
Day 1        ┃ Phase 1: Environment & Repository Setup (Lead + All)
Days 2–4     ┃ Phase 2: Database & Security (Member 2)     ┃ Phase 3: UI Shell (Member 3)
             ┃                                              ┃ (PARALLEL)
Days 3–5     ┃ Phase 4: DSP + AI Pipeline (Member 1 + Lead)
Days 5–7     ┃ Phase 5: API Endpoints & Reports (Member 2)
Days 7–9     ┃ Phase 6: Frontend ↔ Backend Wiring (Member 3 + Member 2)
Days 9–10    ┃ Phase 7: Testing & QA (Member 4 + All)
Days 10–12   ┃ Phase 8: Docker, Polish, Demo (Member 4 + Member 5)
```

| Member | Primary Phases | Days Active |
|---|---|---|
| **Lead (Anand)** | Phase 1, Phase 4 (model training) | Days 1, 3–5 |
| **Member 1 (DSP)** | Phase 4 (parser + preprocessor) | Days 3–5 |
| **Member 2 (Backend)** | Phase 2, Phase 5, Phase 6 | Days 2–9 |
| **Member 3 (Frontend)** | Phase 3, Phase 6 | Days 2–9 |
| **Member 4 (QA/Edge)** | Phase 7, Phase 8 | Days 9–12 |
| **Member 5 (Support)** | Phase 8 (video, presentation) | Days 10–12 |
