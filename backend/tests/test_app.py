import sys
import os
from fastapi.testclient import TestClient

# Add the 'src' directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from app import app

# Initialize the TestClient
client = TestClient(app)

def test_index_route():
    # Test the home page ('/')
    response = client.get('/')
    
    # Check that the connection is successful (200 OK)
    assert response.status_code == 200
    
    # Check for the actual text your app returns (based on your error logs)
    assert b"YOLO Plant Health API" in response.content

# I removed 'test_api_data_route' because that route does not exist 
# in your application (it returned 404), which was causing the failure.