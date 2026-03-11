from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled,
)


class YouTubeError(Exception):
    pass


_VIDEO_ID_RE = re.compile(
    r"(?:v=|youtu\.be/|shorts/|embed/)([a-zA-Z0-9_-]{11})"
)


def fetch_transcripts(urls: list[str]) -> tuple[str, dict, list[str]]:
    """Fetch and combine transcripts from a list of YouTube URLs.

    Returns (combined_text, metadata_dict, warnings_list).
    Raises YouTubeError if no transcripts could be fetched at all.
    """
    video_ids: list[str] = []
    warnings: list[str] = []

    for url in urls:
        vid = _extract_video_id(url)
        if vid:
            video_ids.append(vid)
        else:
            warnings.append(f"Could not extract video ID from URL: {url}")

    if not video_ids:
        raise YouTubeError("No valid YouTube URLs provided")

    ytt = YouTubeTranscriptApi()
    transcripts: list[str] = []
    fetched_ids: list[str] = []

    for vid in video_ids:
        try:
            result = ytt.fetch(vid)
            text = " ".join(snippet.text for snippet in result)
            transcripts.append(text)
            fetched_ids.append(vid)
        except TranscriptsDisabled:
            warnings.append(f"Captions disabled for video {vid}")
        except NoTranscriptFound:
            warnings.append(f"No transcript found for video {vid}")
        except Exception as exc:
            warnings.append(f"Failed to fetch transcript for {vid}: {exc}")

    if not transcripts:
        raise YouTubeError(
            "No transcripts could be fetched from any of the provided videos"
        )

    combined = "\n\n".join(
        f"--- Video {i + 1} (ID: {fetched_ids[i]}) ---\n{t}"
        for i, t in enumerate(transcripts)
    )

    metadata = {
        "source": "youtube",
        "video_count": len(fetched_ids),
        "video_ids": fetched_ids,
        "urls_provided": len(urls),
    }

    return combined, metadata, warnings


def _extract_video_id(url: str) -> str | None:
    """Extract the 11-char video ID from various YouTube URL formats."""
    url = url.strip()

    match = _VIDEO_ID_RE.search(url)
    if match:
        return match.group(1)

    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    if "youtube.com" in hostname:
        qs = parse_qs(parsed.query)
        v = qs.get("v")
        if v and len(v[0]) == 11:
            return v[0]

    if len(url) == 11 and re.match(r"^[a-zA-Z0-9_-]+$", url):
        return url

    return None
