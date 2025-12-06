from fastapi.testclient import TestClient
from main import app
import pytest

client = TestClient(app)

def test_calculate_chart_structure():
    """
    Verify that /api/chart returns the expected nested structure:
    {
        "D1": {
            "houses": { ... } OR "planets": { ... },
            "ascendant": { ... }
        },
        "D9": { ... }
    }
    """
    payload = {
        "year": 1990,
        "month": 1,
        "day": 1,
        "hour": 12,
        "minute": 0,
        "latitude": 28.61,
        "longitude": 77.20
    }
    
    response = client.post("/api/chart", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Check Top Level Keys
    assert "D1" in data
    assert "D9" in data
    
    # Check D1 Structure
    d1 = data["D1"]
    assert "planets" in d1
    assert "ascendant" in d1
    
    # Verify Planets Structure
    planets = d1["planets"]
    assert "Sun" in planets
    assert "house" in planets["Sun"]
    assert "sign" in planets["Sun"]
    
    # Verify Ascendant
    ascendant = d1["ascendant"]
    assert "sign" in ascendant
    assert "sign_num" in ascendant

def test_calculate_dasha():
    payload = {
        "year": 1990,
        "month": 1,
        "day": 1,
        "hour": 12,
        "minute": 0,
        "latitude": 28.61,
        "longitude": 77.20
    }
    response = client.post("/api/dasha", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "maha_dashas" in data
