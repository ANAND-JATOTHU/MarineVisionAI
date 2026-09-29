import os
import shutil
from ultralytics import YOLO
from onnxruntime.quantization import quantize_dynamic, QuantType

def main():
    print("Starting ONNX export and INT8 quantization process...")
    
    # We will export the base yolo11n-seg.pt for now to unblock the team.
    # In production, this would point to: runs/train/marine_debris_v1/weights/best.pt
    model_path = "yolo11n-seg.pt"
    
    print(f"Loading model: {model_path}")
    model = YOLO(model_path)
    
    print("Exporting model to ONNX format...")
    # This generates yolo11n-seg.onnx in the current directory
    exported_path = model.export(
        format="onnx",
        imgsz=640,
        simplify=True,
        opset=17,
        half=False,
        dynamic=False,
    )
    
    print(f"Model exported to {exported_path}")
    
    # Destination directory for the final model
    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models"))
    os.makedirs(target_dir, exist_ok=True)
    
    target_onnx = os.path.join(target_dir, "best.onnx")
    
    print("Applying INT8 Dynamic Quantization for Edge Inference...")
    quantize_dynamic(
        model_input=exported_path,
        model_output=target_onnx,
        weight_type=QuantType.QInt8,
    )
    
    print(f"\n✅ Success! INT8 ONNX model deployed to: {target_onnx}")
    print("The backend team can now consume this model in marine_vision/backend/api/inference.py.")

if __name__ == "__main__":
    main()
