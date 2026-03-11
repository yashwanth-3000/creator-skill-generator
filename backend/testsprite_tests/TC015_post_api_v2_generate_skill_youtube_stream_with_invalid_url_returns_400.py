import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_post_api_v2_generate_skill_youtube_stream_invalid_url_returns_400():
    url = f"{BASE_URL}/api/v2/generate-skill/youtube/stream"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "youtube_urls": ["https://not-a-youtube-url.com/watch"]
    }
    response = None
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}, response body: {response.text}"
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

test_post_api_v2_generate_skill_youtube_stream_invalid_url_returns_400()