import requests

BASE_URL = "https://creator-skill-backend-production.up.railway.app"
TIMEOUT = 30

def test_v1_generate_skill_with_short_content():
    url = f"{BASE_URL}/api/v1/generate-skill"
    headers = {"Content-Type": "application/json"}
    payload = {
        "creator_content": "short"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 422, f"Expected status code 422, got {response.status_code}"
    try:
        error_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # FastAPI typical validation error structure has 'detail' key with list of errors
    assert "detail" in error_json, "'detail' key not found in response JSON"
    errors = error_json["detail"]
    assert isinstance(errors, list), "'detail' is not a list"

    # Find error related to 'creator_content' and type 'string_too_short'
    matched_error = None
    for err in errors:
        # err['loc'] is a tuple like ('body', 'creator_content')
        loc = err.get("loc", [])
        err_type = err.get("type", "")
        if err_type == "string_too_short" and len(loc) >= 2 and loc[0] == "body" and loc[1] == "creator_content":
            matched_error = err
            break
    assert matched_error is not None, "Validation error for 'creator_content' with type 'string_too_short' not found"

test_v1_generate_skill_with_short_content()
