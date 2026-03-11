# Creator Skill Backend

This directory contains the main unified backend for Creator Skill Generator.

It is the current production-oriented implementation and merges the earlier raw-paste flow and the later Twitter/X + YouTube flow into one FastAPI service.

## What This Backend Is For

This backend generates **skill bundles** for agent tools that use the `SKILL.md` / Agent Skills model.

It generates reusable task packages centered around `SKILL.md`.

## Skills Context

This backend targets the shared Agent Skills model used across tools such as Codex and Claude Code.

The important contract is:

- a skill directory
- a `SKILL.md` entrypoint
- good `name` and `description` metadata
- optional supporting files loaded on demand

## Practical Skill Design Principles

The current official guidance and verified public examples point to a few stable rules:

- each skill should focus on one repeatable task
- the `description` in frontmatter is important for discovery and invocation
- `SKILL.md` should act as the entrypoint, not the entire knowledge base
- heavier material should move into `references/`
- clear constraints and output formats are better than broad motivational prose

That is why this backend is designed to generate one central `SKILL.md` plus reference files, instead of dumping everything into one enormous markdown file.

## Why This Is More Accurate Than A Generic Skill Creator

Codex includes a built-in `$skill-creator`, and Anthropic provides official skill-creation guidance plus an official `skill-creator` skill in its skills ecosystem.

Those are strong starting points when a person wants to author a skill from scratch.

This backend is more accurate for **creator-derived skills** because it starts from source evidence instead of only a manual description:

- raw pasted creator content
- Twitter/X posts
- YouTube transcripts

That lets the backend generate a more grounded package:

- extracted workflow patterns from real material
- constraints inferred from real examples
- references built from the source corpus
- a leaner `SKILL.md` with bulk detail moved into reference files

## What The Backend Generates

From creator input, the backend generates a bundle that can contain:

- `SKILL.md`
- `references/framework.md`
- `references/examples.md`
- `references/sources.md`
- `agents/openai.yaml` when requested

The main artifact is always the skill itself. The reference files support progressive loading and better reuse.

That bundle shape is intentional. It reflects the current best practice for skills: keep the entry file focused and offload bulk detail into supporting files.

## Source Inputs Supported

The unified backend supports three content ingestion modes.

### 1. Raw Content

Users send pasted content directly.

This is the cleanest and most reliable path for:

- local development
- debugging generation quality
- testing the main skill package flow

### 2. Twitter/X User

Users provide a public Twitter/X username.

The backend:

- resolves the user via the X API
- fetches recent original tweets
- combines them into one content block
- generates a skill from that text

### 3. YouTube URLs

Users provide one or more YouTube video URLs.

The backend:

- extracts video IDs
- fetches transcripts
- combines transcript text
- generates a skill from the combined material

## API Layout

The unified server exposes two API versions.

### Root And Service Endpoints

- `GET /`
- `GET /api/health`
- `GET /docs`
- `GET /redoc`

### Version 1: Raw Paste

Prefix: `/api/v1`

- `POST /api/v1/generate-skill`
- `GET /api/v1/skills`
- `GET /api/v1/skills/{skill_name}`
- `DELETE /api/v1/skills/{skill_name}`
- `GET /api/v1/export/{skill_name}/zip`
- `GET /api/v1/export/{skill_name}/{file_path}`
- `POST /api/v1/export/copy`

### Version 2: Raw Paste + Twitter/X + YouTube

Prefix: `/api/v2`

- `POST /api/v2/generate-skill`
- `POST /api/v2/generate-skill/twitter`
- `POST /api/v2/generate-skill/youtube`
- `GET /api/v2/skills`
- `GET /api/v2/skills/{skill_name}`
- `DELETE /api/v2/skills/{skill_name}`
- `GET /api/v2/export/{skill_name}/zip`
- `GET /api/v2/export/{skill_name}/{file_path}`
- `POST /api/v2/export/copy`

## Generated Package Shape

Persisted skills are written under [`generated_skills/`](generated_skills/).

A typical bundle looks like:

```text
generated_skills/
└── some-skill/
    ├── SKILL.md
    ├── references/
    │   ├── framework.md
    │   ├── examples.md
    │   └── sources.md
    └── agents/
        └── openai.yaml
```

If zip export is enabled, the backend also writes:

