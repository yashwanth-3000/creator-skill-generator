import requests

base_url = "http://localhost:8000"

def test_get_api_export_skill_zip_not_found():
    skill_name = "non_existent_skill_xyz_123"
    url = f"{base_url}/api/export/{skill_name}/zip"
    try:
        response = requests.get(url, timeout=30)
        assert response.status_code == 404, f"Expected 404 Not Found, got {response.status_code}"
        json_resp = None
        try:
            json_resp = response.json()
        except Exception:
            pass
        assert json_resp is not None, "Response is not a valid JSON"
        assert 'zip not found' in str(json_resp).lower() or 'not found' in str(json_resp).lower(), \
            f"Expected error message mentioning zip not found, got: {json_resp}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_export_skill_zip_not_found()