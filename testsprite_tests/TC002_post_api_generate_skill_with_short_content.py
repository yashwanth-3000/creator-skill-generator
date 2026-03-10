import requests

def test_post_api_generate_skill_with_short_content():
    base_url = "http://localhost:8000"
    url = f"{base_url}/api/generate-skill"
    headers = {
        "Content-Type": "application/json"
    }
    # creator_content shorter than 40 chars (less than required minimum)
    payload = {
        "creator_content": "Too short content here",
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Expecting 422 validation error due to short creator_content
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    # Optionally check the response message for validation error
    try:
        resp_json = response.json()
        assert "detail" in resp_json or "errors" in resp_json or isinstance(resp_json, dict)
    except Exception:
        pass

test_post_api_generate_skill_with_short_content()