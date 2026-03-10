import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_post_generate_skill_include_zip_and_verify_zip_download_not_found():
    post_url = f"{BASE_URL}/api/generate-skill"
    headers = {"Content-Type": "application/json"}
    payload = {
        "creator_content": "This is a sample creator content that meets the minimum length requirement for generating a skill package.",
        "include_zip": True
    }

    # Step 1: POST request to generate skill with include_zip true
    try:
        response_post = requests.post(post_url, json=payload, headers=headers, timeout=TIMEOUT)
        response_post.raise_for_status()
    except requests.RequestException as e:
        assert False, f"POST /api/generate-skill request failed: {e}"

    # Validate POST response
    assert response_post.status_code == 200, f"Expected status code 200 but got {response_post.status_code}"
    json_post = response_post.json()
    assert "skill_name" in json_post, "Response missing 'skill_name'"
    assert "zip_path" in json_post, "Response missing 'zip_path'"
    assert json_post["zip_path"], "'zip_path' should not be null or empty when include_zip is true"
    assert "files" in json_post and isinstance(json_post["files"], list), "'files' missing or not a list"
    assert "warnings" in json_post and isinstance(json_post["warnings"], list), "'warnings' missing or not a list"

    zip_path = json_post["zip_path"]
    # Step 2: Attempt to GET the generated zip file path (expected 404)
    get_url = f"{BASE_URL}/api/download/{zip_path}"
    try:
        response_get = requests.get(get_url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"GET {get_url} request failed: {e}"

    assert response_get.status_code == 404, (
        f"Expected 404 Not Found for GET {get_url} but got {response_get.status_code}"
    )

test_post_generate_skill_include_zip_and_verify_zip_download_not_found()
