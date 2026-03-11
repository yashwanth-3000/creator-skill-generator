import requests

def test_delete_api_v1_skills_nonexistent_returns_404():
    base_url = "http://localhost:8000"
    skill_name = "nonexistent-skill-xyz-999"
    url = f"{base_url}/api/v1/skills/{skill_name}"
    headers = {
        "Accept": "application/json"
    }

    try:
        response = requests.delete(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 404, f"Expected 404 but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    detail = data.get("detail", "")
    assert detail and "not found" in detail.lower(), f"Expected detail containing 'not found', got: {detail}"

test_delete_api_v1_skills_nonexistent_returns_404()