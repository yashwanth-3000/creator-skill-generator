import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def test_post_api_generate_skill_with_valid_content_and_all_options():
    url = f"{BASE_URL}/api/generate-skill"
    payload = {
        "creator_content": (
            "This is a sample creator content that is deliberately made longer "
            "than forty characters to meet API validation requirements."
        ),
        "content_kind": "generic",
        "desired_skill_name": "MySkill",
        "include_openai_yaml": True,
        "persist_to_disk": True,
        "include_zip": True,
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed with exception: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON."

    # Validate required keys in response
    expected_keys = {"skill_name", "output_path", "zip_path", "files", "warnings"}
    assert expected_keys.issubset(data.keys()), f"Response JSON missing keys: {expected_keys - data.keys()}"

    # Validate skill_name matches desired_skill_name
    assert data["skill_name"] == payload["desired_skill_name"], f"Expected skill_name '{payload['desired_skill_name']}', got '{data['skill_name']}'"

    # Validate output_path and zip_path are non-null strings
    assert isinstance(data["output_path"], str) and len(data["output_path"]) > 0, "output_path should be a non-empty string"
    assert isinstance(data["zip_path"], str) and len(data["zip_path"]) > 0, "zip_path should be a non-empty string"

    # Validate files is a list of dicts with relative_path and content
    assert isinstance(data["files"], list), "files should be a list"
    assert len(data["files"]) > 0, "files list should not be empty"
    for file in data["files"]:
        assert isinstance(file, dict), "each file should be a dict"
        assert "relative_path" in file, "file dict missing 'relative_path'"
        assert "content" in file, "file dict missing 'content'"
        assert isinstance(file["relative_path"], str) and len(file["relative_path"]) > 0, "'relative_path' should be a non-empty string"
        assert isinstance(file["content"], str), "'content' should be a string"

    # Validate warnings is an empty list
    assert isinstance(data["warnings"], list), "warnings should be a list"
    assert len(data["warnings"]) == 0, f"Expected no warnings, but got: {data['warnings']}"


test_post_api_generate_skill_with_valid_content_and_all_options()