```text
generated_skills/some-skill.zip
```

## Spec Alignment

The backend is designed around the core Agent Skills shape:

- required `SKILL.md`
- required `name` and `description`
- optional `scripts/`, `references/`, and `assets/`
- progressive disclosure through references and on-demand resources

It also supports optional Codex-oriented metadata through `agents/openai.yaml`.

## Main Files

```text
backend/
├── main.py                # Unified FastAPI entrypoint
├── app/
│   ├── config.py          # Settings and output paths
│   ├── crew.py            # CrewAI generation prompts and logic
│   ├── schemas.py         # Request / response models
│   ├── service.py         # Orchestration and post-processing
│   ├── storage.py         # Persistence + zip creation
│   ├── twitter_client.py  # X integration
│   └── youtube_client.py  # Transcript ingestion
├── generated_skills/      # Persisted skill bundles
├── testsprite_tests/      # Main TestSprite suite
├── workflow-1/            # Reference raw-paste prototype
├── workflow-2/            # Reference X/YouTube prototype
├── PRD.md
├── Procfile
├── nixpacks.toml
└── pyproject.toml
```

## Environment Variables

See [`.env.example`](.env.example).

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Yes | LLM generation via CrewAI |
| `CREWAI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `CREWAI_VERBOSE` | No | Enables verbose CrewAI logging |
| `SKILL_OUTPUT_DIR` | No | Directory for generated bundles |
| `X_BEARER_TOKEN` | Only for X flow | Required for Twitter/X ingestion |

## Run Locally

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn main:app --reload --port 8000
```

Then open:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

## Example Requests

### Raw Content

```bash
curl -X POST http://localhost:8000/api/v1/generate-skill \
  -H "Content-Type: application/json" \
  -d '{
    "creator_content": "Paste at least 40 characters of creator content here.",
    "creator_name": "Example Creator",
    "desired_skill_name": "example-skill",
    "include_openai_yaml": true,
    "persist_to_disk": true,
    "include_zip": true
  }'
```

### Twitter/X

```bash
curl -X POST http://localhost:8000/api/v2/generate-skill/twitter \
  -H "Content-Type: application/json" \
  -d '{
    "twitter_username": "naval",
    "desired_skill_name": "naval-skill"
  }'
```

### YouTube

```bash
curl -X POST http://localhost:8000/api/v2/generate-skill/youtube \
  -H "Content-Type: application/json" \
  -d '{
    "youtube_urls": [
      "https://www.youtube.com/watch?v=QRZ_l7cVzzU"
    ]
  }'
```

## Where TestSprite Is Located

The current backend TestSprite suite is here:

- [`testsprite_tests/`](testsprite_tests/)

Key files include:

- [`testsprite_tests/testsprite-mcp-test-report.md`](testsprite_tests/testsprite-mcp-test-report.md)
- [`testsprite_tests/testsprite-mcp-test-report.html`](testsprite_tests/testsprite-mcp-test-report.html)
- [`testsprite_tests/testsprite_backend_test_plan.json`](testsprite_tests/testsprite_backend_test_plan.json)
- [`testsprite_tests/standard_prd.json`](testsprite_tests/standard_prd.json)
- [`testsprite_tests/tmp/test_results.json`](testsprite_tests/tmp/test_results.json)

This is the main TestSprite folder for the active unified backend.

The older snapshots also keep their own historical test folders:

- [`workflow-1/testsprite_tests/`](workflow-1/testsprite_tests/)
- [`workflow-2/testsprite_tests/`](workflow-2/testsprite_tests/)

## Relationship To The Workflow Snapshots

This backend supersedes both reference folders:

- [`workflow-1/`](workflow-1/) corresponds to the raw-paste-only stage
- [`workflow-2/`](workflow-2/) corresponds to the extended Twitter/X + YouTube stage

Their logic is now merged into [`main.py`](main.py) under:

- `/api/v1`
- `/api/v2`

## Live Backend

The repo currently points to this deployed service:

- `https://creator-skill-backend-production.up.railway.app`

If that deployment is active, docs should be available at:

- `https://creator-skill-backend-production.up.railway.app/docs`

## Summary

This directory is the main working backend for generating portable `SKILL.md` bundles from creator content.

It is best understood as a **skill-package API**, not a repo-memory generator.
