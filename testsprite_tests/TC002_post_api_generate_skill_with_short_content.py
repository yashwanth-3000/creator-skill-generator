import requests

base_url = "http://localhost:8000"

def test_post_generate_skill_short_content():
    url = f"{base_url}/api/generate-skill"
    payload = {
        "creator_content": "Too short content less than 40 chars"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 422, f"Expected status code 422 but got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError as e:
        assert False, f"Response is not valid JSON: {e}"

    # Validate response contains validation error details (pydantic validation error format)
    assert "detail" in json_resp, "Response JSON must contain 'detail' field for validation error"

test_post_generate_skill_short_content()