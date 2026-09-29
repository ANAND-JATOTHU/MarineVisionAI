# 🧑‍🤝‍🧑 Team Member Assignments

> **Project:** AI-Powered Automated Underwater Marine Debris & Anomaly Detection System (SIH 26057)  
> **Repository:** [MarineVisionAI](https://github.com/ANAND-JATOTHU/MarineVisionAI.git)  
> **Architecture:** 100% Offline, Air-Gapped Edge Deployment  
> **Last Updated:** 2026-09-29

---

## Assignment Map — Quick Reference

| Member | Role | Owned Directory | Branch Prefix |
|---|---|---|---|
| **Lead** | System Architect + AI Engineer | `marine_vision/model_training/` | `feature/model-*` |
| **Member 1** | DSP Engineer | `marine_vision/backend/core/dsp/` | `feature/dsp-*` |
| **Member 2** | Backend & Database Engineer | `marine_vision/backend/db/` + `marine_vision/backend/api/` | `feature/backend-*` |
| **Member 3** | Frontend React Engineer | `marine_vision/frontend/` | `feature/frontend-*` |
| **Member 4** | Deployment & QA Engineer | `marine_vision/edge_tests/` | `feature/edge-*` |
| **Member 5** | Reserve / Support | None (floating) | `feature/support-*` |

> ⚠️ **CRITICAL RULE:** Each member must ONLY modify files within their assigned directory. Modifying files outside your ownership is grounds for PR rejection.

---

## 📡 Member 1 — DSP (Digital Signal Processing) Engineer

### Ownership

```
marine_vision/backend/core/dsp/
├── __init__.py
├── parser.py          # pyxtf/JSF sonar log parser
├── preprocessor.py    # CLAHE, despeckling, slant-range, inpainting
├── utils.py           # Shared DSP utilities
└── tests/
    ├── test_parser.py
    └── test_preprocessor.py
```

### Responsibilities

#### 1. Sonar Log Parser (`parser.py`)

Parse raw `.xtf` and `.jsf` sonar log files using the `pyxtf` library.

**Input:** Raw binary `.xtf` or `.jsf` file path  
**Output:** Two Python objects:

```python
@dataclass
class ParsedSonarData:
    """Complete parsed sonar log output."""
    waterfall_matrix: np.ndarray    # Shape: (num_pings, num_samples), dtype: float32
    telemetry: list[PingTelemetry]  # One entry per ping row
    metadata: MissionMetadata       # File-level metadata

@dataclass
class PingTelemetry:
    """Per-ping navigation and attitude data."""
    ping_number: int
    timestamp_utc: datetime
    latitude: float          # WGS84 decimal degrees
    longitude: float         # WGS84 decimal degrees
    speed_knots: float
    heading_deg: float
    pitch_deg: float
    roll_deg: float
    heave_m: float
    altitude_m: float
    has_motion_dropout: bool  # True if attitude spike detected

@dataclass
class MissionMetadata:
    """File-level metadata extracted from sonar log headers."""
    filename: str
    file_type: str           # 'xtf' or 'jsf'
    file_size_bytes: int
    total_pings: int
    swath_width_meters: float
    start_time: datetime
    end_time: datetime
```

**Key Implementation Details:**

- Use `pyxtf.read_XTF(filepath)` to extract `XTFHeaderNav` (navigation) and channel data.
- Extract ping intensity arrays from the sonar channel data (typically channels 0 and 1 for port/starboard).
- Stack all ping rows vertically into a single 2D NumPy array (the "waterfall matrix").
- Parse INS attitude records (pitch, roll, heave) from the navigation headers.
- Flag pings with `has_motion_dropout = True` when attitude change exceeds threshold:
  ```python
  PITCH_SPIKE_THRESHOLD = 5.0   # degrees between consecutive pings
  ROLL_SPIKE_THRESHOLD = 8.0    # degrees between consecutive pings
  ```

#### 2. Adaptive Signal Preprocessor (`preprocessor.py`)

Transform the raw waterfall matrix into a clean, normalized image ready for AI inference.

**Input:** `ParsedSonarData` object from the parser  
**Output:** Preprocessed `np.ndarray` (shape: H×W, dtype: float32, values 0.0–1.0)

**Processing Pipeline (execute in order):**

```
Raw Waterfall → Lee/Frost Despeckling → Slant-Range Correction → Motion Dropout Inpainting → CLAHE Normalization → Output
```

| Step | Library | Function | Parameters |
|---|---|---|---|
| **1. Lee/Frost Despeckling** | OpenCV / SciPy | Custom Lee filter (5×5 kernel) | `window_size=5`, `damping_factor=1.0` |
| **2. Slant-Range Correction** | NumPy | Resample each ping row to uniform ground-range resolution | Based on altitude and swath geometry |
| **3. Motion Dropout Inpainting** | OpenCV | `cv2.inpaint()` on rows flagged with `has_motion_dropout=True` | `inpaintRadius=3`, `flags=cv2.INPAINT_TELEA` |
| **4. CLAHE Normalization** | OpenCV | `cv2.createCLAHE()` | `clipLimit=3.0`, `tileGridSize=(8, 8)` |

**Slant-Range Correction Formula:**

```python
def slant_range_to_ground_range(slant_range_pixels: np.ndarray, altitude_m: float, swath_width_m: float) -> np.ndarray:
    """
    Convert slant-range sonar pixels to uniform ground-range resolution.
    
    The raw sonar image has non-uniform pixel spacing because pixels near
    the nadir (directly below) are compressed while pixels at the swath
    edges are stretched. This function resamples to uniform ground spacing.
    """
    num_samples = slant_range_pixels.shape[0]
    slant_ranges = np.linspace(0, swath_width_m / 2, num_samples)
    ground_ranges = np.sqrt(np.maximum(slant_ranges**2 - altitude_m**2, 0))
    uniform_ground = np.linspace(ground_ranges[0], ground_ranges[-1], num_samples)
    corrected = np.interp(uniform_ground, ground_ranges, slant_range_pixels)
    return corrected
```

### Deliverables

- [ ] `parser.py` — Parses `.xtf` files and outputs `ParsedSonarData` with waterfall matrix + telemetry.
- [ ] `preprocessor.py` — Full DSP pipeline producing normalized float32 image.
- [ ] Unit tests in `tests/` verifying parser accuracy and preprocessor array shapes.

### ⛔ Forbidden Actions

- Do NOT modify any files outside `marine_vision/backend/core/dsp/`.
- Do NOT import `fastapi`, `uvicorn`, `onnxruntime`, or `reportlab`.
- Do NOT write database queries or REST endpoints.
- Do NOT make any network/internet calls.

---

## 🗄️ Member 2 — Backend & Database Engineer

### Ownership

```
marine_vision/backend/
├── db/
│   ├── __init__.py
│   ├── database.py      # SQLite connection, WAL config, schema init
│   ├── models.py         # Python dataclasses/Pydantic models for DB rows
│   └── migrations/       # Schema migration scripts (if needed)
├── api/
│   ├── __init__.py
│   ├── main.py           # FastAPI app entry point
│   ├── routes.py         # REST endpoint handlers
│   ├── websocket.py      # WebSocket simulation handler
│   ├── inference.py      # ONNX Runtime inference runner
│   ├── fusion.py         # Multi-signal confidence fusion engine
│   ├── geotag.py         # INS-corrected geotagging
│   ├── reports.py        # ReportLab PDF + Pandas CSV generators
│   └── security.py       # File upload validation, path traversal defense
└── requirements.txt      # Python dependencies
```

### Responsibilities

#### 1. Database Layer (`db/`)

**SQLite Initialization (`database.py`):**

Apply these PRAGMAs at connection time:

```python
import sqlite3

def get_connection(db_path: str = "marine_vision.db") -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("PRAGMA temp_store = MEMORY;")
    conn.execute("PRAGMA cache_size = -64000;")
    return conn
```

**Schema:** Implement the 5-table DDL as specified in [backend.md](backend.md):
- `missions` — Survey metadata
- `telemetry_pings` — Time-series navigation records
- `detections` — AI inference results with multi-signal confidence
- `operator_audit_logs` — Human review trail
- `system_config` — Pipeline configuration key-value store

**Indexes:** Create all 4 indexes specified for sub-50ms query performance.

**Seed Data:** Insert default fusion weights and pipeline config into `system_config`.

#### 2. API Layer (`api/`)

**FastAPI Application (`main.py`):**

```python
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="NIOT Marine Vision API",
    version="1.0.0",
    docs_url=None,         # Disable Swagger UI in production
    redoc_url=None,        # Disable ReDoc in production
)

# Serve frontend static files
app.mount("/static", StaticFiles(directory="../frontend/dist"), name="static")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",   # ⚠️ NEVER use "0.0.0.0"
        port=8000,
        workers=1,           # Single worker for SQLite thread safety
        log_level="info",
    )
```

**REST Endpoints (`routes.py`):**

| Method | Route | Input | Output | Behavior |
|---|---|---|---|---|
| `POST` | `/api/mission/upload` | `multipart/form-data` (`.xtf`, `.jsf`, `.png`, `.jpg`) | `MissionUploadResponse` | Validate file → Parse (call M1's DSP) → Infer (ONNX) → Fuse → Geotag → Save to DB |
| `GET` | `/api/mission/{id}/detections` | Path param `id` | `list[DetectionObject]` | Query detections table, return with coordinates |
| `POST` | `/api/detection/{id}/review` | `ReviewStatusUpdate` JSON body | `{ "success": true }` | Update detection status, log to `operator_audit_logs` |
| `GET` | `/api/mission/{id}/export/{format}` | Path params `id`, `format` (`pdf`/`csv`/`json`) | File download | Generate and stream report file |

**WebSocket Endpoint (`websocket.py`):**

| Protocol | Route | Behavior |
|---|---|---|
| `WS` | `/ws/simulation/{id}` | Stream historical pings sequentially to simulate live AUV mission playback |

**ONNX Inference Runner (`inference.py`):**

```python
import onnxruntime as ort
import numpy as np

class ONNXDetector:
    def __init__(self, model_path: str = "../models/best.onnx"):
        self.session = ort.InferenceSession(
            model_path,
            providers=["CPUExecutionProvider"],  # Or "CUDAExecutionProvider" on Jetson
        )
        self.input_name = self.session.get_inputs()[0].name
    
    def predict(self, image: np.ndarray) -> list[dict]:
        """Run inference on preprocessed sonar image tile."""
        # Preprocess: resize to 640x640, normalize, add batch dim
        # Run inference
        # Post-process: extract boxes, masks, confidences
        # Return list of detection dicts
        pass
```

**Multi-Signal Fusion Engine (`fusion.py`):**

Combine three independent confidence signals:

```python
def compute_final_confidence(
    yolo_conf: float,
    shadow_conf: float,
    persistence_conf: float,
    w_yolo: float = 0.50,
    w_shadow: float = 0.25,
    w_persistence: float = 0.25,
) -> float:
    """
    Weighted fusion of model score, shadow geometry match,
    and cross-ping persistence tracker.
    """
    final = (w_yolo * yolo_conf) + (w_shadow * shadow_conf) + (w_persistence * persistence_conf)
    return round(min(max(final, 0.0), 1.0), 4)
```

**Report Generators (`reports.py`):**
- **PDF:** Use `reportlab` to create formatted dive target sheets with GPS coordinates, detection thumbnails, and mission summary.
- **CSV:** Use `pandas` to export tabular detection data.

**Security Layer (`security.py`):**
- Validate all uploaded filenames against path traversal attacks.
- Reject files with `..`, `/`, `\`, or URL-encoded path separators.
- Enforce allowed extensions: `.xtf`, `.jsf`, `.png`, `.jpg`.

#### 3. API Data Schemas

All request/response payloads **MUST** conform to `shared_contracts.json`. See the contract file for exact field names and types.

### Deliverables

- [ ] `database.py` — WAL-configured SQLite connector with full DDL schema.
- [ ] `routes.py` — All 4 REST endpoints matching the contract schemas.
- [ ] `websocket.py` — Live simulation WebSocket handler.
- [ ] `inference.py` — ONNX Runtime inference wrapper consuming `best.onnx`.
- [ ] `fusion.py` — Multi-signal confidence fusion calculator.
- [ ] `reports.py` — PDF and CSV export generators.
- [ ] `security.py` — File upload sanitizer with path traversal defense.

### ⛔ Forbidden Actions

- Do NOT modify `marine_vision/backend/core/dsp/` (that's Member 1).
- Do NOT modify `marine_vision/frontend/` (that's Member 3).
- Do NOT modify `marine_vision/model_training/` (that's Lead).
- Do NOT bind to `0.0.0.0` — always use `127.0.0.1`.
- Do NOT disable SQLite WAL mode.
- Do NOT add any external API calls or cloud dependencies.

---

## 🎨 Member 3 — Frontend React Engineer

### Ownership

```
marine_vision/frontend/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css          # Global styles (Dark Oceanic Command Center theme)
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── WaterfallCanvas.jsx
│   │   ├── LeafletMap.jsx
│   │   ├── DetectionDrawer.jsx
│   │   ├── DetectionCard.jsx
│   │   ├── ProcessingModal.jsx
│   │   ├── ExportModal.jsx
│   │   ├── SimulationControls.jsx
│   │   └── StatusFooter.jsx
│   ├── hooks/
│   │   ├── useWebSocket.js
│   │   └── useMission.js
│   ├── utils/
│   │   └── api.js          # HTTP client (localhost:8000 ONLY)
│   └── static/
│       └── tiles/           # Pre-cached OpenStreetMap tiles (offline)
└── public/
    └── favicon.ico
```

### Responsibilities

#### 1. Project Setup (Vite + React)

```bash
cd marine_vision/frontend
npm create vite@latest . -- --template react
npm install
npm install leaflet react-leaflet
```

#### 2. Design System — Dark Oceanic Command Center

**Color Tokens (use in `index.css`):**

```css
:root {
    --color-navy:        #030F1C;
    --color-slate:       #0A2540;
    --color-neon-teal:   #00E5FF;
    --color-amber:       #FFB000;
    --color-green:       #00E676;
    --color-red:         #FF1744;
    --color-text:        #E0E8F0;
    --color-text-dim:    #6B8299;
}
```

**Layout:** Non-scrolling, single-screen 3-column CSS Grid (refer to [ux.md](ux.md) for exact wireframe).

#### 3. Core Components

| Component | Functionality |
|---|---|
| `Navbar.jsx` | System title, `[OFFLINE READY]` status pill, Upload button, Simulate button, Export button |
| `Sidebar.jsx` | Telemetry readouts (speed, depth, altitude), fusion weight sliders (Wₘ, Wₛ, Wₚ) |
| `WaterfallCanvas.jsx` | HTML5 Canvas rendering sonar waterfall imagery with overlay boxes/masks |
| `LeafletMap.jsx` | Offline Leaflet map using local tiles at `/static/tiles/{z}/{x}/{y}.png` |
| `DetectionDrawer.jsx` | Scrollable right panel with `DetectionCard` components |
| `DetectionCard.jsx` | Detection thumbnail, class badge, confidence breakdown, Confirm/Reject buttons |
| `ProcessingModal.jsx` | Frosted-glass overlay with step-by-step progress bar |
| `ExportModal.jsx` | Filter options + format selection for PDF/CSV/JSON export |
| `SimulationControls.jsx` | Floating dock with Play/Pause, speed controls (1x/2x/5x), Stop |

#### 4. API Integration

**All HTTP calls go to `http://127.0.0.1:8000` ONLY.** No external URLs.

```javascript
// utils/api.js
const BASE_URL = "http://127.0.0.1:8000";

export async function uploadMission(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/api/mission/upload`, {
        method: "POST",
        body: formData,
    });
    return res.json();  // Returns MissionUploadResponse
}

