# Workflow 2: Twitter/X + YouTube Skill Generator

This directory is the second backend snapshot for Creator Skill Generator.

It extends the original raw-paste flow by adding external content ingestion:

- Twitter/X usernames
- YouTube video URLs

Like Workflow 1, this folder is kept as a reference snapshot. Its capabilities are now merged into the unified backend and exposed under `/api/v2` from [`../main.py`](../main.py).

## Why This Workflow Exists

Workflow 1 proved the basic idea:

- pasted creator content can be turned into a reusable skill

Workflow 2 expands that into a more product-like backend:

- fetch creator material automatically
- normalize it
- pass it through the same generation pipeline
- return a portable `SKILL.md` bundle

This is the stage where the repo moved from a pure text-ingestion prototype to a richer source-ingestion service.

## Skills Context

This workflow is about generating **Agent Skills style bundles**.

It generates:

- `SKILL.md`
- reference files
- optional metadata files

This workflow generates reusable skills intended for skills-compatible tools.

## Practical Skill Guidance Reflected Here

Workflow 2 keeps the same core skill philosophy as Workflow 1:

- keep the skill focused on one reusable job
- use `SKILL.md` as the entrypoint
- move bulk detail into reference files
- preserve a portable bundle shape even when ingestion sources get richer

That is why Workflow 2 adds source ingestion, but still keeps the same `SKILL.md`-centered package model.

## Why This Workflow Matters

Both Codex and Claude Code can consume skills built around the Agent Skills shape.

Workflow 2 matters because it expands the grounded generation story:

- not only pasted text
- but also imported creator corpora from Twitter/X and YouTube

## What Workflow 2 Does

Workflow 2 supports three ingestion modes.

### 1. Raw Content

Like Workflow 1, it can generate a skill directly from pasted content.

### 2. Twitter/X

The backend:

- accepts a username
- resolves the user through the X API
- fetches recent original tweets
- combines them into one content source
- generates a skill from the result

### 3. YouTube

The backend:

- accepts one or more YouTube URLs
- extracts video IDs
- fetches transcripts
- combines transcript text
- generates a skill from the result

## API Surface

- `GET /`
- `GET /api/health`
- `POST /api/generate-skill`
- `POST /api/generate-skill/twitter`
- `POST /api/generate-skill/youtube`
- `GET /api/skills`
- `GET /api/export/{skill_name}/zip`
- `GET /api/export/{skill_name}/{file_path}`
- `POST /api/export/copy`

## Generated Output

The generated package is still centered on `SKILL.md`.

Typical files include:

- `SKILL.md`
- `references/framework.md`
- `references/examples.md`
- `references/sources.md`
- optional `agents/openai.yaml`

The difference from Workflow 1 is not the bundle format. The difference is how source content gets gathered before generation.

That choice matches the current skills guidance: richer input sources are useful, but the output should still remain a focused skill entrypoint plus supporting references.

## Why This Is More Accurate Than A Generic Skill Scaffold

Generic skill creators are strong for manual authoring.

Workflow 2 is more accurate for source-derived skills because it grounds the package in imported creator evidence:

- tweets
- transcripts
- normalized source metadata

That makes the generated references and constraints more faithful to the source corpus than a blank-slate scaffold.

## Main Files

```text
workflow-2/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── schemas.py
│   ├── crew.py
│   ├── service.py
│   ├── storage.py
│   ├── twitter_client.py
│   └── youtube_client.py
├── tests/
├── testsprite_tests/
├── examples/
├── PRD.md
├── README.md
└── pyproject.toml
```

## Run Locally

```bash
cd backend/workflow-2
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload --port 8001
```

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Yes | LLM generation |
| `X_BEARER_TOKEN` | Only for X flow | Required for Twitter/X ingestion |
| `CREWAI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `CREWAI_VERBOSE` | No | Enables verbose CrewAI logging |
| `SKILL_OUTPUT_DIR` | No | Bundle output location |

## Example Requests

### Twitter/X

```bash
curl -X POST http://localhost:8001/api/generate-skill/twitter \
  -H "Content-Type: application/json" \
  -d '{
    "twitter_username": "naval",
    "desired_skill_name": "naval-skill"
  }'
```

### YouTube

```bash
curl -X POST http://localhost:8001/api/generate-skill/youtube \
  -H "Content-Type: application/json" \
  -d '{
    "youtube_urls": [
      "https://www.youtube.com/watch?v=QRZ_l7cVzzU"
    ]
  }'
```

## Where TestSprite Is Located

The Workflow 2 TestSprite suite is here:

- [`testsprite_tests/`](testsprite_tests/)

Important files include:

- [`testsprite_tests/testsprite_backend_test_plan.json`](testsprite_tests/testsprite_backend_test_plan.json)
- [`testsprite_tests/standard_prd.json`](testsprite_tests/standard_prd.json)
- [`testsprite_tests/tmp/test_results.json`](testsprite_tests/tmp/test_results.json)

This snapshot does not currently include the same rendered report files you have in the main backend or Workflow 1, but it still contains the TestSprite-generated test plan and run artifacts for the Twitter/X and YouTube stage.

## Relation To The Main Backend

Workflow 2 is the ancestor of the unified backend's `/api/v2` routes.

The same concepts now live in:

- `POST /api/v2/generate-skill`
- `POST /api/v2/generate-skill/twitter`
- `POST /api/v2/generate-skill/youtube`
- `GET /api/v2/skills`
- `GET /api/v2/export/...`

inside [`../main.py`](../main.py).

## Summary

Workflow 2 is the source-ingestion expansion of the project:

- raw content
- Twitter/X
- YouTube

all normalized into the same portable `SKILL.md` bundle model.
