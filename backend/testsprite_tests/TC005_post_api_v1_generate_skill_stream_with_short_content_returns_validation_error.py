import requests

def test_post_api_v1_generate_skill_stream_with_short_content_returns_validation_error():
    base_url = "http://localhost:8000"
    url = f"{base_url}/api/v1/generate-skill/stream"
    headers = {
        "Accept": "text/event-stream",
        "Content-Type": "application/json"
    }
    payload = {
        "creator_content": "short content less than 40 chars"
    }
    timeout = 30

    response = requests.post(url, json=payload, headers=headers, timeout=timeout)

    assert response.status_code == 422, f"Unexpected status code: {response.status_code}, body: {response.text}"

    # Validate Pydantic v2 validation error structure
    error_json = response.json()
    assert "detail" in error_json and isinstance(error_json["detail"], list) and len(error_json["detail"]) > 0, "Response missing valid 'detail' list"

    # The loc should be ["body", "creator_content"] among the error entries
    found = False
    for err in error_json["detail"]:
        if "type" in err and err["type"] == "string_too_short":
            loc = err.get("loc", [])
            if loc == ["body", "creator_content"]:
                found = True
                break
    assert found, "Expected validation error for 'creator_content' with type 'string_too_short' and loc ['body', 'creator_content'] not found"

test_post_api_v1_generate_skill_stream_with_short_content_returns_validation_error()
