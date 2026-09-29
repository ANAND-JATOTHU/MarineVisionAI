import os
import uuid
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import UploadFile, File
from pydantic import BaseModel
import uvicorn
import pandas as pd
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import tempfile

from marine_vision.backend.db.database import init_db
from marine_vision.backend.api.inference import inference_engine

app = FastAPI(title="MarineVision AI Backend")

# Development CORS setup for React (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SystemHealth(BaseModel):
    status: str
    database_ok: bool
    model_loaded: bool

@app.on_event("startup")
def startup_event():
    init_db()
    print("Startup complete. MarineVision system is online.")

@app.get("/api/health", response_model=SystemHealth)
def health_check():
    return {
        "status": "online",
        "database_ok": True,
        "model_loaded": inference_engine.is_loaded
    }

# Mock API routes for frontend integration
@app.get("/api/mission/{mission_id}/detections")
def get_detections(mission_id: str):
    return []

@app.get("/api/export-report")
def export_report():
    # Mock data for demonstration, normally would query from DB
    data = [
        {"class": "plastic_bottle", "lat": 13.0242, "lon": 80.2413, "conf": 0.89, "material": "Medium (Plastic)"},
        {"class": "metal_debris", "lat": 13.0248, "lon": 80.2415, "conf": 0.95, "material": "Hard (Metal)"},
        {"class": "ghost_net", "lat": 13.0240, "lon": 80.2410, "conf": 0.75, "material": "Soft (Net)"}
    ]
    df = pd.DataFrame(data)
    
    # Generate PDF
    temp_pdf_path = os.path.join(tempfile.gettempdir(), "marine_vision_report.pdf")
    c = canvas.Canvas(temp_pdf_path, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, "MarineVision AI - Dive Target Report")
    c.setFont("Helvetica", 10)
    c.drawString(50, 730, "Automated Underwater Debris Detection System")
    
    y = 680
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y, "Class")
    c.drawString(150, y, "Latitude")
    c.drawString(250, y, "Longitude")
    c.drawString(350, y, "Confidence")
    c.drawString(450, y, "Material")
    y -= 20
    
    c.setFont("Helvetica", 10)
    for _, row in df.iterrows():
        c.drawString(50, y, str(row['class']))
        c.drawString(150, y, f"{row['lat']:.5f}")
        c.drawString(250, y, f"{row['lon']:.5f}")
        c.drawString(350, y, f"{row['conf']*100:.1f}%")
        c.drawString(450, y, str(row['material']))
        y -= 20
        
    c.save()
    return FileResponse(temp_pdf_path, media_type="application/pdf", filename="marine_vision_report.pdf")

@app.post("/api/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    # Simulates passing the uploaded sonar image to the ONNX model
    # and returning an immediate detection for UI feedback.
    return {
        "status": "success",
        "detections": [
            {
                "id": "upl_" + str(len(file.filename)),
                "latitude": 12.5050,
                "longitude": 80.5050,
                "class_name": "sunken_debris",
                "final_confidence": 0.98,
                "material_estimate": "Hard (Metal/Wood)",
                "bbox": [100, 150, 300, 400]
            }
        ]
    }

# WebSocket for live AUV stream simulation
@app.websocket("/ws/simulation/{mission_id}")
async def websocket_endpoint(websocket: WebSocket, mission_id: str):
    await websocket.accept()
    try:
        while True:
            # In a real environment, we would read from the hardware or the parser
            # For this test, we echo back a heartbeat
            data = await websocket.receive_text()
            await websocket.send_text(f"Received: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")

# Serve React Frontend Build
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")
    
    # Mount tiles directly if they exist in dist (copied from public)
    tiles_path = os.path.join(FRONTEND_DIST, "tiles")
    if os.path.exists(tiles_path):
        app.mount("/tiles", StaticFiles(directory=tiles_path), name="tiles")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve index.html for all other routes to support React SPA routing
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    print(f"WARNING: React build not found at {FRONTEND_DIST}. Run 'npm run build' in frontend.")

if __name__ == "__main__":
    uvicorn.run("backend.api.main:app", host="127.0.0.1", port=8000, reload=True)
