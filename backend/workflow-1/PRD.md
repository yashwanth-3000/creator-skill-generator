# Creator Skill Generator — PRD

## Problem
Creators have repeatable workflows buried in their content (YouTube scripts, newsletters, threads). Turning these into reusable AI skill packages is manual and inconsistent.

## Solution
A backend API that accepts raw creator content, extracts patterns via AI agents, and generates a structured SKILL.md package ready for Codex/Claude Code.

## Core Workflow

```
Paste Samples → Generate Skill → Preview → Export
```

### 1. Paste Samples
- User sends `POST /api/generate-skill` with `creator_content` (min 40 chars) plus optional metadata (`creator_name`, `content_kind`, `desired_skill_name`, `target_outcome`, `audience`).
- Input is validated by Pydantic; short/empty content returns 422.

### 2. Generate Skill
- CrewAI pipeline runs two agents sequentially:
  - **Analyst**: extracts skill structure (workflows, constraints, key phrases, tone).
  - **Writer**: produces 5–6 files from the analysis.
- Output files: `SKILL.md`, `references/framework.md`, `references/examples.md`, `references/sources.md`, `agents/openai.yaml`.
- Post-processing ensures valid frontmatter and YAML.

### 3. Preview
- API response includes `files[]` with `relative_path` and `content` for each generated file.
- `warnings[]` flags quality issues (missing files, short references, missing links).
- Files are optionally persisted to disk under `generated_skills/<skill-name>/`.
- `GET /api/skills` lists all generated skill packages with their files.

### 4. Export
- `GET /api/export/{skill_name}/zip` — download the full skill package as a zip file.
- `GET /api/export/{skill_name}/{file_path}` — download a single file (SKILL.md, etc).
- `POST /api/export/copy` — get raw file content for clipboard copy (body: `skill_name`, `file_path`).
- When `include_zip: true` on generation, a `.zip` archive is created alongside the file tree.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Usage info |
| GET | /api/health | Health check (returns `status: "ok"`, `service: "<app_name>"`) |
| POST | /api/generate-skill | Generate skill package |
| GET | /api/skills | List all generated skills |
| GET | /api/export/{skill_name}/zip | Download zip archive |
| GET | /api/export/{skill_name}/{file_path} | Download single file |
| POST | /api/export/copy | Get file content for clipboard |

## Validation Rules
- `creator_content` required, min 40 characters.
- Empty/missing content → 422 Unprocessable Entity.
- Backend errors → 500 with detail message.
- Export of non-existent skill/file → 404.
- Path traversal attempts → 400.

## Success Criteria
- Happy path: valid input → complete skill package with no warnings.
- SKILL.md has YAML frontmatter, ≥3 numbered workflow steps, links to all reference files.
- At least 2 reference files, each ≥200 chars.
- Export endpoints serve correct files with correct MIME types.
- Invalid input returns proper error codes, not crashes.
