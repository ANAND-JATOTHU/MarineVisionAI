import os
from ultralytics import YOLO

def main():
    print("Initializing YOLO11n-seg model...")
    model = YOLO("yolo11n-seg.pt")  # Nano segmentation pretrained
    
    # Check if dataset exists
    config_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../configs/marine_debris.yaml"))
    
    print("Starting training with shadow-aware parameters...")
    results = model.train(
        data=config_path,
        epochs=100,
        imgsz=640,
        batch=16,
        device="cpu",              # Change to "0" for GPU
        project=os.path.join(os.path.dirname(__file__), "../runs/train"),
        name="marine_debris_v1",
        # Shadow-aware parameters (Critical)
        mosaic=0.5,              
        mixup=0.0,               
        hsv_h=0.0,               
        hsv_s=0.0,               
        hsv_v=0.15,              
        flipud=0.5,              
        fliplr=0.5,              
        degrees=5.0,             
        translate=0.1,
        scale=0.3,
        perspective=0.0,         
        close_mosaic=10,
    )
    print("Training complete.")

if __name__ == "__main__":
    main()
