from __future__ import annotations

import logging
import shutil
import sys

import uvicorn

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s: %(message)s",
    stream=sys.stdout,
)
from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse

from app.config import get_settings
from app.schemas import (
    ExportFileRequest,
    GenerateSkillRequest,
    GenerateSkillResponse,
    TwitterSkillRequest,
    YouTubeSkillRequest,
)
from app.service import SkillGenerationService
from app.twitter_client import XApiError, fetch_tweets
from app.youtube_client import YouTubeError, fetch_transcripts

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "Generate Codex / Claude Code skill packages from creator content.\n\n"
        "- **v1** — paste raw content and generate a skill\n"
        "- **v2** — same as v1 plus Twitter and YouTube integrations"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PathTraversalGuard(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        raw = request.scope.get("path", "")
        if ".." in raw:
            return JSONResponse(status_code=400, content={"detail": "Invalid path"})
        return await call_next(request)


app.add_middleware(PathTraversalGuard)


# ---------------------------------------------------------------------------
# Shared handler helpers
# ---------------------------------------------------------------------------

def _build_service() -> SkillGenerationService:
    return SkillGenerationService(settings)


def _resolve_skill_dir(skill_name: str):
    """Return the skill directory Path, or raise 404."""
    skill_dir = settings.skill_output_dir / skill_name
    if not skill_dir.exists() or not skill_dir.is_dir():
        raise HTTPException(status_code=404, detail=f"Skill '{skill_name}' not found")
    return skill_dir


def _skill_summary(skill_dir) -> dict:
    """Build a summary dict for a single skill directory."""
    skill_md = skill_dir / "SKILL.md"
    has_zip = skill_dir.with_suffix(".zip").exists()
    file_list = sorted(skill_dir.rglob("*"))
    return {
        "name": skill_dir.name,
        "has_skill_md": skill_md.exists(),
        "has_zip": has_zip,
        "file_count": sum(1 for f in file_list if f.is_file()),
        "files": [
            {
                "relative_path": str(f.relative_to(skill_dir)),
                "size_bytes": f.stat().st_size,
            }
            for f in file_list
            if f.is_file()
        ],
    }


def _skill_detail(skill_dir) -> dict:
    """Build a full detail dict for a single skill — includes file contents."""
    skill_md = skill_dir / "SKILL.md"
    has_zip = skill_dir.with_suffix(".zip").exists()
    file_list = sorted(skill_dir.rglob("*"))
    return {
        "name": skill_dir.name,
        "has_skill_md": skill_md.exists(),
        "has_zip": has_zip,
        "files": [
            {
                "relative_path": str(f.relative_to(skill_dir)),
                "content": f.read_text(encoding="utf-8", errors="replace"),
            }
            for f in file_list
            if f.is_file()
        ],
    }


# ---------------------------------------------------------------------------
# Shared route handlers
# ---------------------------------------------------------------------------

def _generate_skill(request: GenerateSkillRequest) -> GenerateSkillResponse:
    try:
        return _build_service().generate(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


def _generate_skill_from_twitter(request: TwitterSkillRequest):
    if not settings.x_bearer_token:
        raise HTTPException(
            status_code=400,
            detail="X_BEARER_TOKEN is not configured on the server",
        )
    try:
        tweet_text, metadata = fetch_tweets(
            username=request.twitter_username,
            bearer_token=settings.x_bearer_token,
        )
    except XApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not tweet_text:
        raise HTTPException(
            status_code=400,
            detail=f"No tweets found for @{request.twitter_username}",
        )

    gen_request = GenerateSkillRequest(
        creator_content=tweet_text,
        content_kind="twitter-threads",
        creator_name=request.twitter_username,
        desired_skill_name=request.desired_skill_name,
        target_outcome=request.target_outcome,
        audience=request.audience,
        include_openai_yaml=request.include_openai_yaml,
        persist_to_disk=request.persist_to_disk,
        include_zip=request.include_zip,
    )
    try:
        result = _build_service().generate(gen_request)
        result.source_metadata = metadata
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


def _sse_response(service: SkillGenerationService, gen_request: GenerateSkillRequest):
    """Wrap generate_streaming in a StreamingResponse."""
    async def event_stream():
        async for chunk in service.generate_streaming(gen_request):
            yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _stream_generate_skill(request: GenerateSkillRequest):
    """SSE endpoint: streams real-time progress events during raw-paste skill generation."""
    return _sse_response(_build_service(), request)


async def _stream_generate_skill_from_twitter(request: TwitterSkillRequest):
    """SSE endpoint: streams real-time progress events during Twitter skill generation."""
    if not settings.x_bearer_token:
        raise HTTPException(
            status_code=400,
            detail="X_BEARER_TOKEN is not configured on the server",
        )
    try:
        tweet_text, metadata = fetch_tweets(
            username=request.twitter_username,
            bearer_token=settings.x_bearer_token,
        )
    except XApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not tweet_text:
        raise HTTPException(
            status_code=400,
            detail=f"No tweets found for @{request.twitter_username}",
        )

    gen_request = GenerateSkillRequest(
        creator_content=tweet_text,
        content_kind="twitter-threads",
        creator_name=request.twitter_username,
        desired_skill_name=request.desired_skill_name,
        target_outcome=request.target_outcome,
        audience=request.audience,
        include_openai_yaml=request.include_openai_yaml,
        persist_to_disk=request.persist_to_disk,
        include_zip=request.include_zip,
    )

    return _sse_response(_build_service(), gen_request)


async def _stream_generate_skill_from_youtube(request: YouTubeSkillRequest):
    """SSE endpoint: streams real-time progress events during YouTube skill generation."""
    try:
        transcript_text, metadata, warnings = fetch_transcripts(request.youtube_urls)
    except YouTubeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    gen_request = GenerateSkillRequest(
        creator_content=transcript_text,
        content_kind="youtube-script",
        desired_skill_name=request.desired_skill_name,
        target_outcome=request.target_outcome,
        audience=request.audience,
        include_openai_yaml=request.include_openai_yaml,
        persist_to_disk=request.persist_to_disk,
        include_zip=request.include_zip,
    )

    return _sse_response(_build_service(), gen_request)


def _generate_skill_from_youtube(request: YouTubeSkillRequest):
    try:
        transcript_text, metadata, warnings = fetch_transcripts(request.youtube_urls)
    except YouTubeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    gen_request = GenerateSkillRequest(
        creator_content=transcript_text,
        content_kind="youtube-script",
        desired_skill_name=request.desired_skill_name,
        target_outcome=request.target_outcome,
        audience=request.audience,
        include_openai_yaml=request.include_openai_yaml,
        persist_to_disk=request.persist_to_disk,
        include_zip=request.include_zip,
    )
    try:
        result = _build_service().generate(gen_request)
        result.source_metadata = metadata
        result.warnings.extend(warnings)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


def _list_skills() -> dict:
    output_dir = settings.skill_output_dir
    skills = []
    if output_dir.exists():
        for entry in sorted(output_dir.iterdir()):
            if entry.is_dir():
                skills.append(_skill_summary(entry))
    return {"skills": skills, "count": len(skills)}


def _get_skill(skill_name: str) -> dict:
    skill_dir = _resolve_skill_dir(skill_name)
    return _skill_detail(skill_dir)


def _delete_skill(skill_name: str) -> dict:
    skill_dir = _resolve_skill_dir(skill_name)
    zip_path = skill_dir.with_suffix(".zip")
    shutil.rmtree(skill_dir)
    if zip_path.exists():
        zip_path.unlink()
    return {"deleted": skill_name}


def _export_zip(skill_name: str) -> FileResponse:
    zip_path = settings.skill_output_dir / f"{skill_name}.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail=f"Zip not found for skill '{skill_name}'")
    return FileResponse(path=str(zip_path), media_type="application/zip", filename=f"{skill_name}.zip")


def _export_file(skill_name: str, file_path: str) -> FileResponse:
    if ".." in file_path or file_path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid path")
    target = (settings.skill_output_dir / skill_name / file_path).resolve()
    skill_root = settings.skill_output_dir.resolve()
    if not str(target).startswith(str(skill_root)):
        raise HTTPException(status_code=400, detail="Invalid path")
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    return FileResponse(
        path=str(target),
        media_type="text/markdown" if target.suffix == ".md" else "text/plain",
        filename=target.name,
    )


def _copy_file_content(request: ExportFileRequest) -> JSONResponse:
    if ".." in request.file_path or request.file_path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid path")
    target = (settings.skill_output_dir / request.skill_name / request.file_path).resolve()
    skill_root = settings.skill_output_dir.resolve()
    if not str(target).startswith(str(skill_root)):
        raise HTTPException(status_code=400, detail="Invalid path")
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail=f"File not found: {request.file_path}")
    content = target.read_text(encoding="utf-8")
    return JSONResponse({"content": content, "file_path": request.file_path})


# ---------------------------------------------------------------------------
# Root endpoints (not versioned)
# ---------------------------------------------------------------------------

@app.get("/", tags=["Root"], summary="Service info")
def root():
    return {
        "service": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
        "workflows": {
            "v1": {"prefix": "/api/v1", "description": "Raw paste workflow"},
            "v2": {"prefix": "/api/v2", "description": "Twitter + YouTube + raw paste"},
        },
        "endpoints": {
            "health": "GET /api/health",
            "v1_generate": "POST /api/v1/generate-skill",
            "v2_generate": "POST /api/v2/generate-skill",
            "v2_twitter": "POST /api/v2/generate-skill/twitter",
            "v2_youtube": "POST /api/v2/generate-skill/youtube",
            "list_skills": "GET /api/v1/skills  or  GET /api/v2/skills",
            "get_skill": "GET /api/v1/skills/{name}  or  GET /api/v2/skills/{name}",
            "delete_skill": "DELETE /api/v1/skills/{name}  or  DELETE /api/v2/skills/{name}",
            "export_zip": "GET /api/v1/export/{name}/zip",
            "export_file": "GET /api/v1/export/{name}/{file_path}",
            "copy_content": "POST /api/v1/export/copy",
        },
    }


@app.get("/api/health", tags=["Root"], summary="Health check")
def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": "1.0.0",
    }



