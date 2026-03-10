import requests

def test_get_api_export_skill_zip_not_found():
    base_url = "http://localhost:8000"
    non_existent_skill_name = "this-skill-does-not-exist-12345"
    url = f"{base_url}/api/export/{non_existent_skill_name}/zip"
    try:
        response = requests.get(url, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 404, f"Expected 404 but got {response.status_code}"
    # The response text or json should contain indication that zip not found for given skill name
    # Check for known message substring; can be text or json
    if response.headers.get("content-type", "").startswith("application/json"):
        json_data = {}
        try:
            json_data = response.json()
        except Exception:
            pass
        assert any("zip not found" in str(v).lower() for v in json_data.values()) or "not found" in str(json_data).lower(), \
            f"Response JSON does not indicate zip not found: {json_data}"
    else:
        # Plain text or other content
        assert "not found" in response.text.lower(), f"Response text does not indicate zip not found: {response.text}"

test_get_api_export_skill_zip_not_found()