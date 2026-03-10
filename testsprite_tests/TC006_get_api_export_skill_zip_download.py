import requests

base_url = "http://localhost:8000"

def test_get_api_export_skill_zip_download():
    skill_name = "active-recall-study-system"
    url = f"{base_url}/api/export/{skill_name}/zip"
    headers = {}
    timeout = 30
    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        # Assert status code 200
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        # Assert content type header is application/zip
        content_type = response.headers.get("Content-Type", "")
        assert content_type == "application/zip", f"Expected Content-Type application/zip, got {content_type}"
        # Assert response has content and content is bytes
        content_length = response.headers.get("Content-Length")
        assert response.content is not None and len(response.content) > 0, "Response content is empty"
        # Optionally verify content-length header if present
        if content_length is not None:
            assert int(content_length) == len(response.content), "Content-Length does not match actual content size"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_export_skill_zip_download()