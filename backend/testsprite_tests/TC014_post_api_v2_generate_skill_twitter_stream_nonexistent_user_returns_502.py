import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_post_api_v2_generate_skill_twitter_stream_nonexistent_user_returns_502():
    url = f"{BASE_URL}/api/v2/generate-skill/twitter/stream"
    payload = {"twitter_username": "nonexistent"}
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT, stream=True)
        # Read all content to avoid premature termination
        content = response.raw.read(decode_content=True).decode('utf-8', errors='replace')
    except RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 502, f"Expected status code 502 but got {response.status_code}"
    content_lower = content.lower()
    assert "user" in content_lower or "not found" in content_lower or "error" in content_lower, "Response body does not indicate user not found or error"

test_post_api_v2_generate_skill_twitter_stream_nonexistent_user_returns_502()