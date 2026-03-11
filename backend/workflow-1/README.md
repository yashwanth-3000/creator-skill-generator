# Workflow 1: Raw Paste Skill Generator

This directory is the first backend snapshot for Creator Skill Generator.

It captures the earliest version of the project: take pasted creator content, run generation, and return a portable `SKILL.md` bundle.

This workflow is kept for reference. The current main backend has absorbed this logic and serves it under `/api/v1` from [`../main.py`](../main.py).

## Why This Workflow Exists

Workflow 1 represents the simplest version of the product idea:

- no external source ingestion
- no Twitter/X dependency
- no YouTube transcript dependency
- just pasted source material turned into a reusable skill package

That makes this folder the cleanest place to understand the original core problem:

**How do we convert raw creator content into a reusable agent skill?**

## Skills Context

This workflow generates **skills**, not repo instructions.

That means:

- it generates `SKILL.md`
- it can generate supporting files
- it is designed around reusable workflow packaging

This output is meant to be portable across skills-compatible tools.

## Practical Skill Guidance Reflected Here

This workflow lines up with the current direction of the skills ecosystem:

- one focused repeatable task
- one central `SKILL.md`
- supporting material moved into references
- explicit structure instead of one huge free-form prompt

That is why Workflow 1 is intentionally narrow. It is the smallest useful version of a portable skill generator.

## Why This Workflow Matters

Both Codex and Claude Code can use skills built around `SKILL.md`.

Workflow 1 matters because it proves the smallest grounded version of that idea:

- one source corpus
- one generated skill entrypoint
- one portable bundle

## What Workflow 1 Does

The service accepts pasted creator material and generates a skill package.

The flow is:

1. User pastes creator content.
2. The backend validates the request.
3. CrewAI analyzes the content.
4. The backend generates skill files.
5. The files can be persisted to disk.
6. The bundle can be downloaded or inspected through the API.

## API Surface

This workflow exposes a small raw-paste API.

- `GET /`
- `GET /api/health`
- `POST /api/generate-skill`
- `GET /api/skills`
- `GET /api/export/{skill_name}/zip`
- `GET /api/export/{skill_name}/{file_path}`
- `POST /api/export/copy`

## Generated Output

The workflow generates a skill bundle rooted in `SKILL.md`.

Typical output includes:

- `SKILL.md`
- `references/framework.md`
- `references/examples.md`
- `references/sources.md`
- optional `agents/openai.yaml`

Persisted files are stored under the workflow's configured output directory.

The reference folder is not accidental. Current skill guidance strongly favors keeping `SKILL.md` focused and moving bulky detail into supporting files.

## Why This Is More Accurate Than A Generic Skill Scaffold

Generic skill creators are useful when you want to author a skill from scratch.

Workflow 1 is more accurate for source-derived skill generation because it uses real pasted creator material to produce:

- grounded workflow instructions
- grounded examples and references
- a tighter `SKILL.md` based on the source corpus

## Main Files

```text
workflow-1/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── schemas.py
│   ├── crew.py
│   ├── service.py
│   └── storage.py
├── tests/
├── testsprite_tests/
├── examples/
├── PRD.md
├── README.md
└── pyproject.toml
```

## Run Locally

```bash
cd backend/workflow-1
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Yes | LLM generation |
| `CREWAI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `CREWAI_VERBOSE` | No | Enables verbose CrewAI logging |
| `SKILL_OUTPUT_DIR` | No | Bundle output location |

## Example Request

```bash
curl -X POST http://localhost:8000/api/generate-skill \
  -H "Content-Type: application/json" \
  -d '{
    "creator_content": "Paste at least 40 characters of creator content here.",
    "desired_skill_name": "example-skill",
    "persist_to_disk": true,
    "include_zip": true
  }'
```

## Where TestSprite Is Located

The Workflow 1 TestSprite suite is here:

- [`testsprite_tests/`](testsprite_tests/)

Important files include:

- [`testsprite_tests/testsprite-mcp-test-report.md`](testsprite_tests/testsprite-mcp-test-report.md)
- [`testsprite_tests/testsprite-mcp-test-report.html`](testsprite_tests/testsprite-mcp-test-report.html)
- [`testsprite_tests/testsprite_backend_test_plan.json`](testsprite_tests/testsprite_backend_test_plan.json)
- [`testsprite_tests/standard_prd.json`](testsprite_tests/standard_prd.json)
- [`testsprite_tests/tmp/test_results.json`](testsprite_tests/tmp/test_results.json)

This suite is historical now, but it is still useful for understanding the first tested version of the raw-paste workflow.

## Relation To The Main Backend

This workflow is now effectively the ancestor of:

- `POST /api/v1/generate-skill`
- `GET /api/v1/skills`
- `GET /api/v1/export/...`

in the unified backend at [`../main.py`](../main.py).

## Summary

Workflow 1 is the minimal skill-generation backend:

- pasted content in
- `SKILL.md` bundle out

If you want the cleanest reference for the first version of the idea, start here.
