import requests

def test_post_api_v2_generate_skill_stream_short_content_validation_error():
    base_url = "http://localhost:8000"
    url = f"{base_url}/api/v2/generate-skill/stream"
    headers = {"Content-Type": "application/json"}

    # creator_content shorter than 40 characters to trigger validation error
    payload = {
        "creator_content": "Too short content <40 chars"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate HTTP status code 422 Unprocessable Entity
    assert response.status_code == 422, f"Expected status code 422 but got {response.status_code}"

    # Validate response body contains Pydantic v2 validation error inside 'errors' or 'detail' list
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    errors = json_resp.get("errors") or json_resp.get("detail")
    assert errors and isinstance(errors, list), "Expected 'errors' or 'detail' key with list in validation error response"

    found = False
    for error in errors:
        # loc can be list or tuple
        loc = error.get("loc")
        if error.get("type") == "string_too_short" and loc in (["body", "creator_content"], ("body", "creator_content")):
            found = True
            break
    assert found, (
        f"Expected to find error with type 'string_too_short' and loc ['body', 'creator_content'] in errors but got {errors}"
    )

test_post_api_v2_generate_skill_stream_short_content_validation_error()
