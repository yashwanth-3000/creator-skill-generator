import requests

BASE_URL = "https://creator-skill-backend-production.up.railway.app"
TIMEOUT = 30

def test_export_single_file_with_path_traversal_attempt():
    url = f"{BASE_URL}/api/v1/export/..%2F..%2Fetc/passwd"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
    json_resp = None
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not JSON"
    assert "detail" in json_resp, "Response JSON missing 'detail' key"
    assert json_resp["detail"] == "Invalid path", f"Expected detail 'Invalid path', got {json_resp['detail']}"

test_export_single_file_with_path_traversal_attempt()