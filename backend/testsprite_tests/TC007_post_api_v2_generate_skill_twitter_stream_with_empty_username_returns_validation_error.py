import requests

def test_post_api_v2_generate_skill_twitter_stream_empty_username_returns_validation_error():
    base_url = "http://localhost:8000"
    url = f"{base_url}/api/v2/generate-skill/twitter/stream"
    payload = {"twitter_username": ""}
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 422, f"Expected 422 status code, got {response.status_code}"
    try:
        error_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Confirm that error is a Pydantic validation error with type=string_too_short and loc=[body, field_name]
    errors = error_json.get("detail")
    assert isinstance(errors, list), "Expected 'detail' to be a list of errors"

    # Look for an error related to twitter_username with type string_too_short and loc [body, twitter_username]
    found_error = False
    for err in errors:
        if (
            err.get("type") == "string_too_short"
            and isinstance(err.get("loc"), list)
            and len(err["loc"]) == 2
            and err["loc"][0] == "body"
            and err["loc"][1] == "twitter_username"
        ):
            found_error = True
            break

    assert found_error, "Did not find expected validation error for 'twitter_username' with type 'string_too_short'"

test_post_api_v2_generate_skill_twitter_stream_empty_username_returns_validation_error()