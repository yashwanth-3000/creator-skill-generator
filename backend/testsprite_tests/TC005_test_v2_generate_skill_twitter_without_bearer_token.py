import requests

BASE_URL = "https://creator-skill-backend-production.up.railway.app"
TIMEOUT = 30

def test_v2_generate_skill_twitter_without_bearer_token():
    url = f"{BASE_URL}/api/v2/generate-skill/twitter"
    payload = {
        "twitter_username": "validuser"
    }
    headers = {
        # Intentionally NOT setting X_BEARER_TOKEN to test missing token scenario
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Expect HTTP 400 Bad Request
    assert response.status_code == 400, (
        f"Expected 400 status code for missing bearer token, got {response.status_code}; Response: {response.text}"
    )

    # Validate response message contains indication of missing token or no tweets found
    response_text = response.text.lower()
    assert ("x_bearer_token not configured" in response_text) or ("no tweets found" in response_text), (
        f"Response did not indicate missing token or no tweets found. Response text: {response.text}"
    )

test_v2_generate_skill_twitter_without_bearer_token()
