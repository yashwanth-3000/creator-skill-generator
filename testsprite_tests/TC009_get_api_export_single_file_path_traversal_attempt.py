import requests

def test_get_api_export_single_file_path_traversal_attempt():
    base_url = "http://localhost:8000"
    skill_name = "active-recall-study-system"
    # URL-encoded path traversal attempt: ../..\/..\/etc\/passwd encoded with %2F for slash
    file_path = "..%2F..%2F..%2Fetc%2Fpasswd"
    url = f"{base_url}/api/export/{skill_name}/{file_path}"
    try:
        response = requests.get(url, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    # The server is expected to return 400 with JSON detail "Invalid path"
    assert response.status_code == 400, f"Expected status 400, got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    assert "detail" in json_resp, "Response JSON missing 'detail' key"
    assert json_resp["detail"] == "Invalid path", f"Expected detail 'Invalid path', got {json_resp['detail']}"

test_get_api_export_single_file_path_traversal_attempt()