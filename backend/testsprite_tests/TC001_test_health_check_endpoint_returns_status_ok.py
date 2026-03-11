import requests

BASE_URL = "https://creator-skill-backend-production.up.railway.app"
TIMEOUT = 30

def test_health_check_endpoint_returns_status_ok():
    url = f"{BASE_URL}/api/health"
    try:
        response = requests.get(url, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to /api/health failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # According to instructions for TC001, expect status='ok', service='Creator Skill Backend', version='1.0.0'
    expected_keys = {"status", "service", "version"}
    assert expected_keys <= json_data.keys(), f"Response JSON missing keys {expected_keys - json_data.keys()}"
    assert json_data["status"] == "ok", f"Expected status='ok' but got {json_data['status']}"
    assert json_data["service"] == "Creator Skill Backend", f"Expected service='Creator Skill Backend' but got {json_data['service']}"
    assert json_data["version"] == "1.0.0", f"Expected version='1.0.0' but got {json_data['version']}"

test_health_check_endpoint_returns_status_ok()