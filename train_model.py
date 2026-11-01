from ultralytics import YOLO
import os
import sys

print("Starting training with YOLOv8 on the Crop Health Advisor dataset...")

# Allow dataset path via command-line argument, environment variable, or fallback
default_data_path = r"D:\Crop Health Advisor.v1i.yolov8\data.yaml"
data_path = sys.argv[1] if len(sys.argv) > 1 else os.getenv("DATA_YAML_PATH", default_data_path)

if not os.path.exists(data_path):
    print(f"Warning: Dataset configuration not found at '{data_path}'.")
    print("Usage: python train_model.py [path/to/data.yaml] or set DATA_YAML_PATH environment variable.")

# Load a pre-trained YOLOv8 Nano model (smallest and fastest)
model = YOLO('yolov8n.pt')

# Train the model
# We set epochs=1 for a quick test. For full accuracy, this should be 25-50.
# Without a GPU, training 15,000 images will take several hours even for 1 epoch.
results = model.train(
    data=data_path, 
    epochs=1, 
    imgsz=320,  # Reduced image size to speed up CPU training
    batch=8,    # Smaller batch size for CPU memory
    device='cpu',
    project='crop_health',
    name='run_1'
)

print("Training finished! Exporting to TFLite format for the mobile app...")

# Export to TFLite
export_path = model.export(format='tflite', imgsz=320, int8=False)

print(f"Export complete! Model saved at: {export_path}")


