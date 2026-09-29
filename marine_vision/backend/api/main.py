import os
import uuid
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn

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
