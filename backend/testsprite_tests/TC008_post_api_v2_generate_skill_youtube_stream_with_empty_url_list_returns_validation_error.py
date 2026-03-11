import requests

def test_post_api_v2_generate_skill_youtube_stream_with_empty_url_list_returns_validation_error():
    url = "http://localhost:8000/api/v2/generate-skill/youtube/stream"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "youtube_urls": []
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 422, f"Expected status code 422 but got {response.status_code}"
    try:
        error_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    # Pydantic v2 validation error format:
    # {"type":"string_too_short" or "too_short","loc":["body","fieldname"],"msg": "...", ...}
    # We expect type "too_short" (array too short) and loc = ["body", "youtube_urls"]
    errors = error_json.get("detail") if isinstance(error_json, dict) else None
    assert isinstance(errors, list) and len(errors) > 0, "Validation errors missing or malformed"
    relevant_error_found = False
    for err in errors:
        if (
            isinstance(err, dict) and
            err.get("loc") == ["body", "youtube_urls"] and
            err.get("type") == "too_short"
        ):
            relevant_error_found = True
            break
    assert relevant_error_found, f"Expected Pydantic too_short error for youtube_urls field not found in {errors}"

test_post_api_v2_generate_skill_youtube_stream_with_empty_url_list_returns_validation_error()