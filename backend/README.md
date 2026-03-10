# Creator Skill Backend

Generate Codex / Claude Code skill packages from creator content using CrewAI.

## Structure

```
app/
├── main.py      # FastAPI app + routes
├── config.py    # Settings
├── schemas.py   # Pydantic models
├── crew.py      # CrewAI workflow (2 agents)
├── service.py   # Orchestration
└── storage.py   # Disk persistence
```

## Setup

```bash
cp .env.example .env        # add your OPENAI_API_KEY
uv sync --extra dev
```

## Run tests

```bash
.venv/bin/python -m pytest -q
```

## API

```bash
# Health check
curl http://localhost:8000/api/health

# Generate a skill package
curl -X POST http://localhost:8000/api/generate-skill \
  -H "Content-Type: application/json" \
  -d @examples/request.json
```
