# CropGuard YOLOv8 model

Place the trained YOLOv8 TensorFlow Lite model in this folder when it is available,
or set `EXPO_PUBLIC_YOLO_MODEL_URL` to a `file://` or `https://` model URL in the
native build environment.

The mobile adapter expects a YOLOv8 detection export with:

- RGB input tensor shaped `1 x 640 x 640 x 3`
- Float32 input values normalized to `[-1, 1]`
- One output tensor shaped `1 x (4 + classCount) x predictions`
- Class names supplied through `EXPO_PUBLIC_YOLO_CLASS_NAMES`, comma-separated

The app intentionally does not ship a generic COCO YOLO model because it cannot
identify crop diseases. Until a crop-disease model is configured, the preview
uses a clearly labeled demo result and still exercises the complete result flow.