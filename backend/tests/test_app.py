import sys
import os

# Add the 'src' directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from app import app


def test_index_route():
    client = app.test_client()
    response = client.get('/')

    assert response.status_code == 200
    assert b'Monitoring System Backend' in response.data


def test_api_data_route():
    client = app.test_client()
    response = client.get('/api/data')

    assert response.status_code == 200
    assert b'temperature' in response.data
    assert b'humidity' in response.data
