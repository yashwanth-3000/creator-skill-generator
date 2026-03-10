import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30
SKILL_NAME = "active-recall-study-system"
FILE_PATH = "SKILL.md"


def test_get_api_export_single_file_download():
    url = f"{BASE_URL}/api/export/{SKILL_NAME}/{FILE_PATH}"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    content_type = response.headers.get("Content-Type", "")
    # Accept text/markdown or text/plain per PRD, allow charset suffixes
    assert content_type.startswith("text/markdown") or content_type.startswith("text/plain"), f"Unexpected Content-Type: {content_type}"
    # Response content should not be empty
    assert response.content and len(response.content) > 0, "Response content is empty"


test_get_api_export_single_file_download()