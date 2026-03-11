import requests

BASE_URL = "https://creator-skill-backend-production.up.railway.app"
TIMEOUT = 30


def test_v2_generate_skill_youtube_with_empty_url_list():
    url = f"{BASE_URL}/api/v2/generate-skill/youtube"
    headers = {"Content-Type": "application/json"}
    payload = {"youtube_urls": []}

    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)

    assert response.status_code == 422, f"Expected status 422 but got {response.status_code}"
    json_resp = response.json()
    assert isinstance(json_resp, dict), "Response is not a JSON object"
    # Pydantic v2 uses error type "too_short" for min_items violations
    errors = json_resp.get("detail") or json_resp.get("errors") or []
    assert any(
        error.get("type") == "too_short" 
        for error in errors if isinstance(error, dict)
    ), "Expected a 'too_short' Pydantic validation error in the response"


test_v2_generate_skill_youtube_with_empty_url_list()