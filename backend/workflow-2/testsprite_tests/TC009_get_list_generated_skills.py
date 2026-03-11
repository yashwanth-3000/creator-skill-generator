import requests
import time

BASE_URL = "http://localhost:8001"
TIMEOUT = 5  # seconds


def test_get_list_generated_skills():
    start_time = time.time()
    url = f"{BASE_URL}/api/skills"
    headers = {
        "Accept": "application/json",
    }

    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    elapsed = time.time() - start_time
    assert elapsed < TIMEOUT, f"Test exceeded time limit: {elapsed:.2f}s"

    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response body is not valid JSON"

    assert "skills" in data, "'skills' key not found in response JSON"
    assert isinstance(data["skills"], list), "'skills' should be a list"

    # Validate each skill object in the list
    for skill in data["skills"]:
        assert isinstance(skill, dict), "Each skill must be a JSON object"
        assert "name" in skill and isinstance(skill["name"], str) and skill["name"], "Skill 'name' must be a non-empty string"
        assert "has_skill_md" in skill and isinstance(skill["has_skill_md"], bool), "'has_skill_md' must be boolean"
        assert "has_zip" in skill and isinstance(skill["has_zip"], bool), "'has_zip' must be boolean"
        assert "files" in skill and isinstance(skill["files"], list), "'files' must be a list"

        for file_entry in skill["files"]:
            assert isinstance(file_entry, dict), "Each file entry must be a JSON object"
            assert "relative_path" in file_entry and isinstance(file_entry["relative_path"], str) and file_entry["relative_path"], "File 'relative_path' must be a non-empty string"
            assert "content" in file_entry and isinstance(file_entry["content"], str), "File 'content' must be a string"


test_get_list_generated_skills()