# Product Requirements Document (PRD)

> **Project:** AI-Powered Automated Underwater Marine Debris & Anomaly Detection System  
> **Problem Statement ID:** SIH 26057  
> **Organization:** Ministry of Earth Sciences (MoES) — NIOT  
> **Platform:** Local Web Application (FastAPI + Vanilla JS/Leaflet) for Edge/Topside Deployment

---

## 1. Project Overview

This product is an end-to-end, **zero-cloud computer vision pipeline** designed to ingest Side-Scan Sonar (SSS) imagery and detect anthropogenic marine debris such as ghost nets, pipes, cylinders, and shipwrecks. The software operates **entirely offline** on autonomous underwater vehicles (AUVs) or research vessel laptops.

It addresses key physical challenges of sonar data — including **motion dropouts** and **acoustic speckle noise** — by applying a telemetry-aware pre-processing stage and a multi-signal confidence fusion engine. The end product maps detections to real-world coordinates and generates actionable recovery reports for salvage teams.

---

## 2. Problem Statement

Marine conservationists rely on side-scan sonar to locate destructive marine debris, but manual inspection of sonar logs is **slow, tedious, and prone to human error**. Standard optical AI models fail on sonar data due to:

- **Multiplicative speckle noise**
- **Acoustic shadows** with variable geometry
- **Varying pixel resolutions** across the swath (slant-range distortion)
- **Data dropouts** caused by AUV heave, pitch, and roll

Furthermore, existing high-accuracy AI solutions require heavy cloud compute, which is **completely unavailable during offshore marine operations**.

---

## 3. Target Users

| User Persona | Description |
|---|---|
| **Hydrographic Operators / Topside Personnel** | Marine technicians operating on research vessels who need to upload raw sonar logs and rapidly analyze them for anomalies without an internet connection. |
| **AUV Autonomous Mission Engines** | Programmatic edge endpoints on underwater drones that require real-time, low-latency target detection to alter course or flag waypoints. |
| **Salvage & Recovery Divers** | End-users who do not interact with the software directly but consume the final generated dive sheets (PDFs) detailing exact GPS coordinates, depth, and hazard classifications to execute safe recoveries. |

---

## 4. Core Features

1. **Adaptive Pre-Processing Engine:** Ingests `.xtf` and `.jsf` files using `pyxtf`. Automatically applies slant-range correction to normalize pixel geometry and uses AUV attitude telemetry to inpaint missing rows caused by pitch/roll dropouts.

2. **Instance Segmentation Inference:** Utilizes an INT8-quantized YOLO11n-seg model via ONNX Runtime. Outputs exact pixel-level masks for amorphous ghost nets and bounding boxes for rigid targets (pipes, shipwrecks).

3. **Multi-Signal Confidence Fusion:** Evaluates detections using three parameters:
   - The **native network score** (YOLO objectness)
   - **Physical acoustic shadow-geometry matching**
   - **Cross-ping temporal persistence** to aggressively filter out natural rocks

4. **Offline UI Dashboard:** A single-process FastAPI and Leaflet.js dashboard with pre-cached OpenStreetMap tiles that allows operators to visualize detections on a map without any network dependency.

5. **Automated Geotagging & Reporting:** Maps pixel coordinates to INS/DVL pitch-roll-heave corrected real-world latitudes and longitudes, exporting structured JSON, CSV, and formatted PDF reports.

---

## 5. User Stories

1. As a **hydrographic operator**, I want to upload raw `.xtf` or `.jsf` sonar logs into the local dashboard so that the system can automatically extract the ping intensity and telemetry headers.

2. As a **hydrographic operator**, I want the system to automatically repair dropped pings using pitch/roll telemetry so that the AI model does not misinterpret corrupted rows as false anomalies.

3. As a **hydrographic operator**, I want to see precise pixel masks around entangled ghost nets rather than just bounding boxes so that I can understand the exact shape and spread of the hazard.

4. As an **AUV mission planner**, I want the AI to run on INT8-quantized ONNX so that it operates smoothly on edge hardware (like a Jetson Orin Nano) without requiring a heavy GPU.

5. As a **hydrographic operator**, I want to review detections on an interactive map and click "Confirm" or "Reject" to filter the final dataset before export.

6. As a **salvage diver**, I want to receive a one-click PDF report containing target coordinates, dimensions, and visual crops so that I can navigate directly to the debris on the seafloor.

---

## 6. MVP Scope (Version 1 / Hackathon Deliverable)

The Minimum Viable Product for the SIH internal/finale round will focus strictly on proving the core pipeline on a local machine.

| Component | MVP Scope |
|---|---|
| **Ingestion** | Support for `.xtf` files and fallback standard image uploads (`.png` / `.jpg`). |
| **Processing** | Basic Lee/Frost despeckling, CLAHE contrast normalization, and row inpainting. |
| **Inference** | YOLO11n-seg model running via ONNX Runtime on CPU / Local GPU. |
| **UI** | Local FastAPI web server serving a static HTML/JS frontend with Leaflet map integration and pre-cached offline tiles. |
| **Output** | Basic JSON payload and CSV/PDF export with interpolated Lat/Long coordinates. |

---

## 7. Success Metrics

| Metric Category | Target Key Performance Indicator (KPI) |
|---|---|
| **Inference Speed** | > 15 Frames Per Second (FPS) on a standard local CPU using ONNX Runtime. |
| **Accuracy / Precision** | > 40% reduction in false-positive rock classifications compared to a baseline bounding-box model (achieved via shadow matching and persistence tracking). |
| **Offline Reliability** | 0 external network/API requests logged during end-to-end execution of the application. |
| **User Efficiency** | 80% reduction in time spent identifying targets compared to manual log scrubbing. |

---

## 8. Out of Scope (Features to Avoid in V1)

To prevent scope creep and ensure adherence to the problem statement's strict edge-deployment constraints, the following **must not** be built in Version 1:

| Excluded Feature | Rationale |
|---|---|
| **Cloud Syncing or AWS/GCP Integrations** | The system must not rely on external cloud databases, S3 buckets, or remote APIs for inference or storage. |
| **On-Device Model Retraining** | While operator feedback (Confirm/Reject) is logged locally, the system will not automatically retrain the neural network on the edge device to prevent catastrophic forgetting and hardware overload. |
| **Multi-AUV Swarm Networking** | Real-time data sharing across a mesh network of multiple drones is too complex for V1; focus purely on single-device processing. |
| **Optical/RGB Camera Integration** | The model and pre-processing pipeline are strictly tuned for acoustic Side-Scan Sonar physics; processing optical GoPro/camera footage is out of scope. |
