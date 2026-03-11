import requests

def test_get_api_health_returns_service_status_ok():
    url = "http://localhost:8000/api/health"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    # Assert status code is 200
    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"

    # Assert response content type is JSON
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type.lower(), f"Expected JSON response but got {content_type}"

    # Assert JSON body contains expected keys and values
    try:
        json_data = response.json()
    except ValueError as e:
        assert False, f"Response is not valid JSON: {e}"

    assert json_data.get("status") == "ok", f"Expected status 'ok' but got {json_data.get('status')}"
    assert json_data.get("service") == "Creator Skill Backend", f"Expected service 'Creator Skill Backend' but got {json_data.get('service')}"
    assert json_data.get("version") == "1.0.0", f"Expected version '1.0.0' but got {json_data.get('version')}"

test_get_api_health_returns_service_status_ok()