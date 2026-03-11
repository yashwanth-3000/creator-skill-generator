import requests

BASE_URL = "http://localhost:8001"
TIMEOUT = 5  # seconds

def test_get_export_skill_package_zip():
    existing_skill = "mkbhd-twitter-voice"
    non_existent_skill = "nonexistent"

    # Test existing skill zip export - expect 200 and content type zip
    try:
        response = requests.get(f"{BASE_URL}/api/export/{existing_skill}/zip", timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}"
        content_type = response.headers.get("Content-Type", "")
        # Content-Type for ZIP commonly application/zip or application/octet-stream
        assert "zip" in content_type.lower() or content_type == "application/octet-stream", f"Unexpected Content-Type: {content_type}"
        assert len(response.content) > 0, "Response content is empty"
    except requests.RequestException as e:
        assert False, f"RequestException on existing skill zip download: {e}"

    # Test non-existent skill zip export - expect 404
    try:
        response = requests.get(f"{BASE_URL}/api/export/{non_existent_skill}/zip", timeout=TIMEOUT)
        assert response.status_code == 404, f"Expected 404 but got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"RequestException on non-existent skill zip download: {e}"

test_get_export_skill_package_zip()