import requests
import uuid

BASE_URL = "https://creator-skill-backend-production.up.railway.app"
TIMEOUT = 30

def test_delete_skill_and_verify_removal():
    # Create a new skill to ensure the skill exists before deletion
    skill_name = f"test_skill_{uuid.uuid4().hex[:8]}"
    create_payload = {
        "creator_content": "This is a test skill content with more than 40 characters to pass validation.",
        "desired_skill_name": skill_name,
        "persist_to_disk": True,
        "include_zip": True
    }
    try:
        create_response = requests.post(
            f"{BASE_URL}/api/v1/generate-skill",
            json=create_payload,
            timeout=TIMEOUT
        )
        assert create_response.status_code == 200, f"Failed to create skill: {create_response.text}"
        create_data = create_response.json()
        assert create_data.get("skill_name") == skill_name

        # Delete the skill
        delete_response = requests.delete(
            f"{BASE_URL}/api/v1/skills/{skill_name}",
            timeout=TIMEOUT
        )
        assert delete_response.status_code == 200, f"Failed to delete skill: {delete_response.text}"

        # Verify deletion: GET should return 404
        get_response = requests.get(
            f"{BASE_URL}/api/v1/skills/{skill_name}",
            timeout=TIMEOUT
        )
        assert get_response.status_code == 404, f"Skill still exists after deletion: {get_response.text}"
        error_detail = get_response.json().get("detail", "").lower()
        assert "not found" in error_detail, f"Unexpected error detail: {error_detail}"

    finally:
        # Cleanup if skill still exists (in case delete failed)
        requests.delete(
            f"{BASE_URL}/api/v1/skills/{skill_name}",
            timeout=TIMEOUT
        )

test_delete_skill_and_verify_removal()