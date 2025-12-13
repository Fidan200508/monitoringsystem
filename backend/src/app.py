from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import shutil
import os

# --------------------------------------------------
# App init
# --------------------------------------------------
app = FastAPI(
    title="YOLO Plant Health Analysis API",
    description="Demo-safe YOLO based plant health analysis",
    version="3.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Paths
# --------------------------------------------------
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --------------------------------------------------
# Load YOLO model (object detector)
# --------------------------------------------------
model = YOLO("yolov8n.pt")

# --------------------------------------------------
# Analyze endpoint
# --------------------------------------------------
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed")

    image_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # YOLO inference
    results = model(image_path)[0]

    detections = []

    for box in results.boxes:
        conf = float(box.conf[0])
        cls_id = int(box.cls[0])
        label = model.names[cls_id]

        # --------------------------------------------
        # IMPORTANT FILTER (prevents false positives)
        # --------------------------------------------
        if conf < 0.85:
            continue

        # Ignore generic food/object detections
        if label in ["apple", "banana", "orange", "person"]:
            continue

        x1, y1, x2, y2 = map(int, box.xyxy[0])

        detections.append({
            "label": label,
            "confidence": round(conf, 2),
            "box": [x1, y1, x2, y2]
        })

    # --------------------------------------------------
    # Health decision (SAFE DEMO LOGIC)
    # --------------------------------------------------
    if len(detections) == 0:
        health_status = "Sağlam"
        overall_health = 100
    else:
        health_status = "Risk altındadır"
        overall_health = max(40, 100 - len(detections) * 20)

    return {
        "health_status": health_status,
        "overall_health": overall_health,
        "detections": detections,
        "note": "YOLO object model used. Disease model not trained yet."
    }

# --------------------------------------------------
# Root
# --------------------------------------------------
@app.get("/")
def root():
    return {
        "message": "YOLO Plant Health API running ✅",
        "status": "Demo-safe mode",
        "next_step": "Train YOLO with plant disease dataset"
    }
