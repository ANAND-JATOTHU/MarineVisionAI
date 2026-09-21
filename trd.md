# Technical Requirements Document (TRD)

> **Project:** AI-Powered Automated Underwater Marine Debris & Anomaly Detection System  
> **Problem Statement ID:** SIH 26057  
> **Architectural Goal:** Deliver a 100% offline, edge-optimized instance segmentation pipeline and dashboard.

---

## 1. System Architecture Overview

The system is designed as a **single-process local web application**. It operates entirely offline, running natively on a research vessel's topside laptop or an Autonomous Underwater Vehicle (AUV) edge compute board (e.g., Jetson Orin Nano).

The architecture follows a **linear, telemetry-aware data pipeline**:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│  1. Ingestion &  │───▶│ 2. DSP Pre-      │───▶│ 3. ONNX     │───▶│ 4. Fusion        │───▶│ 5. Presentation      │
│     Parsing      │    │    Processing     │    │   Inference  │    │    Filtering      │    │    Layer (Dashboard)  │
└─────────────────┘    └──────────────────┘    └─────────────┘    └──────────────────┘    └──────────────────────┘
```

1. **Ingestion & Parsing:** Extracts ping intensities and INS (Inertial Navigation System) attitude records (pitch, roll, heave) from raw `.xtf` or `.jsf` sonar logs.
2. **DSP Pre-Processing:** Normalizes slant-range distortion and inpaint-repairs data dropouts caused by AUV motion.
3. **Inference:** Executes an INT8-quantized ONNX computer vision model to isolate targets.
4. **Fusion Filtering:** Cross-references detections against physical shadow geometry and cross-ping persistence to suppress false positives.
5. **Presentation Layer:** Serves an offline FastAPI + Leaflet dashboard to review and export geospatial dive targets.

---

## 2. Technology Stack & Technical Decisions

### 2.1 Frontend Stack

| Technology | Version / Detail |
|---|---|
| HTML5, CSS3, Vanilla JavaScript | ES6 Modules |
| Leaflet.js | v1.9.4 |

**Technical Decision:** We explicitly avoid heavy Node.js/NPM frameworks (like React/Next.js). Using Vanilla JS and serving a static frontend directly from the backend simplifies the build process, reduces container footprint, and ensures seamless execution by AI coding agents.

**Mapping:** Leaflet.js is used with **pre-cached OpenStreetMap tiles** to guarantee the UI renders locally at sea without internet connectivity.

### 2.2 Backend Stack

| Technology | Version / Detail |
|---|---|
| Python | 3.10+ |
| FastAPI | Latest stable |
| Uvicorn | ASGI Server |

**Technical Decision:** FastAPI is lightweight, highly performant, and natively supports asynchronous file uploads for heavy sonar logs. Being Python-based, it allows the web server to exist in the same memory space as the AI and DSP (Digital Signal Processing) libraries, eliminating latency from inter-service communication.

### 2.3 Computer Vision & AI Inference

| Technology | Purpose |
|---|---|
| Ultralytics YOLO11n-seg | Instance segmentation model |
| ONNX Runtime (`onnxruntime`) | Cross-platform inference engine |
| OpenCV (`cv2`) | Image processing & DSP |
| `pyxtf` | XTF sonar log parser |
| SciPy | Signal processing utilities |

**Technical Decisions:**

- **YOLO11n-seg:** Chosen because standard bounding boxes fail on irregular objects; this model provides exact pixel-level instance masks for entangled ghost nets while retaining bounding boxes for rigid pipes and shipwrecks.
- **ONNX & INT8 Quantization:** PyTorch models are too heavy for CPU-only edge boards. Exporting the model to INT8 ONNX format achieves real-time inference speeds (15+ FPS) without requiring an active cloud GPU.
- **OpenCV:** Used for Lee/Frost despeckling, CLAHE contrast normalization, and row inpainting to repair telemetry-flagged dropouts.

### 2.4 Database

| Technology | Detail |
|---|---|
| SQLite3 | Single-file embedded database |

**Technical Decision:** PostgreSQL or MySQL introduces unnecessary daemon overhead and port management. SQLite operates as a single local file, which is perfect for an isolated edge device logging operator feedback (Confirm/Reject loops) and mission metadata.

### 2.5 Authentication

| Status | Detail |
|---|---|
| **Removed** | Explicitly disabled |

**Reasoning:** The application runs on `localhost` within a secure, air-gapped network aboard a marine vessel. Implementing authentication adds unnecessary friction during high-stress recovery operations.

---

## 3. Database Schema (SQLite)

The database relies on three core relational tables to manage missions offline.

### `missions`

| Column | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | UUID v4 |
| `filename` | TEXT | Original sonar log file name |
| `total_pings` | INTEGER | Total ping count in the log |
| `created_at` | TIMESTAMP | Record creation timestamp |

### `telemetry_pings`

| Column | Type | Description |
|---|---|---|
| `ping_id` | TEXT (PK) | Unique ping identifier |
| `mission_id` | TEXT (FK) | Foreign key → `missions` |
| `latitude` | REAL | WGS84 Decimal Degrees |
| `longitude` | REAL | WGS84 Decimal Degrees |
| `pitch` | REAL | Vehicle pitch angle |
| `roll` | REAL | Vehicle roll angle |
| `heave` | REAL | Vertical heave displacement |
| `altitude` | REAL | Altitude above seafloor |

> Used for coordinate mapping and motion dropout detection.

### `detections`

| Column | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | UUID v4 |
| `mission_id` | TEXT (FK) | Foreign key → `missions` |
| `class_name` | TEXT | E.g., `ghost_net`, `pipe`, `cylinder`, `shipwreck` |
| `mask_json` / `bbox_json` | TEXT | Polygon mask or bounding box coordinates |
| `confidence_model` | REAL | Native YOLO objectness score `[0.0 – 1.0]` |
| `confidence_shadow` | REAL | Acoustic shadow-geometry match `[0.0 – 1.0]` |
| `confidence_persistence` | REAL | Cross-ping IoU tracker score `[0.0 – 1.0]` |
| `final_confidence` | REAL | Weighted fusion of the three signals `[0.0 – 1.0]` |
| `operator_status` | TEXT | `'UNREVIEWED'` \| `'CONFIRMED'` \| `'REJECTED'` |

---

## 4. API Architecture (Endpoints)

The FastAPI backend will expose a clean REST interface alongside a WebSocket for live simulation.

### REST Endpoints

| Method | Route | Payload | Action |
|---|---|---|---|
| `POST` | `/api/mission/upload` | `multipart/form-data` (`.xtf` or image) | Parses logs, triggers the DSP pre-processing pipeline, and initiates ONNX inference. |
| `GET` | `/api/mission/{id}/detections` | — | Returns all identified anomalies, their bounding/mask JSONs, and calculated real-world GPS coordinates. |
| `POST` | `/api/detection/{id}/review` | `{"status": "CONFIRMED" \| "REJECTED"}` | Logs human-in-the-loop corrections to a local database for future on-shore fine-tuning. |
| `GET` | `/api/mission/{id}/export/{format}` | — | Compiles the confirmed targets into a structured JSON, CSV, or formatted PDF dive report. |

### WebSocket Endpoint

| Protocol | Route | Action |
|---|---|---|
| `WS` | `/ws/simulation/{id}` | Streams historical ping arrays sequentially to the frontend to simulate a live AUV mission playback. |

---

## 5. Deployment & Execution Plan

**Packaging:** The entire application (FastAPI + SQLite + Frontend static files + ONNX model) is packaged inside a single Python Virtual Environment (`venv`) or a single Docker container.

**Tile Caching:** OpenStreetMap tiles covering the operational maritime zone are downloaded via a pre-mission script and stored in `/static/tiles/`. Leaflet routes all tile requests to this local folder.

### Target Hardware

| Platform | Runtime |
|---|---|
| **Topside Laptop** | Standard x86 CPU executing via `onnxruntime` |
| **AUV Embedded** | NVIDIA Jetson Orin Nano executing via `onnxruntime-gpu` (TensorRT Execution Provider) for maximum edge performance |

---

## 6. Security & Fault Tolerance Requirements

### Telemetry-Driven Fault Tolerance

If severe ocean waves cause the AUV to pitch/roll violently, the `.xtf` log will contain missing or corrupted sonar rows. Instead of failing or passing bad data to the AI, the system actively monitors **ping-intensity variance** and **INS spikes**, applying **OpenCV row inpainting** to repair the waterfall image dynamically.

### Data Integrity (Power Loss)

AUVs and vessel networks can lose power unexpectedly. The SQLite database must be configured with:

```sql
PRAGMA journal_mode = WAL;
```

Write-Ahead Logging prevents database corruption if the server goes down mid-processing.

### Local Sandboxing

The API must strictly validate file uploads to prevent **path traversal attacks** (e.g., rejecting filenames like `../../../etc/passwd`), ensuring that even as a local tool, it remains secure against arbitrary file execution.
