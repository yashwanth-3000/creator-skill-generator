import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_get_api_skills_list_generated_skills_tc005():
    url = f"{BASE_URL}/api/skills"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to GET /api/skills failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # `skills` should be an array/list
    assert "skills" in data, "Response JSON does not contain 'skills' key"
    skills = data["skills"]
    assert isinstance(skills, list), "'skills' should be a list"

    # Check for the known existing skill "active-recall-study-system"
    skill = None
    for s in skills:
        if s.get("name") == "active-recall-study-system":
            skill = s
            break
    assert skill is not None, "Skill 'active-recall-study-system' not found in skills list"

    # Check metadata presence
    assert isinstance(skill.get("has_skill_md"), bool), "'has_skill_md' should be a boolean"
    assert isinstance(skill.get("has_zip"), bool), "'has_zip' should be a boolean"

    # files should be a list
    files = skill.get("files")
    assert isinstance(files, list), "'files' should be a list"

    # Check each file item has expected keys and types
    for file_item in files:
        assert isinstance(file_item, dict), "Each file item should be a dictionary"
        assert "relative_path" in file_item and isinstance(file_item["relative_path"], str), "File item missing 'relative_path' or it is not a string"
        assert "content" in file_item and isinstance(file_item["content"], str), "File item missing 'content' or it is not a string"

test_get_api_skills_list_generated_skills_tc005()