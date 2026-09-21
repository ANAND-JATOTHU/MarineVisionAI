# Project Flow Document (UX Architecture)

> **Project:** AI-Powered Automated Underwater Marine Debris & Anomaly Detection System (SIH 26057)  
> **Target Platform:** Single-Page Local Web Application (`localhost:8000`)  
> **Design Persona:** Dark Oceanic Command Center

### Color System

| Token | Hex | Usage |
|---|---|---|
| Navy | `#030F1C` | Primary background |
| Slate | `#0A2540` | Panel backgrounds, cards |
| Neon Teal | `#00E5FF` | Primary accent, interactive elements |
| Safety Amber | `#FFB000` | Warning states, simulation mode |
| Signal Green | `#00E676` | Success, confirmed states |
| Alert Red | `#FF1744` | Error, rejected states |

---

## 1. Global Shell & Layout Architecture

The application is structured as a **non-scrolling, single-screen desktop command interface** divided into four main persistent containers:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TOP NAVBAR (#navbar)                                                        │
├───────────────┬──────────────────────────────────────┬──────────────────────┤
│               │ CENTER WORKSPACE (#main-workspace)   │                      │
│               │ ┌──────────────────────────────────┐ │                      │
│               │ │ TOP: SONAR WATERFALL CANVAS       │ │                      │
│ LEFT SIDEBAR  │ │          (#waterfall)              │ │  RIGHT DRAWER       │
│ (#sidebar-    │ ├──────────────────────────────────┤ │  (#drawer-right)    │
│   left)       │ │ BOTTOM: OFFLINE LEAFLET MAP       │ │                      │
│               │ │          (#map)                    │ │                      │
│               │ └──────────────────────────────────┘ │                      │
├───────────────┴──────────────────────────────────────┴──────────────────────┤
│ BOTTOM STATUS FOOTER (#footer)                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Screen & State Specifications

### Screen 1: Dashboard (Default Empty State)

#### Visual Layout

| Container | Default State |
|---|---|
| **Top Navbar** | System logo ("NIOT Marine Vision"), Status Pill (`[OFFLINE READY]` in green), "Upload Sonar Log" button (primary teal), "Simulate Live Mission" button (amber border), disabled "Export Report" button (gray). |
| **Left Sidebar** | Dimmed telemetry cards with placeholder values (`Speed: --kn`, `Depth: --m`, `Altitude: --m`). Fusion weight sliders (Wₘ, Wₛ, Wₚ) set to default values (0.50, 0.25, 0.25). |
| **Center – Waterfall Canvas** | Centered drop-zone card with a dotted cyan border, cloud icon, and text: *"Drag and drop raw .xtf / .jsf files or sonar waterfall images here"*. |
| **Center – Leaflet Map** | Rendered map centered at oceanic default coordinates (`13.02° N, 80.24° E`) with a dark tile basemap. No tracklines or markers present. |
| **Right Drawer** | Empty list state with an icon and message: *"No anomalies detected. Ingest a sonar log to run automated inference."* |

#### User Actions & Button Behaviors

See [Global States & Edge Case Matrix](#3-global-states--system-edge-case-matrix) below.

---

### Screen 2: File Ingestion & Processing Modal (Overlay)

#### Visual Layout

A semi-transparent, **frosted-glass modal overlay** (`#processing-modal`) covering the screen center.

**Header:** `"Processing Sonar Log: mission_2026_09_21.xtf"`

**Step-by-Step Progress Bar:**

```
[✓] Parsing raw pings & INS telemetry headers...
[↺] Inpainting AUV pitch/roll motion dropouts & applying CLAHE...  (Animated spinner)
[ ] Running YOLO11n-seg ONNX inference...
[ ] Fusing acoustic shadow & cross-ping persistence scores...
```

**Progress Percentage:** Dynamic text counter (`0%` to `100%`) above a green linear loader bar.

#### States & Transitions

| State | Behavior |
|---|---|
| **Success** | When backend returns HTTP `200` with mission payload, modal fades out over `300ms`, unlocking **Screen 3** (Active Loaded State). |
| **Error** | Loader bar turns solid Alert Red (`#FF1744`). Error message displays: *"Error parsing file: Invalid XTF Ping Header at byte offset 4096. Attempting auto-repair..."* Buttons appear: **"Proceed with Partial Raw Data"** or **"Cancel"**. |

---

### Screen 3: Interactive Analysis Dashboard (Active Loaded State)

#### Visual Layout

| Container | Active State |
|---|---|
| **Top Navbar** | "Export Report" button turns active Neon Green with a glowing indicator. File details badge displayed: `mission_2026_09_21.xtf | 2,450 Pings`. |
| **Left Sidebar** | Telemetry values populate dynamically from ingested INS headers. Slider controls unlock, allowing real-time adjustment of fusion weights (Wₘ, Wₛ, Wₚ). |
| **Center – Sonar Waterfall Canvas** | Renders high-resolution monochromatic sonar waterfall imagery. **Bounding boxes** (bright yellow borders) drawn around rigid targets (pipes, cylinders). **Polygon instance masks** (neon teal glowing overlays) filled with semi-transparent net textures drawn over ghost nets. Selected target highlighted with a **pulsing red border**. |
| **Center – Leaflet Map** | AUV navigation trackline plotted as a blue line path (`#00E5FF`). Geotagged anomaly markers placed at exact calculated Lat/Long points. |
| **Right Drawer** | Scrollable vertical stack of anomaly cards sorted by `final_confidence` (descending). |

#### Map Marker Color Legend

| Marker Color | Detection Class |
|---|---|
| 🟢 Teal | Ghost Net |
| 🟡 Yellow | Pipe / Cylinder |
| 🔴 Red | Shipwreck |

#### Component Behaviors & Interactions

##### A. Detection Card Component (Right Drawer)

Each card contains:

- **Thumbnail crop** of target
- **Class Badge:** `[GHOST NET]` (Teal) or `[RIGID PIPE]` (Yellow)
- **Coordinates:** `13.0241° N, 80.2411° E | Depth: 18.4m`
- **Confidence Breakdown Bar:**
  - Model Score (Cₘ): `88%`
  - Shadow Match (Cₛ): `92%`
  - Persistence (Cₚ): `100%`
  - **Final Score: `92.4%`** (Large bold callout)
- **Action Controls:** Two buttons — ✅ "Confirm" (Green) and ❌ "Reject" (Red)

##### B. Synchronized Selection Flows

```
[User Clicks Card in Right Drawer]
      │
      ├──► Waterfall Canvas auto-scrolls to target ping & draws selection box
      │
      └──► Leaflet Map auto-pans to target Lat/Long & triggers popup marker

[User Clicks Marker on Leaflet Map]
      │
      ├──► Right Drawer scrolls target Card into view & applies highlight outline
      │
      └──► Waterfall Canvas auto-scrolls to matching ping row
```

##### C. Operator Confirmation Workflow

| Action | Visual Feedback | Database Effect |
|---|---|---|
| Click **"Confirm"** | Card background tint shifts to dark green (`rgba(0, 230, 118, 0.15)`), badge changes to `CONFIRMED`. | `status = 'CONFIRMED'` saved to SQLite. |
| Click **"Reject"** | Card background opacity drops to 40%, line-through style applied to title, badge changes to `REJECTED`. Map marker opacity set to translucent. | `status = 'REJECTED'` updated in SQLite. |

---

### Screen 4: Live Mission Simulation Overlay / Mode

#### Visual Layout

- **Top Navbar** displays an animated pulsing red dot next to `"LIVE AUV STREAM SIMULATION"`.
- **Waterfall canvas** automatically auto-scrolls downwards at a constant speed.
- **Leaflet map** updates the AUV trackline in real time, adding new path segments as pings arrive via WebSocket.

**Floating Control Dock (Bottom Center):**

```
┌─────────────────────────────────────────┐
│  [▶ Play / ⏸ Pause]   [1x│2x│5x]   [■ Stop Mission]  │
└─────────────────────────────────────────┘
```

#### Button Behaviors & Edge Handlers

| Action | Behavior |
|---|---|
| Click **"Pause"** | Stops waterfall scrolling and freezes trackline updates; user can manually inspect pings without losing stream position. |
| **Detection Event** (High-confidence anomaly during streaming) | ① An audible alert chime plays (optional toggle). ② A toast notification slides in from top-right: *"High-Confidence Ghost Net Detected at Ping #1420!"* ③ A new card slides into the top of the Right Drawer. |

---

### Screen 5: Mission Export Modal (PDF / CSV Report)

#### Trigger & Visual Layout

Triggered by clicking the active **"Export Report"** button in the Top Navbar.

**Modal Window** (`#export-modal`):

**Filter Options:**

- [x] Include Confirmed Detections Only *(Default)*
- [ ] Include Unreviewed Detections
- [ ] Include Rejected Detections *(For Audit)*

**Format Selection:** Radio buttons:

- [x] PDF Dive Target Sheet
- [ ] CSV Dataset
- [ ] Structured JSON

**Action Buttons:** "Download Report" (Primary Teal) and "Cancel" (Secondary Outline).

#### System Execution & Output

1. Click **"Download Report"** → Triggers `GET` request to `/api/mission/{id}/export/pdf`.
2. Backend compiles **ReportLab PDF** containing cover summary, map snapshot, and formatted table of targets (GPS, depth, dimensions, thumbnail image).
3. File automatically downloads in browser as `NIOT_Dive_Report_Mission_20260921.pdf`.
4. Success toast banner displayed: *"Report downloaded successfully."*

---

## 3. Global States & System Edge Case Matrix

### Button Actions (Default State)

| Element | Trigger / Event | Action / System Response | Next State |
|---|---|---|---|
| "Upload Sonar Log" Button | Click | Opens native OS file picker (accepts `.xtf`, `.jsf`, `.png`, `.jpg`). | Screen 2 (Uploading) |
| Drop Zone Area | Drag Over | Border changes from dotted cyan to glowing neon green; background fills with `rgba(0, 229, 255, 0.1)`. | Active Drag |
| Drop Zone Area | Drop File | Captures file object, initiates upload `POST` request to `/api/mission/upload`. | Screen 2 (Processing) |
| "Simulate Live Mission" | Click | Triggers mock WebSocket feed using pre-bundled test data. | Screen 4 (Live Mode) |
| "Export Report" Button | Click (disabled) | Tooltip on hover: *"Ingest a file and confirm detections to export."* | No Change |

### Error & Edge Case Handling

| Trigger / Condition | Visual State / UI Behavior | Recovery / User Action |
|---|---|---|
| **Missing Offline Map Tiles** | Map display renders dark gray grid pattern with subtle text overlay: *"Offline map tiles for region not cached."* | Core app remains fully functional; waterfall viewer and coordinates remain active. |
| **Corrupted Sonar File** (`.xtf` Header Fault) | Error Toast: *"Motion telemetry missing from pings #400–#600. Applied fallback OpenCV linear interpolation."* | Pipeline continues automatically using spatial-only interpolation. |
| **No Anomalies Detected in Log** | Right Drawer displays empty state vector illustration and message: *"Scan complete. 0 anthropogenic anomalies detected above threshold."* | "Export Report" button generates a "Clear Survey Audit Report" PDF. |
| **Backend Service Failure / Crash** | Top Navbar Status Pill changes to `[DISCONNECTED]` (Solid Red). Full screen overlay appears: *"Local Server Disconnected. Retrying connection to localhost:8000..."* | Auto-reconnects every 3 seconds until server restores. |
