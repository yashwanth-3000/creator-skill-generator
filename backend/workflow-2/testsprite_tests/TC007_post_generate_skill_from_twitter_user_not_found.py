import requests
import time

BASE_URL = "http://localhost:8001"
TIMEOUT_SECONDS = 5

def test_post_generate_skill_twitter_user_not_found():
    url = f"{BASE_URL}/api/generate-skill/twitter"
    # Use a non-existent twitter_username under 15 chars to meet validation but simulate not found
    payload = {
        "twitter_username": "zzznotreal99"
    }
    headers = {
        "Content-Type": "application/json"
    }
    start_time = time.time()
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT_SECONDS)
    except requests.exceptions.Timeout:
        assert False, "Request timed out, must complete under 5 seconds"
    elapsed = time.time() - start_time
    assert elapsed < TIMEOUT_SECONDS, f"Test exceeded time limit of {TIMEOUT_SECONDS} seconds"
    # The expected response status code is 502 indicating upstream X API error for user not found
    assert response.status_code == 502, f"Expected status code 502 but got {response.status_code}"
    # Response JSON body should contain detail with indication of not found error
    try:
        body = response.json()
    except Exception:
        assert False, "Response is not valid JSON"

    detail = body.get("detail", "") or body.get("message", "")
    assert isinstance(detail, str) and "not found" in detail.lower(), "Expected error detail to contain 'not found'"

test_post_generate_skill_twitter_user_not_found()