from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from src.database import insert_sensor_data
import shutil
import os
import uuid

app = FastAPI(title="Monitoring System API")

# 🔹 Allow frontend (important for Render + frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later you can restrict
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 Upload directory (Render-safe)
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 🔹 Health check endpoint (Render loves this)
@app.get("/")
def root():
    return {"status": "Backend is running 🚀"}

# 🔹 Image analysis endpoint
@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    # 🔹 Make filename unique (important!)
    ext = file.filename.split(".")[-1]
    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    # 🔹 Save image
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 🔹 AI logic (placeholder – later YOLO / ML model)
    health_status = "healthy"
    overall_health = 80

    result = {
        "file": unique_name,
        "health_status": health_status,
        "overall_health": overall_health
    }

    # 🔹 Save result to MongoDB
    insert_sensor_data({
        "type": "image_analysis",
        "file": unique_name,
        "health_status": health_status,
        "overall_health": overall_health
    })

    return result
