import requests

def test_get_api_export_single_file_path_traversal_attempt():
    base_url = "http://localhost:8000"
    skill_name = "active-recall-study-system"
    # Path traversal attempt
    file_path = "../../etc/passwd"
    url = f"{base_url}/api/export/{skill_name}/{file_path}"
    headers = {
        "Accept": "*/*"
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code in (400, 404), f"Expected status code 400 or 404, got {response.status_code}"
    # Optional: check response content to confirm invalid path message
    try:
        json_resp = response.json()
        if response.status_code == 400:
            assert "invalid" in str(json_resp).lower() or "path" in str(json_resp).lower()
    except ValueError:
        # Response is not JSON, still accept 400 or 404 as valid
        pass

test_get_api_export_single_file_path_traversal_attempt()