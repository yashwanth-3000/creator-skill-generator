import requests

def test_get_root_internal_server_error():
    base_url = "http://localhost:8000"
    try:
        response = requests.get(f"{base_url}/", timeout=30)
        # We expect a 500 Internal Server Error status code for this test case.
        assert response.status_code == 500, f"Expected status code 500, got {response.status_code}"
    except requests.RequestException as e:
        # Fail the test if there's a request error
        assert False, f"Request failed: {e}"

test_get_root_internal_server_error()