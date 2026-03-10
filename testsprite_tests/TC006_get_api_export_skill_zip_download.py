import requests

def test_get_api_export_skill_zip_download():
    base_url = "http://localhost:8000"
    skill_name = "active-recall-study-system"
    url = f"{base_url}/api/export/{skill_name}/zip"
    headers = {}
    timeout = 30

    response = None
    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        content_type = response.headers.get("Content-Type", "")
        assert content_type == "application/zip", f"Expected Content-Type 'application/zip', got '{content_type}'"
        # Further verify the zip content by checking the beginning bytes for ZIP signature
        zip_signature = b'PK\x03\x04'
        assert response.content.startswith(zip_signature), "Response content does not start with a valid ZIP file signature"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_export_skill_zip_download()