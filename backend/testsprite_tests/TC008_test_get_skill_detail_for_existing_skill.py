import requests

BASE_URL = "https://creator-skill-backend-production.up.railway.app"
TIMEOUT = 30

def test_get_skill_detail_for_existing_skill():
    # Step 1: GET /api/v1/skills to get existing skills
    skills_list_resp = requests.get(f"{BASE_URL}/api/v1/skills", timeout=TIMEOUT)
    assert skills_list_resp.status_code == 200, f"Expected 200, got {skills_list_resp.status_code}"
    skills_json = skills_list_resp.json()

    # According to PRD, response includes count and files summaries - look for skills list key
    # Common pattern: 'skills' or 'items' or use keys inspection
    if 'skills' in skills_json and isinstance(skills_json['skills'], list):
        skills_list = skills_json['skills']
    elif 'items' in skills_json and isinstance(skills_json['items'], list):
        skills_list = skills_json['items']
    else:
        # Try keys that have list type
        skills_list = next((v for v in skills_json.values() if isinstance(v, list)), None)
    
    assert skills_list is not None, "Response missing list of skills"
    assert isinstance(skills_list, list), "Skills list should be a list"

    # If no skills, skip further test (can't get detail)
    if not skills_list:
        assert False, "No skills found to test detail retrieval"
    
    # Pick the first skill name from the skills list for detail test
    first_skill = skills_list[0]
    if isinstance(first_skill, dict) and 'skill_name' in first_skill:
        skill_name = first_skill['skill_name']
    elif isinstance(first_skill, str):
        skill_name = first_skill
    else:
        # maybe skill name is under a different key, try 'name'
        if isinstance(first_skill, dict) and 'name' in first_skill:
            skill_name = first_skill['name']
        else:
            assert False, "Skill entry in list neither string nor dict with skill_name"

    # Step 2: GET /api/v1/skills/{skill_name} for skill detail
    skill_detail_resp = requests.get(f"{BASE_URL}/api/v1/skills/{skill_name}", timeout=TIMEOUT)
    assert skill_detail_resp.status_code == 200, f"Expected 200, got {skill_detail_resp.status_code}"
    skill_detail = skill_detail_resp.json()

    # Validate skill detail structure
    # Expect at least: files key with a list
    assert "files" in skill_detail, "Skill detail missing 'files' key"
    assert isinstance(skill_detail["files"], list), "'files' should be a list"

    # Try to find SKILL.md file entry (optional assertion)
    skill_md_files = [f for f in skill_detail["files"] if isinstance(f, dict) and f.get("filename") == "SKILL.md"]

    # If SKILL.md present, check content
    if skill_md_files:
        for file_entry in skill_md_files:
            assert "content" in file_entry, "SKILL.md file missing 'content'"
            content = file_entry["content"]
            assert isinstance(content, str) and content.strip(), "SKILL.md file content is empty or not a string"

test_get_skill_detail_for_existing_skill()
