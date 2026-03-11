import requests
import time

BASE_URL = "http://localhost:8001"
TIMEOUT = 5  # seconds


def test_get_root_usage_message():
    start_time = time.time()
    try:
        response = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    elapsed = time.time() - start_time
    assert elapsed < TIMEOUT, f"Test took too long: {elapsed} seconds"

    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"

    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "message" in json_data, "Response JSON does not contain 'message' field"
    assert (
        json_data["message"] == "POST /api/generate-skill with creator content"
    ), f"Unexpected message value: {json_data['message']}"


test_get_root_usage_message()