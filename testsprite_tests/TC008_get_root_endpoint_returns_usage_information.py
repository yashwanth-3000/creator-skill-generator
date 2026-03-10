import requests

def test_get_root_endpoint_returns_usage_information():
    base_url = "http://localhost:8000/"
    try:
        response = requests.get(base_url, timeout=30)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        json_data = response.json()
        assert "message" in json_data, "Response JSON missing 'message' field"
        message = json_data["message"].lower()
        assert "/api/generate-skill" in message, "Message does not direct to POST /api/generate-skill"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_root_endpoint_returns_usage_information()