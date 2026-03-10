import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_get_api_health_returns_service_status_ok():
    url = f"{BASE_URL}/api/health"
    try:
        response = requests.get(url, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected status 'ok', got {data.get('status')}"
        assert data.get("service") == "creator-skill-generator", f"Expected service 'creator-skill-generator', got {data.get('service')}"
    except requests.RequestException as e:
        assert False, f"RequestException raised: {e}"

test_get_api_health_returns_service_status_ok()