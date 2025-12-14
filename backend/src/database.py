import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
print("Mongo URI loaded:", bool(MONGO_URI))

client = MongoClient(MONGO_URI)

db = client["monitoring_db"]
collection = db["sensor_data"]

def insert_sensor_data(data: dict):
    result = collection.insert_one(data)
    return str(result.inserted_id)
