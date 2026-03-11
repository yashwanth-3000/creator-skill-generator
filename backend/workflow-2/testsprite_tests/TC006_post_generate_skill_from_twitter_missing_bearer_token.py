import requests

def test_post_generate_skill_twitter_missing_bearer_token():
    url = "http://localhost:8001/api/generate-skill/twitter"
    payload = {"twitter_username": "testuser"}
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=5)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    assert isinstance(json_response, dict), "Response JSON is not a dictionary"
    assert "message" in json_response, "Response JSON missing 'message' key"
    assert json_response["message"] == "X_BEARER_TOKEN not configured", f"Unexpected message: {json_response.get('message')}"

test_post_generate_skill_twitter_missing_bearer_token()