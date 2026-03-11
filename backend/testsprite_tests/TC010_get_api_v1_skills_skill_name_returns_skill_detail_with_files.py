import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def test_get_api_v1_skills_skill_name_returns_skill_detail_with_files():
    # Step 1: Get the list of existing skills from /api/v1/skills
    skills_url = f"{BASE_URL}/api/v1/skills"
    try:
        response = requests.get(skills_url, timeout=TIMEOUT)
        response.raise_for_status()
        skills_data = response.json()
    except Exception as e:
        assert False, f"Failed to get skills list: {e}"

    # Validate response contains skills array and count
    assert "skills" in skills_data, "Response JSON missing 'skills' key"
    assert "count" in skills_data, "Response JSON missing 'count' key"
    assert isinstance(skills_data["skills"], list), "'skills' should be a list"
    assert skills_data["count"] == len(skills_data["skills"]), "'count' does not match number of skills"

    if not skills_data["skills"]:
        assert False, "No skills available to test GET /api/v1/skills/{skill_name}"

    # Pick the first skill's name
    skill_name = skills_data["skills"][0].get("name")
    assert skill_name and isinstance(skill_name, str), "Skill name is missing or invalid"

    # Step 2: Get the skill detail from /api/v1/skills/{skill_name}
    skill_detail_url = f"{BASE_URL}/api/v1/skills/{skill_name}"
    try:
        detail_resp = requests.get(skill_detail_url, timeout=TIMEOUT)
        detail_resp.raise_for_status()
        skill_detail = detail_resp.json()
    except Exception as e:
        assert False, f"Failed to get skill detail: {e}"

    # Validate skill detail contains files array
    assert "files" in skill_detail, "Skill detail missing 'files' key"
    files = skill_detail["files"]
    assert isinstance(files, list), "'files' should be a list"

    # Each file should have relative_path and content keys
    for f in files:
        assert isinstance(f, dict), "Each file should be a dict"
        assert "relative_path" in f and isinstance(f["relative_path"], str), "File missing valid 'relative_path'"
        assert "content" in f and isinstance(f["content"], str), "File missing valid 'content'"


test_get_api_v1_skills_skill_name_returns_skill_detail_with_files()