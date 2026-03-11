import requests

def test_post_api_v2_generate_skill_youtube_with_empty_url_list_returns_validation_error():
    base_url = "http://localhost:8000"
    url = f"{base_url}/api/v2/generate-skill/youtube"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "youtube_urls": [],
        "desired_skill_name": "Test Skill"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 422, f"Expected 422 status code, got {response.status_code}"
    json_resp = None
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    # Validate error structure according to Pydantic v2 validation error for too_short, loc=[body, field]
    assert "detail" in json_resp, "Missing 'detail' in response JSON"
    detail = json_resp["detail"]
    assert isinstance(detail, list), "'detail' should be a list"
    found_error = False
    for error in detail:
        if (
            isinstance(error, dict) and
            error.get("type") == "string_too_short" or error.get("type") == "too_short"
        ):
            loc = error.get("loc")
            # loc: [body, "youtube_urls"]
            if loc == ["body", "youtube_urls"]:
                found_error = True
                break
    assert found_error, "Did not find validation error of type 'too_short' for field 'youtube_urls'"

test_post_api_v2_generate_skill_youtube_with_empty_url_list_returns_validation_error()