# 🎯 Team Lead — Operational Handbook

> **Project:** AI-Powered Automated Underwater Marine Debris & Anomaly Detection System  
> **SIH ID:** 26057 | **Organization:** Ministry of Earth Sciences (MoES) — NIOT  
> **Repository:** [MarineVisionAI](https://github.com/ANAND-JATOTHU/MarineVisionAI.git)  
> **Last Updated:** 2026-09-29

---

## 1. Lead Responsibilities — At a Glance

| Domain | Scope |
|---|---|
| **System Architecture** | Own the end-to-end pipeline design. Ensure all 5 modules integrate through `shared_contracts.json`. |
| **Model Training** | Exclusive ownership of `marine_vision/model_training/`. |
| **Repository Governance** | Enforce branch protection, PR reviews, and merge discipline. |
| **Integration Testing** | Run full-pipeline smoke tests after each PR merge into `main`. |
| **Security Enforcement** | Ensure air-gap compliance (zero external network calls). |

---

## 2. Exclusive Ownership — `marine_vision/model_training/`

**You are the sole contributor to this directory.** No other team member should create, modify, or push files here.

### 2.1 Dataset Preparation (YOLO Segmentation Format)

#### Directory Structure

```
model_training/
├── datasets/
│   ├── images/
│   │   ├── train/      # 80% of annotated sonar waterfall images
│   │   └── val/        # 20% validation split
│   └── labels/
│       ├── train/      # Matching YOLO segmentation .txt files
│       └── val/
├── configs/
│   └── marine_debris.yaml   # Ultralytics dataset config
├── scripts/
│   ├── train.py             # Training launcher
│   ├── export_onnx.py       # INT8 ONNX export script
│   └── validate.py          # mAP/recall validation
├── runs/                    # Ultralytics auto-generated training logs
└── README.md
```

#### Annotation Format (YOLO Instance Segmentation)

Each `.txt` label file follows the Ultralytics segmentation format:

```
<class_id> <x1> <y1> <x2> <y2> ... <xN> <yN>
```

**Class Mapping:**

| Class ID | Class Name | Detection Type |
|---|---|---|
| `0` | `ghost_net` | Polygon Mask (instance segmentation) |
| `1` | `pipe` | Bounding Box |
| `2` | `cylinder` | Bounding Box |
| `3` | `shipwreck` | Bounding Box |

#### Dataset YAML (`configs/marine_debris.yaml`)

```yaml
path: ../datasets
train: images/train
val: images/val

names:
  0: ghost_net
  1: pipe
  2: cylinder
  3: shipwreck
```

### 2.2 Training YOLO11n-seg

#### Prerequisites

```bash
pip install ultralytics>=8.3.0
```

#### Training Command

```python
from ultralytics import YOLO

model = YOLO("yolo11n-seg.pt")  # Nano segmentation pretrained

results = model.train(
    data="configs/marine_debris.yaml",
    epochs=100,
    imgsz=640,
    batch=16,
    device="0",              # GPU index, or "cpu"
    project="runs/train",
    name="marine_debris_v1",
    # Shadow-aware parameters
    mosaic=0.5,              # Reduced mosaic to preserve shadow geometry
    mixup=0.0,               # Disabled — destroys acoustic shadow structure
    hsv_h=0.0,               # No hue augmentation (grayscale sonar)
    hsv_s=0.0,               # No saturation augmentation
    hsv_v=0.15,              # Minor brightness jitter only
    flipud=0.5,              # Vertical flip (valid for sonar swath symmetry)
    fliplr=0.5,              # Horizontal flip
    degrees=5.0,             # Minimal rotation (preserves shadow angles)
    translate=0.1,
    scale=0.3,
    perspective=0.0,         # Disabled — distorts shadow geometry
    close_mosaic=10,
)
```

> **⚠️ Critical Shadow-Aware Parameters:**
> - `mixup=0.0` — MixUp blends two images, destroying the physical relationship between objects and their acoustic shadows.
> - `perspective=0.0` — Perspective warp invalidates the shadow-geometry matching in the fusion engine.
> - `hsv_h=0.0, hsv_s=0.0` — Sonar is grayscale; color augmentation introduces noise.

### 2.3 INT8 ONNX Export

After training completes, export the best checkpoint to INT8-quantized ONNX:

```python
from ultralytics import YOLO

model = YOLO("runs/train/marine_debris_v1/weights/best.pt")

model.export(
    format="onnx",
    imgsz=640,
    simplify=True,
    opset=17,
    half=False,        # INT8 via ONNX Runtime quantization (see below)
    dynamic=False,     # Fixed batch size for edge deployment
)
```

#### Post-Export INT8 Quantization (for Edge/Jetson)

```python
from onnxruntime.quantization import quantize_dynamic, QuantType

quantize_dynamic(
    model_input="runs/train/marine_debris_v1/weights/best.onnx",
    model_output="marine_vision/models/best.onnx",
    weight_type=QuantType.QInt8,
)
```

**After export, copy `best.onnx` to `marine_vision/models/best.onnx`** — this is the shared artifact consumed by Member 2's ONNX inference runner.

### 2.4 Validation Checkpoints

Before releasing a model to `marine_vision/models/`:

| Metric | Minimum Target |
|---|---|
| mAP@0.5 (ghost_net) | ≥ 0.45 |
| mAP@0.5 (pipe/cylinder) | ≥ 0.55 |
| Inference FPS (CPU ONNX) | ≥ 15 FPS at 640×640 |
| INT8 Model Size | ≤ 12 MB |

---

## 3. Repository Governance & Branch Protection

### 3.1 GitHub Ruleset (Active — ID: 23988093)

The `main` branch has the following **active** ruleset enforced:

| Rule | Status | Effect |
|---|---|---|
| **Branch Deletion** | 🔒 Blocked | Nobody can delete the `main` branch. |
| **Non-Fast-Forward Pushes** | 🔒 Blocked | Force-push (`git push --force`) is prohibited. |
| **Pull Request Required** | ✅ Enforced | All changes to `main` MUST go through a Pull Request. **Direct pushes are blocked.** |

> **What this means for the team:** Nobody — including you — can push directly to `main`. Every change must be committed to a feature branch, pushed to origin, and merged via a GitHub Pull Request.

### 3.2 Branch Strategy

```
main                    ← Protected (PR-only merges)
├── anand               ← Lead's integration/staging branch
├── feature/dsp-*       ← Member 1's DSP branches
├── feature/backend-*   ← Member 2's backend branches
├── feature/frontend-*  ← Member 3's frontend branches
├── feature/edge-*      ← Member 4's deployment branches
└── feature/support-*   ← Member 5's ad-hoc branches
```

### 3.3 PR Review Checklist

Before merging any Pull Request, verify:

- [ ] **Scope Isolation:** Changes are confined to the member's assigned directory only.
- [ ] **No Binary Commits:** `.onnx`, `.xtf`, `.db`, `.pt` files are NOT committed (use `.gitignore`).
- [ ] **Contract Compliance:** API payloads match `shared_contracts.json` schemas exactly.
- [ ] **Offline Compliance:** No `import requests`, no `fetch("https://...")`, no CDN links.
- [ ] **Security:** No `0.0.0.0` binding. Host is `127.0.0.1` only. File upload validates against path traversal.
- [ ] **Code Quality:** No hardcoded paths, no debug `print()` statements, docstrings present.
- [ ] **Tests Pass:** `pytest` (backend) / manual smoke test (frontend) passes locally.

### 3.4 Lead's Merge Workflow

```bash
# 1. Fetch latest PR branch
git fetch origin
git checkout feature/member-name-task

# 2. Review code locally
# (Run tests, verify directory isolation, check contracts)

# 3. If approved — merge via GitHub PR interface (NOT via CLI)
# Navigate to: https://github.com/ANAND-JATOTHU/MarineVisionAI/pulls
# Click "Merge Pull Request" → "Create a merge commit"

# 4. After merge, update local main
git checkout main
git pull origin main
```

---

## 4. Security Enforcement — Air-Gap Compliance

### 4.1 Mandatory Security Audit (Pre-Demo)

| Check | Command/Method | Expected Result |
|---|---|---|
| **Zero Network Calls** | Run Wireshark/`tcpdump` during full pipeline execution | 0 packets to external IPs |
| **Localhost Binding** | Check Uvicorn startup log | `Uvicorn running on http://127.0.0.1:8000` |
| **No CDN References** | `grep -rn "cdn\|googleapis\|unpkg\|cloudflare" frontend/` | 0 matches |
| **Path Traversal Block** | Upload file named `../../etc/passwd` | HTTP 400 rejection |
| **DB File Permissions** | `ls -la marine_vision.db` | `-rw-------` (0600) |
| **Tile Locality** | Check Leaflet tile URL in code | `/static/tiles/{z}/{x}/{y}.png` (local path) |

### 4.2 Security Configuration Checklist

```python
# main.py — Uvicorn startup (MANDATORY)
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",      # NEVER use "0.0.0.0"
        port=8000,
        workers=1,              # Single-process for SQLite safety
        log_level="info",
    )
```

### 4.3 File Upload Validation (Path Traversal Defense)

```python
import os
import re

ALLOWED_EXTENSIONS = {".xtf", ".jsf", ".png", ".jpg"}
UPLOAD_DIR = os.path.abspath("sample_data/")

def validate_upload(filename: str) -> str:
    """Sanitize uploaded filename to prevent path traversal."""
    # Strip directory components
    basename = os.path.basename(filename)
    # Reject suspicious patterns
    if re.search(r"\.\.|[\\/]|%2[fF]|%5[cC]", filename):
        raise ValueError(f"Rejected malicious filename: {filename}")
    # Validate extension
    _, ext = os.path.splitext(basename)
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}")
    # Construct safe absolute path and verify containment
    safe_path = os.path.abspath(os.path.join(UPLOAD_DIR, basename))
    if not safe_path.startswith(UPLOAD_DIR):
        raise ValueError("Path traversal detected")
    return safe_path
```

---

## 5. Integration Test Protocol

After merging PRs from multiple members, run the following full-pipeline smoke test:

### 5.1 Startup Validation

```bash
cd marine_vision
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate          # Windows

pip install -r requirements.txt
python -m app.main
# Expected: "Uvicorn running on http://127.0.0.1:8000"
# Expected: "Database initialized with WAL mode"
```

### 5.2 Pipeline Smoke Test

```bash
# 1. Upload test sonar file
curl -X POST http://127.0.0.1:8000/api/mission/upload \
  -F "file=@sample_data/test_mission.xtf"

# 2. Check detections
curl http://127.0.0.1:8000/api/mission/{MISSION_ID}/detections

# 3. Review a detection
curl -X POST http://127.0.0.1:8000/api/detection/{DETECTION_ID}/review \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'

# 4. Export PDF report
curl http://127.0.0.1:8000/api/mission/{MISSION_ID}/export/pdf \
  -o test_report.pdf
```

### 5.3 Cross-Module Integration Matrix

| Source Module | Target Module | Integration Point |
|---|---|---|
| `model_training/` → `models/` | `backend/api/` | `best.onnx` consumed by ONNX inference runner |
| `backend/core/dsp/` | `backend/api/` | DSP returns normalized NumPy matrix to API pipeline |
| `backend/db/` | `backend/api/` | API routes call DB models for CRUD operations |
| `backend/api/` | `frontend/` | REST/WS endpoints consumed per `shared_contracts.json` |
| `frontend/` | `models/` (via tiles) | Leaflet reads `/static/tiles/` for offline maps |

---

## 6. Timeline & Sprint Milestones

| Sprint | Duration | Deliverable | Owner |
|---|---|---|---|
| **Sprint 0** | Day 1 | Workspace setup, `.gitignore`, branch creation | Lead |
| **Sprint 1** | Days 2–4 | DSP parser + DB schema + React scaffold | M1, M2, M3 |
| **Sprint 2** | Days 5–7 | ONNX inference + API routes + Map integration | Lead, M2, M3 |
| **Sprint 3** | Days 8–9 | Fusion engine + Full pipeline integration | Lead, M2 |
| **Sprint 4** | Day 10 | Dockerization + Offline audit + Edge benchmarks | M4 |
| **Sprint 5** | Days 11–12 | Polish, PDF reports, video, presentation | All |

---

## 7. Emergency Procedures

### Database Corruption Recovery

```bash
# If WAL file exists but DB is corrupted:
sqlite3 marine_vision.db "PRAGMA wal_checkpoint(TRUNCATE);"
sqlite3 marine_vision.db "PRAGMA integrity_check;"
# If integrity check fails, restore from last git commit backup
```

### Model Rollback

```bash
# If latest best.onnx causes inference failures:
git log --oneline -- marine_vision/models/best.onnx
git checkout <previous_commit_hash> -- marine_vision/models/best.onnx
```

---

> **Remember:** You are the final gatekeeper. No code reaches `main` without your review. No model reaches `models/` without validation. No demo runs without an air-gap audit.
