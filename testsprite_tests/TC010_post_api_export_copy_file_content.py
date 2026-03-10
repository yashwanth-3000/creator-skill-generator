import requests

def test_post_api_export_copy_file_content():
    base_url = "http://localhost:8000"
    endpoint = "/api/export/copy"
    skill_name = "active-recall-study-system"
    file_path = "SKILL.md"
    url = base_url + endpoint
    payload = {
        "skill_name": skill_name,
        "file_path": file_path
    }
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    timeout = 30

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "content" in json_response, "Response JSON missing 'content'"
    assert "file_path" in json_response, "Response JSON missing 'file_path'"
    assert json_response["file_path"] == file_path, f"Response file_path expected '{file_path}' but got '{json_response['file_path']}'"
    assert isinstance(json_response["content"], str) and len(json_response["content"]) > 0, "Content should be a non-empty string"

test_post_api_export_copy_file_content()