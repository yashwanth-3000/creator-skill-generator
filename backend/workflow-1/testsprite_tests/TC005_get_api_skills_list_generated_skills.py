import requests

base_url = "http://localhost:8000"
timeout = 30

def test_get_api_skills_list_generated_skills():
    url = f"{base_url}/api/skills"
    try:
        response = requests.get(url, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed with exception: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    json_resp = None
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response content is not valid JSON"

    assert isinstance(json_resp, dict), f"Response JSON should be a dict, got {type(json_resp)}"
    skills = json_resp.get("skills")
    assert isinstance(skills, list), "Response JSON does not contain 'skills' list"

    for skill in skills:
        assert isinstance(skill, dict), "Each skill should be a dict"
        # Validate keys and their types
        assert "name" in skill and isinstance(skill["name"], str), "Skill missing 'name' string"
        assert "has_skill_md" in skill and isinstance(skill["has_skill_md"], bool), "Skill missing 'has_skill_md' boolean"
        assert "has_zip" in skill and isinstance(skill["has_zip"], bool), "Skill missing 'has_zip' boolean"
        assert "files" in skill and isinstance(skill["files"], list), "Skill missing 'files' list"

        for file in skill["files"]:
            assert isinstance(file, dict), "Each file should be a dict"
            assert "relative_path" in file and isinstance(file["relative_path"], str), "File missing 'relative_path' string"
            assert "content" in file and isinstance(file["content"], str), "File missing 'content' string"

test_get_api_skills_list_generated_skills()