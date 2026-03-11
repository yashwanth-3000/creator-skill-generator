import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_post_api_generate_skill_with_short_creator_content():
    url = f"{BASE_URL}/api/generate-skill"
    headers = {"Content-Type": "application/json"}
    payload = {
        "creator_content": "Too short content example",  # shorter than 40 chars
        # Other fields omitted, use defaults
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 422, f"Expected 422 but got {response.status_code}"

    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validation error message expected, check typical keys for validation error
    # It could vary, but must indicate creator_content minlength rule
    # Check for validation error indication in standard FastAPI validation error structure
    # FastAPI 422 errors typically in 'detail' list with loc, msg, type
    assert "detail" in json_response, "Response JSON missing 'detail' key for validation errors"
    details = json_response["detail"]
    assert isinstance(details, list) and len(details) > 0, "Validation 'detail' should be a non-empty list"

    found_min_length_error = False
    for err in details:
        if (
            isinstance(err, dict)
            and err.get("loc") and "creator_content" in err.get("loc")
            and isinstance(err.get("msg"), str)
            and ("at least 40 characters" in err["msg"].lower() or "min length" in err["msg"].lower())
        ):
            found_min_length_error = True
            break

    assert found_min_length_error, "Validation error for 'creator_content' minimum length not found in response detail"

test_post_api_generate_skill_with_short_creator_content()