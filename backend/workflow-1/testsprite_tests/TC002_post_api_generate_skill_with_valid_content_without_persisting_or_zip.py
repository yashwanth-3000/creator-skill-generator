import requests

def test_post_generate_skill_valid_content_no_persist_no_zip():
    base_url = "http://localhost:8000"
    endpoint = "/api/generate-skill"
    url = f"{base_url}{endpoint}"
    headers = {"Content-Type": "application/json"}

    # Valid creator_content with at least 40 characters
    payload = {
        "creator_content": "This is a sample creator content that is definitely more than forty characters long.",
        "persist_to_disk": False,
        "include_zip": False
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        
        data = response.json()
        
        # Validate presence and types of response fields
        assert "skill_name" in data and isinstance(data["skill_name"], str) and data["skill_name"], "skill_name missing or empty"
        assert "output_path" in data and data["output_path"] is None, "output_path should be null"
        assert "zip_path" in data and data["zip_path"] is None, "zip_path should be null"
        
        assert "files" in data and isinstance(data["files"], list) and len(data["files"]) > 0, "files should be a non-empty list"
        for f in data["files"]:
            assert isinstance(f, dict), "Each file entry should be a dict"
            assert "relative_path" in f and isinstance(f["relative_path"], str) and f["relative_path"], "File relative_path missing or empty"
            assert "content" in f and isinstance(f["content"], str), "File content missing or not a string"
        
        assert "warnings" in data and isinstance(data["warnings"], list), "warnings should be a list"
        # According to PRD, warnings may include e.g. 'missing references/examples.md'
        # No strict assertion on empty or non-empty warnings required, just type check
        
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_generate_skill_valid_content_no_persist_no_zip()