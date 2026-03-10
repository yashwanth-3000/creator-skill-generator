import requests

def test_post_api_generate_skill_ai_pipeline_failure():
    base_url = "http://localhost:8000"
    url = f"{base_url}/api/generate-skill"
    headers = {"Content-Type": "application/json"}
    payload = {
        "creator_content": "A" * 40,  # valid content with exact 40 chars to trigger AI pipeline failure simulation
        # Other fields are optional and can be omitted for simplicity
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    assert response.status_code == 500, f"Expected status code 500, got {response.status_code}"
    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Since API returns generic error message on AI pipeline failure, validate presence of message string (non empty)
    error_message = json_data.get("message") or json_data.get("detail") or json_data.get("error") or ""
    assert isinstance(error_message, str) and len(error_message) > 0, "Error message is missing or empty in 500 response"

test_post_api_generate_skill_ai_pipeline_failure()
