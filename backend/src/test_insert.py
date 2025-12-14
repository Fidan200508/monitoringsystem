from src.database import insert_sensor_data

data = {
    "sensor_id": "sensor_01",
    "temperature": 26.1,
    "humidity": 58,
    "status": "healthy"
}

print(insert_sensor_data(data))
