# Workflow-2: Twitter + YouTube Skill Generator

## Problem
Content creators and skill authors want to generate AI agent skill packages from existing content — but manually copying and pasting tweets or video transcripts is tedious. Workflow-2 automates content ingestion from Twitter/X and YouTube.

## Solution
A FastAPI backend that fetches content from Twitter (via X API v2) or YouTube (via transcript extraction), then runs it through a CrewAI pipeline to generate complete skill packages.

## Core Workflows

### 1. Generate Skill from Twitter
- User provides a Twitter/X username
- Backend resolves the username via X API v2 (`GET /2/users/by/username/{username}`)
- Backend fetches the last 25 original tweets (excluding retweets) via X API v2
- Tweets are combined and passed to CrewAI skill generation pipeline
- Returns generated skill files + source metadata (username, tweet count, tweet IDs)

### 2. Generate Skill from YouTube
- User provides one or more YouTube video URLs
- Backend extracts video IDs and fetches transcripts (no API key needed)
- Transcripts are combined and passed to CrewAI skill generation pipeline
- Returns generated skill files + source metadata (video count, video IDs) + warnings for failed videos

### 3. Generate Skill from Raw Content (inherited from workflow-1)
- User pastes raw creator content directly
- Content is passed to CrewAI pipeline
- Returns generated skill files

### 4. Export & List
- `GET /api/export/{skill_name}/zip` — download skill package as zip
- `GET /api/export/{skill_name}/{file_path}` — download single file
- `POST /api/export/copy` — get raw file content for clipboard copy
- `GET /api/skills` — list all generated skill packages with file contents

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Root — returns usage info |
| GET | `/api/health` | Health check |
| POST | `/api/generate-skill` | Generate from raw pasted content |
| POST | `/api/generate-skill/twitter` | Generate from Twitter username |
| POST | `/api/generate-skill/youtube` | Generate from YouTube URLs |
| GET | `/api/skills` | List all generated skills |
| GET | `/api/export/{skill_name}/zip` | Download skill zip |
| GET | `/api/export/{skill_name}/{file_path}` | Download single file |
| POST | `/api/export/copy` | Copy file content |

## Validation Rules

### Twitter Endpoint
- `twitter_username`: required, 1-15 chars, stripped of leading `@`
- Returns 400 if `X_BEARER_TOKEN` not configured on server
- Returns 502 if X API call fails (auth error, user not found, rate limit)
- Returns 400 if user has zero tweets

### YouTube Endpoint
- `youtube_urls`: required, at least 1 URL
- Supports URL formats: `watch?v=`, `youtu.be/`, `shorts/`, `embed/`
- Invalid URLs are skipped with warnings
- Returns 400 if no transcripts could be fetched from any video

### Raw Content Endpoint
- `creator_content`: required, minimum 40 characters

### Export Endpoints
- Path traversal protection: `..` patterns blocked with 400
- Missing files return 404

## Success Criteria
- Twitter endpoint fetches real tweets and generates a skill package
- YouTube endpoint extracts real transcripts and generates a skill package
- Source metadata is included in response
- Warnings are returned for partially failed operations
- All export endpoints from workflow-1 continue working
- Path traversal protection remains active
