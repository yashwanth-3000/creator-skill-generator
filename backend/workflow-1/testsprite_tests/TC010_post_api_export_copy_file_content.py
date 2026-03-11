import requests

base_url = "http://localhost:8000"


def test_post_api_export_copy_file_content():
    skill_name = "active-recall-study-system"
    file_path = "SKILL.md"
    url = f"{base_url}/api/export/copy"
    headers = {"Content-Type": "application/json"}
    payload = {
        "skill_name": skill_name,
        "file_path": file_path
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    json_data = response.json()
    assert "content" in json_data, "Response JSON missing 'content' key"
    assert "file_path" in json_data, "Response JSON missing 'file_path' key"
    assert json_data["file_path"] == file_path, f"Expected file_path '{file_path}', got '{json_data['file_path']}'"
    assert isinstance(json_data["content"], str), "Content should be a string"
    assert len(json_data["content"]) > 0, "Content should not be empty"


test_post_api_export_copy_file_content()