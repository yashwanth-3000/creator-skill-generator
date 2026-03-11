import requests

base_url = "http://localhost:8000"


def test_get_api_export_single_file_download():
    skill_name = "active-recall-study-system"
    file_path = "SKILL.md"
    url = f"{base_url}/api/export/{skill_name}/{file_path}"

    try:
        response = requests.get(url, timeout=30)
        # Validate status code 200
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

        # Validate content type is markdown or plain text
        content_type = response.headers.get("Content-Type", "")
        valid_content_types = ["text/markdown", "text/plain"]
        assert any(ct in content_type for ct in valid_content_types), f"Unexpected Content-Type: {content_type}"

        # Validate that response content is not empty
        assert response.content, "Response content is empty"

    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"


test_get_api_export_single_file_download()