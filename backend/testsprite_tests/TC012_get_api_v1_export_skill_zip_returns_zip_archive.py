import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_get_api_v1_export_skill_zip_returns_zip_archive():
    # Step 1: Get existing skills to find a valid skill_name
    skills_resp = requests.get(f"{BASE_URL}/api/v1/skills", timeout=TIMEOUT)
    assert skills_resp.status_code == 200, f"Failed to list skills, status code {skills_resp.status_code}"
    skills_data = skills_resp.json()
    skills_list = skills_data.get("skills")
    assert isinstance(skills_list, list) and len(skills_list) > 0, "No skills found to test export"
    
    skill_name = skills_list[0].get("name")
    assert skill_name and isinstance(skill_name, str), "Invalid skill name retrieved from skills list"
    
    # Step 2: Request the zip export for the chosen skill_name
    export_url = f"{BASE_URL}/api/v1/export/{skill_name}/zip"
    resp = requests.get(export_url, timeout=TIMEOUT)
    
    # Step 3: Validate response
    assert resp.status_code == 200, f"Expected 200 OK but got {resp.status_code}"
    content_type = resp.headers.get("Content-Type", "")
    assert content_type == "application/zip", f"Expected Content-Type 'application/zip' but got '{content_type}'"
    # Optional: Assert response content is not empty (should be a zip archive)
    assert resp.content and len(resp.content) > 0, "Zip archive content is empty"

test_get_api_v1_export_skill_zip_returns_zip_archive()