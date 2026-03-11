import requests

def test_post_api_v1_generate_skill_with_short_content_returns_validation_error():
    url = "http://localhost:8000/api/v1/generate-skill"
    headers = {
        "Content-Type": "application/json"
    }
    # creator_content shorter than 40 characters
    payload = {
        "creator_content": "Too short content <40 chars"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 422, f"Expected status code 422 but got {response.status_code}"
    try:
        error_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Check that error response has 'errors' or 'detail' list
    errors = error_response.get("errors") or error_response.get("details") or error_response.get("detail")
    if not errors:
        assert False, "Error response has no 'errors', 'details' or 'detail' field containing validation errors"

    # Errors can be nested dict or list, normalize to list
    if isinstance(errors, dict) and "errors" in errors:
        errors = errors["errors"]

    if not isinstance(errors, list):
        assert False, "Validation errors field is not a list"

    # Find error related to creator_content
    creator_content_errors = [err for err in errors if isinstance(err, dict) and err.get("loc") == ["body", "creator_content"]]
    assert creator_content_errors, "No validation error found for 'creator_content' field"

    # Validate that error type is string_too_short
    found_string_too_short = any(err.get("type") == "string_too_short" for err in creator_content_errors)
    assert found_string_too_short, "Validation error is not of type 'string_too_short' for 'creator_content'"

test_post_api_v1_generate_skill_with_short_content_returns_validation_error()