# ---------------------------------------------------------------------------
# V1 Router — raw paste workflow
# ---------------------------------------------------------------------------

v1 = APIRouter(prefix="/api/v1", tags=["v1 — Raw Paste"])

v1.add_api_route(
    "/generate-skill", _generate_skill,
    methods=["POST"], response_model=GenerateSkillResponse,
    summary="Generate skill from pasted content",
    description="Paste raw creator content (min 40 chars). CrewAI analyzes patterns and generates a full SKILL.md package.",
)
v1.add_api_route(
    "/generate-skill/stream", _stream_generate_skill,
    methods=["POST"],
    summary="Generate skill from pasted content (SSE stream)",
    description="Same as /generate-skill but streams real-time progress events via Server-Sent Events.",
)
v1.add_api_route(
    "/skills", _list_skills,
    methods=["GET"],
    summary="List all generated skills",
    description="Returns a summary of every generated skill package (name, file list, sizes). Does not include file contents — use GET /skills/{name} for that.",
)
v1.add_api_route(
    "/skills/{skill_name}", _get_skill,
    methods=["GET"],
    summary="Get skill details with file contents",
    description="Returns full detail for a single skill including all file contents.",
)
v1.add_api_route(
    "/skills/{skill_name}", _delete_skill,
    methods=["DELETE"],
    summary="Delete a generated skill",
    description="Permanently removes a skill directory and its zip archive.",
)
v1.add_api_route(
    "/export/{skill_name}/zip", _export_zip,
    methods=["GET"],
    summary="Download skill as zip",
)
v1.add_api_route(
    "/export/{skill_name}/{file_path:path}", _export_file,
    methods=["GET"],
    summary="Download a single file from a skill",
)
v1.add_api_route(
    "/export/copy", _copy_file_content,
    methods=["POST"],
    summary="Get raw file content for clipboard copy",
)

