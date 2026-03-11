import requests

def test_post_api_v2_generate_skill_twitter_empty_username_validation_error():
    base_url = "http://localhost:8000"
    endpoint = "/api/v2/generate-skill/twitter"
    url = base_url + endpoint
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "twitter_username": ""
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 422, f"Expected status code 422, got {response.status_code}"
    json_resp = response.json()
    # Validate Pydantic v2 validation error format
    assert "detail" in json_resp, "Response missing 'detail' field"
    error_detail = json_resp["detail"]
    assert isinstance(error_detail, list) and len(error_detail) > 0, "Error detail should be a non-empty list"
    found_string_too_short_error = False
    for err in error_detail:
        if (
            err.get("type") == "string_too_short"
            and err.get("loc") == ["body", "twitter_username"]
        ):
            found_string_too_short_error = True
            break
    assert found_string_too_short_error, (
        "Did not find expected validation error with type 'string_too_short' and loc ['body', 'twitter_username']"
    )

test_post_api_v2_generate_skill_twitter_empty_username_validation_error()