export async function getDetections(missionId) {
    const res = await fetch(`${BASE_URL}/api/mission/${missionId}/detections`);
    return res.json();  // Returns DetectionObject[]
}

export async function reviewDetection(detectionId, status) {
    const res = await fetch(`${BASE_URL}/api/detection/${detectionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    return res.json();
}
```

#### 5. Synchronized Selection Flows

Implement bidirectional linking between three views:

```
[Click Card] → Waterfall scrolls to ping + Map pans to GPS coordinate
[Click Map Marker] → Drawer scrolls to card + Waterfall scrolls to ping
[Click Waterfall Row] → Drawer highlights card + Map pans to marker
```

#### 6. Offline Map Setup (Leaflet)

```javascript
// LeafletMap.jsx
import { MapContainer, TileLayer } from "react-leaflet";

<MapContainer center={[13.02, 80.24]} zoom={10} style={{ height: "100%" }}>
    <TileLayer
        url="/static/tiles/{z}/{x}/{y}.png"  // LOCAL tiles — no internet
        attribution="© OpenStreetMap (cached)"
        maxZoom={18}
    />
</MapContainer>
```

> **⚠️ CRITICAL:** The `url` prop must point to a **local path**, not `https://tile.openstreetmap.org`. Pre-cache tiles before deployment using a tile downloader script.

### Deliverables

- [ ] Vite + React project scaffolded with all component files.
- [ ] Dark Oceanic Command Center theme implemented globally.
- [ ] Working Leaflet map rendering pre-cached offline tiles.
- [ ] Sonar waterfall canvas with detection overlay rendering.
- [ ] Detection card list with Confirm/Reject interaction.
- [ ] Bidirectional selection sync (Card ↔ Map ↔ Canvas).
- [ ] Processing modal with step-by-step progress.
- [ ] Export modal with filter and format options.

### ⛔ Forbidden Actions

- Do NOT modify any files outside `marine_vision/frontend/`.
- Do NOT add any CDN links (`<script src="https://...">`).
- Do NOT call any URL other than `http://127.0.0.1:8000`.
- Do NOT install heavy UI frameworks (Material UI, Ant Design) — use custom CSS.
- Do NOT add authentication/login screens.

---

## 🐳 Member 4 — Deployment & QA Engineer

### Ownership

```
marine_vision/edge_tests/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── benchmarks/
│   ├── benchmark_inference.py    # ONNX FPS benchmarking script
│   ├── benchmark_dsp.py          # DSP pipeline throughput test
│   └── results/                  # Benchmark output logs
├── tests/
│   ├── test_offline_audit.py     # Network isolation verification
│   ├── test_integration.py       # Full pipeline smoke test
│   └── test_fault_tolerance.py   # Power-loss / corrupted file tests
├── scripts/
│   ├── run_offline.sh            # Linux/Mac launcher script
│   ├── run_offline.bat           # Windows launcher script
│   └── download_tiles.py         # Pre-mission tile caching script
└── README.md
```

### Responsibilities

#### 1. Docker Configuration

**`Dockerfile`:**

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV
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

**`.dockerignore`:**

```
node_modules/
venv/
.venv/
__pycache__/
*.pyc
.git/
model_training/
edge_tests/
*.xtf
*.jsf
```

#### 2. Offline Audit Testing (`test_offline_audit.py`)

Verify **zero external network calls** during full pipeline execution:

```python
import subprocess
import pytest

def test_no_external_network_calls():
    """
    Run the full application and verify no packets leave localhost.
    Uses netstat/ss to monitor active connections.
    """
    # Start the app
    # Upload a test file
    # Check that all connections are to 127.0.0.1 only
    # Fail if any external IP detected
    pass
```

#### 3. Inference Benchmarking (`benchmark_inference.py`)

```python
import time
import numpy as np
import onnxruntime as ort

def benchmark_onnx(model_path: str, num_iterations: int = 100):
    session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    dummy_input = np.random.randn(1, 3, 640, 640).astype(np.float32)

    # Warm up
    for _ in range(5):
        session.run(None, {input_name: dummy_input})

    # Benchmark
    start = time.perf_counter()
    for _ in range(num_iterations):
        session.run(None, {input_name: dummy_input})
    elapsed = time.perf_counter() - start

    fps = num_iterations / elapsed
    print(f"Model: {model_path}")
    print(f"Average FPS: {fps:.2f}")
    print(f"Average Latency: {(elapsed / num_iterations) * 1000:.2f} ms")

    assert fps >= 15.0, f"FPS {fps:.2f} is below the 15 FPS minimum target"
```

**Target Benchmarks:**

| Metric | x86 CPU Target | Jetson Orin Nano Target |
|---|---|---|
| Inference FPS | ≥ 15 FPS | ≥ 25 FPS (TensorRT) |
| DSP Throughput | ≥ 50 pings/sec | ≥ 30 pings/sec |
| Memory Usage | ≤ 2 GB RAM | ≤ 4 GB RAM |
| Cold Start Time | ≤ 5 seconds | ≤ 8 seconds |

#### 4. Launcher Scripts

**`run_offline.sh` (Linux/Mac):**

```bash
#!/bin/bash
echo "============================================"
echo "  NIOT Marine Vision System (Offline Mode)"
echo "  SIH 26057 — Marine Debris Detection"
echo "============================================"

cd "$(dirname "$0")/.."
source venv/bin/activate 2>/dev/null || python3 -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt --quiet

echo "Starting server at http://127.0.0.1:8000 ..."
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --workers 1
```

**`run_offline.bat` (Windows):**

```batch
@echo off
echo ============================================
echo   NIOT Marine Vision System (Offline Mode)
echo   SIH 26057 — Marine Debris Detection
echo ============================================

cd /d "%~dp0\.."
if not exist venv (python -m venv venv)
call venv\Scripts\activate.bat
pip install -r backend\requirements.txt --quiet

echo Starting server at http://127.0.0.1:8000 ...
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --workers 1
```

### Deliverables

- [ ] `Dockerfile` + `docker-compose.yml` for containerized offline deployment.
- [ ] Inference FPS benchmark passing ≥ 15 FPS on CPU.
- [ ] Offline network audit test confirming 0 external calls.
- [ ] Fault tolerance test simulating corrupted `.xtf` and power cuts.
- [ ] Launcher scripts for Linux, Mac, and Windows.

### ⛔ Forbidden Actions

- Do NOT modify application source code in `backend/` or `frontend/`.
- Do NOT retrain or modify the ONNX model.
- Do NOT add cloud deployment configurations (AWS, GCP, Azure).
- Do NOT expose ports to `0.0.0.0`.

---

## 🎯 Member 5 — Reserve / Floating Support

### Ownership

**No dedicated directory.** Member 5 supports the team across multiple areas.

### Responsibilities

| Area | Tasks |
|---|---|
| **Research** | Investigate pyxtf parsing edge cases, ONNX quantization techniques, and Leaflet offline tile strategies. |
| **Documentation** | Maintain README.md, write API documentation, document deployment procedures. |
| **Video Submission** | Record, edit, and produce the SIH demo video showcasing the system end-to-end. |
| **Presentation** | Design and prepare the final SIH presentation deck (problem, approach, demo, architecture). |
| **Testing Support** | Help Member 4 with manual QA testing — upload files, verify UI interactions, check reports. |
| **Tile Caching** | Download and organize OpenStreetMap tiles for the target maritime operational zone. |
| **Sample Data** | Source, organize, and document sample `.xtf`/`.jsf` sonar logs in `sample_data/`. |

### Branch Convention

Use prefix `feature/support-*` for any branches:

```bash
git checkout -b feature/support-readme-update
git checkout -b feature/support-sample-data
git checkout -b feature/support-tile-cache
```

### ⛔ Forbidden Actions

- Do NOT commit to any member's owned directory without explicit permission.
- Do NOT push directly to `main` — always use Pull Requests.
- Do NOT add internet-dependent resources.

---

## 📋 Universal Rules for ALL Members

### 1. Air-Gap Compliance

```
❌ import requests
❌ fetch("https://...")
❌ <script src="https://cdn.example.com/...">
❌ pip install from PyPI at runtime
✅ All dependencies pre-installed in venv or Docker image
✅ All map tiles pre-cached locally
✅ All models bundled as local .onnx files
```

### 2. Commit Message Format

```
<type>(<scope>): <description>

feat(dsp): add CLAHE contrast normalization to preprocessor
fix(api): correct bbox coordinate order in detection response
docs(readme): add deployment instructions for Jetson Orin
test(edge): add offline network audit test
```

**Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`

### 3. Communication Protocol

- **Daily:** Post a brief status update in the team chat covering: what you completed, what you're working on, blockers.
- **Before Starting:** Pull latest changes from `main` to avoid conflicts.
- **Before Pushing:** Run your local tests. Ensure no files outside your owned directory are modified.
- **Conflict Resolution:** If you encounter a merge conflict, resolve it locally following the instructions in [git.md](git.md). Never force-push.

---

> **Remember:** The directory ownership model is your shield against merge conflicts. Stay in your lane, follow the contracts, and trust your teammates to deliver their modules.
