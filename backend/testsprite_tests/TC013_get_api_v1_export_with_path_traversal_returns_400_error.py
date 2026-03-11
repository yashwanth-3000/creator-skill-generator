import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_get_api_v1_export_path_traversal_returns_400():
    url = f"{BASE_URL}/api/v1/export/..%2F..%2Fetc/passwd"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400 but got {response.status_code}"
    # The response should include "Invalid path" error message in the body (assumed JSON or plain text)
    content_type = response.headers.get("Content-Type", "")
    if "application/json" in content_type:
        try:
            data = response.json()
            # The error message might be in 'detail' or 'message'
            assert any("invalid path" in str(v).lower() for v in data.values()), f"Response JSON does not contain 'Invalid path' error: {data}"
        except Exception:
            # fallback to text assertion
            assert "invalid path" in response.text.lower(), f"Response body does not contain 'Invalid path': {response.text}"
    else:
        assert "invalid path" in response.text.lower(), f"Response body does not contain 'Invalid path': {response.text}"

test_get_api_v1_export_path_traversal_returns_400()