from __future__ import annotations

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

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

app = FastAPI(title=settings.app_name, version="0.4.0")

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
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid path"},
            )
        return await call_next(request)


app.add_middleware(PathTraversalGuard)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "POST /api/generate-skill with creator content"}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.post("/api/generate-skill", response_model=GenerateSkillResponse)
def generate_skill(request: GenerateSkillRequest) -> GenerateSkillResponse:
    try:
        service = SkillGenerationService(settings)
        return service.generate(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/generate-skill/twitter", response_model=GenerateSkillResponse)
def generate_skill_from_twitter(request: TwitterSkillRequest) -> GenerateSkillResponse:
    """Fetch recent tweets for a user and generate a skill from them."""
    if not settings.x_bearer_token:
        return JSONResponse(
            status_code=400,
            content={
                "detail": "X_BEARER_TOKEN is not configured on the server",
                "message": "X_BEARER_TOKEN not configured",
            },
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
        service = SkillGenerationService(settings)
        result = service.generate(gen_request)
        result.source_metadata = metadata
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/generate-skill/youtube", response_model=GenerateSkillResponse)
def generate_skill_from_youtube(request: YouTubeSkillRequest) -> GenerateSkillResponse:
    """Fetch YouTube transcripts and generate a skill from them."""
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
        service = SkillGenerationService(settings)
        result = service.generate(gen_request)
        result.source_metadata = metadata
        result.warnings.extend(warnings)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/export/{skill_name}/zip")
def export_zip(skill_name: str) -> FileResponse:
    """Download the generated skill package as a zip file."""
    zip_path = settings.skill_output_dir / f"{skill_name}.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail=f"Zip not found for skill '{skill_name}'")
    return FileResponse(
        path=str(zip_path),
        media_type="application/zip",
        filename=f"{skill_name}.zip",
    )


@app.get("/api/export/{skill_name}/{file_path:path}")
def export_file(skill_name: str, file_path: str) -> FileResponse:
    """Download a single file from a generated skill package."""
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


@app.get("/api/skills")
def list_skills() -> dict:
    """List all generated skill packages."""
    output_dir = settings.skill_output_dir
    skills = []
    if output_dir.exists():
        for entry in sorted(output_dir.iterdir()):
            if entry.is_dir():
                skill_md = entry / "SKILL.md"
                has_zip = (entry.with_suffix(".zip")).exists()
                skills.append({
                    "name": entry.name,
                    "has_skill_md": skill_md.exists(),
                    "has_zip": has_zip,
                    "files": [
                        {
                            "relative_path": str(f.relative_to(entry)),
                            "content": f.read_text(encoding="utf-8", errors="replace"),
                        }
                        for f in sorted(entry.rglob("*"))
                        if f.is_file()
                    ],
                })
    return {"skills": skills}


@app.post("/api/export/copy")
def copy_file_content(request: ExportFileRequest) -> JSONResponse:
    """Return raw file content for clipboard copy."""
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


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
