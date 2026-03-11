import requests

def test_post_generate_skill_short_creator_content_validation_error():
    base_url = "http://localhost:8001"
    url = f"{base_url}/api/generate-skill"
    payload = {
        "creator_content": "short"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=5)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 422, f"Expected status code 422, got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    # Validate Pydantic v2 style validation error for string_too_short on creator_content
    # Structure expected (example):
    # {
    #   "detail": [
    #       {
    #           "type": "string_too_short",
    #           "loc": ["body", "creator_content"],
    #           "msg": "ensure this value has at least 40 characters",
    #           "input": "short",
    #           "ctx": {"min_length": 40}
    #       }
    #   ]
    # }
    assert "detail" in json_resp, "Response JSON missing 'detail' field"
    details = json_resp["detail"]
    assert isinstance(details, list) and len(details) > 0, "'detail' is not a non-empty list"
    found_error = False
    for error in details:
        if (
            isinstance(error, dict)
            and error.get("type") == "string_too_short"
            and error.get("loc") == ["body", "creator_content"]
        ):
            found_error = True
            break
    assert found_error, "Expected validation error for 'creator_content' with type 'string_too_short' and loc ['body', 'creator_content'] not found"

test_post_generate_skill_short_creator_content_validation_error()