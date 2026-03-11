import requests

def test_get_api_v1_skills_returns_list_of_generated_skills():
    base_url = "http://localhost:8000"
    url = f"{base_url}/api/v1/skills"
    timeout = 30
    headers = {"Accept": "application/json"}

    try:
        response = requests.get(url, headers=headers, timeout=timeout)
    except Exception as e:
        assert False, f"Request to {url} failed with exception: {e}"

    assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
    try:
        data = response.json()
    except Exception as e:
        assert False, f"Response is not valid JSON: {e}"

    assert "skills" in data, "'skills' key missing in response JSON"
    assert isinstance(data["skills"], list), "'skills' should be a list"
    assert "count" in data, "'count' key missing in response JSON"
    assert isinstance(data["count"], int), "'count' should be an integer"
    assert len(data["skills"]) == data["count"], "'count' does not match length of 'skills' list"

    for skill in data["skills"]:
        assert isinstance(skill, dict), "Each skill should be a dictionary"
        # Validate required fields in each skill object
        required_fields = ["name", "has_skill_md", "file_count", "files"]
        for field in required_fields:
            assert field in skill, f"Field '{field}' missing in skill item"
        assert isinstance(skill["name"], str) and skill["name"], "'name' should be a non-empty string"
        assert isinstance(skill["has_skill_md"], bool), "'has_skill_md' should be boolean"
        assert isinstance(skill["file_count"], int), "'file_count' should be integer"
        assert isinstance(skill["files"], list), "'files' should be a list"

test_get_api_v1_skills_returns_list_of_generated_skills()