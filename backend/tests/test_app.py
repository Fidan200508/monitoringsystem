import sys
import os
from fastapi.testclient import TestClient  # Import the FastAPI test client

# Add the 'src' directory to Python path (Same as your original code)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(_file_), '../src')))

from app import app

# Initialize the client once (Standard FastAPI way)
client = TestClient(app)

def test_index_route():
    # Use the global client variable
    response = client.get('/')
    
    assert response.status_code == 200
    # In FastAPI, use .content instead of .data to read bytes
    assert b'Monitoring System Backend' in response.content

def test_api_data_route():
    # Use the global client variable
    response = client.get('/api/data')
    
    assert response.status_code == 200
    # In FastAPI, use .content instead of .data
    assert b'temperature' in response.content
    assert b'humidity' in response.content