app.include_router(v1)


# ---------------------------------------------------------------------------
# V2 Router — twitter + youtube + raw paste
# ---------------------------------------------------------------------------

v2 = APIRouter(prefix="/api/v2", tags=["v2 — Twitter + YouTube"])

v2.add_api_route(
    "/generate-skill", _generate_skill,
    methods=["POST"], response_model=GenerateSkillResponse,
    summary="Generate skill from pasted content",
)
v2.add_api_route(
    "/generate-skill/stream", _stream_generate_skill,
    methods=["POST"],
    summary="Generate skill from pasted content (SSE stream)",
)
v2.add_api_route(
    "/generate-skill/twitter", _generate_skill_from_twitter,
    methods=["POST"], response_model=GenerateSkillResponse,
    summary="Generate skill from Twitter/X user",
    description="Fetches the last 25 original tweets (no retweets) for the given username and generates a skill from them. Requires X_BEARER_TOKEN on the server.",
)
v2.add_api_route(
    "/generate-skill/twitter/stream", _stream_generate_skill_from_twitter,
    methods=["POST"],
    summary="Generate skill from Twitter/X user (SSE stream)",
    description="Same as /twitter but streams real-time progress events via Server-Sent Events.",
)
v2.add_api_route(
    "/generate-skill/youtube", _generate_skill_from_youtube,
    methods=["POST"], response_model=GenerateSkillResponse,
    summary="Generate skill from YouTube videos",
    description="Fetches transcripts from the provided YouTube URLs and generates a skill from the combined transcript text.",
)
v2.add_api_route(
    "/generate-skill/youtube/stream", _stream_generate_skill_from_youtube,
    methods=["POST"],
    summary="Generate skill from YouTube videos (SSE stream)",
    description="Same as /youtube but streams real-time progress events via Server-Sent Events.",
)
v2.add_api_route(
    "/skills", _list_skills,
    methods=["GET"],
    summary="List all generated skills",
)
v2.add_api_route(
    "/skills/{skill_name}", _get_skill,
    methods=["GET"],
    summary="Get skill details with file contents",
)
v2.add_api_route(
    "/skills/{skill_name}", _delete_skill,
    methods=["DELETE"],
    summary="Delete a generated skill",
)
v2.add_api_route(
    "/export/{skill_name}/zip", _export_zip,
    methods=["GET"],
    summary="Download skill as zip",
)
v2.add_api_route(
    "/export/{skill_name}/{file_path:path}", _export_file,
    methods=["GET"],
    summary="Download a single file from a skill",
)
v2.add_api_route(
    "/export/copy", _copy_file_content,
    methods=["POST"],
    summary="Get raw file content for clipboard copy",
)

app.include_router(v2)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
