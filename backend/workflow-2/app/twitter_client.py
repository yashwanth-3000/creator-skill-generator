from __future__ import annotations

import httpx


class XApiError(Exception):
    pass


_BASE = "https://api.twitter.com/2"
_TIMEOUT = 15.0


def fetch_tweets(
    username: str,
    bearer_token: str,
    max_results: int = 25,
) -> tuple[str, dict]:
    """Fetch recent original tweets (no retweets) for a public user.

    Returns (combined_tweet_text, metadata_dict).
    Raises XApiError on any X API failure.
    """
    username = username.lstrip("@").strip()
    if not username:
        raise XApiError("Username cannot be empty")

    headers = {"Authorization": f"Bearer {bearer_token}"}

    with httpx.Client(timeout=_TIMEOUT) as client:
        user_id, display_name = _resolve_user(client, headers, username)
        tweets, meta = _get_timeline(client, headers, user_id, max_results)

    if not tweets:
        combined = ""
        metadata = {
            "source": "twitter",
            "username": username,
            "display_name": display_name,
            "tweet_count": 0,
        }
        return combined, metadata

    combined = "\n\n".join(
        f"[Tweet {i + 1}] {t['text']}" for i, t in enumerate(tweets)
    )

    metadata = {
        "source": "twitter",
        "username": username,
        "display_name": display_name,
        "tweet_count": len(tweets),
        "newest_id": meta.get("newest_id"),
        "oldest_id": meta.get("oldest_id"),
    }

    return combined, metadata


def _resolve_user(
    client: httpx.Client,
    headers: dict,
    username: str,
) -> tuple[str, str]:
    """GET /2/users/by/username/{username} → (user_id, display_name)."""
    resp = client.get(
        f"{_BASE}/users/by/username/{username}",
        headers=headers,
    )
    _check_response(resp, context=f"user lookup for @{username}")
    data = resp.json().get("data")
    if not data:
        raise XApiError(f"User not found: @{username}")
    return data["id"], data.get("name", username)


def _get_timeline(
    client: httpx.Client,
    headers: dict,
    user_id: str,
    max_results: int,
) -> tuple[list[dict], dict]:
    """GET /2/users/{id}/tweets?exclude=retweets → (tweets_list, meta)."""
    resp = client.get(
        f"{_BASE}/users/{user_id}/tweets",
        headers=headers,
        params={
            "exclude": "retweets",
            "max_results": min(max(max_results, 5), 100),
            "tweet.fields": "created_at,text",
        },
    )
    _check_response(resp, context="timeline fetch")
    body = resp.json()
    tweets = body.get("data", [])
    meta = body.get("meta", {})
    return tweets, meta


def _check_response(resp: httpx.Response, context: str) -> None:
    if resp.status_code == 200:
        return
    if resp.status_code in (401, 403):
        raise XApiError("Invalid or expired X Bearer Token")
    if resp.status_code == 404:
        raise XApiError(f"User not found ({context})")
    if resp.status_code == 429:
        raise XApiError(
            "X API rate limit exceeded. Check your credit balance in the Developer Console."
        )
    raise XApiError(
        f"X API error during {context}: {resp.status_code} — {resp.text[:200]}"
    )
