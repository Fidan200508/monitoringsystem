import sys
import os
from fastapi.testclient import TestClient

# Fix: Use double underscores _file_
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from app import app

client = TestClient(app)

def test_index_route():
    response = client.get('/')
    assert response.status_code == 200
    assert b'Monitoring System Backend' in response.content

def test_api_data_route():
    response = client.get('/api/data')
    assert response.status_code == 200
    assert b'temperature' in response.content
    assert b'humidity' in response.content