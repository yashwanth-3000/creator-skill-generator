import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_get_api_health_internal_server_error():
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to /api/health failed with exception: {e}"
    # Acceptable status code for failure scenario is 500 Internal Server Error
    assert response.status_code == 500, f"Expected status code 500, got {response.status_code}"
    # Response body may vary, no strict schema required for 500 errors
    # Just ensure response is JSON or text indicating an error
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type or "text" in content_type.lower(), \
        f"Expected JSON or text response, got Content-Type: {content_type}"
    
test_get_api_health_internal_server_error()