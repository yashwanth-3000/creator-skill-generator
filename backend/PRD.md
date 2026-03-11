# Unified Creator Skill Backend — PRD

## Overview
A single FastAPI server that serves two workflow versions for generating AI skill packages from creator content using CrewAI.

- **V1** (`/api/v1`) — raw paste workflow: user pastes creator content, system generates a SKILL.md package
- **V2** (`/api/v2`) — same as V1 plus Twitter/X integration (fetch 25 tweets) and YouTube integration (fetch transcripts)

## API Endpoints

### Root (unversioned)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info with endpoint map |
| GET | `/api/health` | Health check — returns `{"status":"ok"}` |

### V1 — Raw Paste Workflow
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/generate-skill` | Generate skill from pasted content (min 40 chars) |
| GET | `/api/v1/skills` | List all generated skills (summaries with file sizes) |
| GET | `/api/v1/skills/{name}` | Get single skill detail with file contents |
| DELETE | `/api/v1/skills/{name}` | Delete a generated skill and its zip |
| GET | `/api/v1/export/{name}/zip` | Download skill as zip archive |
| GET | `/api/v1/export/{name}/{file_path}` | Download a single file from a skill |
| POST | `/api/v1/export/copy` | Get raw file content for clipboard copy |

### V2 — Twitter + YouTube + Raw Paste
All V1 endpoints plus:
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v2/generate-skill/twitter` | Generate skill from Twitter user's last 25 tweets |
| POST | `/api/v2/generate-skill/youtube` | Generate skill from YouTube video transcripts |

## Validation Rules
- `creator_content` must be >= 40 characters (POST generate-skill)
- `twitter_username` must be 1-15 characters (POST generate-skill/twitter)
- `youtube_urls` must have >= 1 URL (POST generate-skill/youtube)
- Path traversal (`..`) is blocked at middleware level (returns 400)
- Missing X_BEARER_TOKEN returns 400 for twitter endpoint

## Error Responses
- 400: Validation errors, path traversal, missing config
- 404: Skill not found, file not found, zip not found
- 422: Pydantic validation errors (malformed request body)
- 500: Internal server error (CrewAI pipeline failure)
- 502: External API error (Twitter/X API failure)

## Success Criteria
- Health check returns 200 with `{"status":"ok"}`
- Root `/` returns service info with all endpoint paths
- Validation rejects bad input with proper error codes
- Skills listing returns correct count and file metadata
- Export endpoints serve files with correct content types
- Path traversal guard blocks `..` in all paths
- Swagger docs accessible at `/docs`
