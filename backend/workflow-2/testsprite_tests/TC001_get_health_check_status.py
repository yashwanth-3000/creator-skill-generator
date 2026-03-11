import requests

def test_get_health_check_status():
    base_url = "http://localhost:8001"
    url = f"{base_url}/api/health"
    try:
        response = requests.get(url, timeout=5)
        assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
        json_body = response.json()
        assert json_body.get("status") == "ok", f"Expected status 'ok' but got {json_body.get('status')}"
        assert json_body.get("service") == "Creator Skill Backend", f"Expected service 'Creator Skill Backend' but got {json_body.get('service')}"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_health_check_status()