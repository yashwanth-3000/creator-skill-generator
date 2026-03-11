from __future__ import annotations

import asyncio
import json
import re
import time
from collections.abc import AsyncGenerator
from queue import Empty, Queue
from threading import Thread

import logging

from app.config import Settings
from app.crew import SkillCrewRunner
from app.schemas import (
    GenerateSkillRequest,
    GenerateSkillResponse,
    GeneratedFile,
)
from app.storage import SkillStorageService
from app.supabase_store import SupabaseSkillStore

logger = logging.getLogger(__name__)


class SkillGenerationService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.storage = SkillStorageService(settings.skill_output_dir)
        self.crew = SkillCrewRunner(
            model=settings.crewai_model,
            verbose=settings.crewai_verbose,
        )
        self.db: SupabaseSkillStore | None = None
        if settings.supabase_url and settings.supabase_service_role_key:
            self.db = SupabaseSkillStore(settings.supabase_url, settings.supabase_service_role_key)
            logger.info("Supabase store enabled")
        else:
            logger.warning("Supabase env vars missing — skills will NOT be saved to database")

    def generate(self, request: GenerateSkillRequest) -> GenerateSkillResponse:
        raw_name, files = self.crew.run(request)
        skill_name = _slugify(raw_name)
        files = self._post_process(skill_name, files, request.include_openai_yaml)
        warnings = self._check(skill_name, files)

        output_path = None
        zip_path = None
        if request.persist_to_disk:
            output_path, zip_path = self.storage.persist(
                skill_name, files, include_zip=request.include_zip,
            )

        response = GenerateSkillResponse(
            skill_name=skill_name,
            output_path=output_path,
            zip_path=zip_path,
            files=files,
            warnings=warnings,
        )
        self._save_to_supabase(response, request)
        return response

    async def generate_streaming(
        self, request: GenerateSkillRequest,
    ) -> AsyncGenerator[str, None]:
        """Run generation in a background thread and yield SSE events."""
        event_queue: Queue[dict | None] = Queue()
        result_holder: list[tuple[str, list[GeneratedFile]] | None] = [None]
        error_holder: list[str | None] = [None]
        start_time = time.time()

        def _run() -> None:
            try:
                result_holder[0] = self.crew.run_with_events(request, event_queue)
            except Exception as exc:
                error_holder[0] = str(exc)
                event_queue.put({"type": "error", "message": str(exc)})
                event_queue.put(None)

        thread = Thread(target=_run, daemon=True)
        thread.start()

        while True:
            try:
                event = event_queue.get(timeout=2.0)
            except Empty:
                if not thread.is_alive():
                    break
                elapsed = round(time.time() - start_time, 1)
                yield f"event: ping\ndata: {json.dumps({'elapsed': elapsed})}\n\n"
                continue

            if event is None:
                break

            event["elapsed"] = round(time.time() - start_time, 1)
            yield f"event: log\ndata: {json.dumps(event)}\n\n"
            await asyncio.sleep(0)

        thread.join(timeout=10)

        if error_holder[0]:
            yield f"event: error\ndata: {json.dumps({'error': error_holder[0]})}\n\n"
            return

        if result_holder[0]:
            raw_name, files = result_holder[0]
            skill_name = _slugify(raw_name)
            files = self._post_process(skill_name, files, request.include_openai_yaml)
            warnings = self._check(skill_name, files)

            output_path = None
            zip_path = None
            if request.persist_to_disk:
                output_path, zip_path = self.storage.persist(
                    skill_name, files, include_zip=request.include_zip,
                )

            response = GenerateSkillResponse(
                skill_name=skill_name,
                output_path=output_path,
                zip_path=zip_path,
                files=files,
                warnings=warnings,
            )
            self._save_to_supabase(response, request)
            yield f"event: result\ndata: {response.model_dump_json()}\n\n"

        yield "event: done\ndata: {}\n\n"

    # ------------------------------------------------------------------
    # Supabase persistence
    # ------------------------------------------------------------------

    def _save_to_supabase(
        self,
        response: GenerateSkillResponse,
        request: GenerateSkillRequest,
    ) -> None:
        if not self.db:
            return
        kind = request.content_kind
        source_mode = (
            "twitter" if kind == "twitter-threads"
            else "youtube" if kind == "youtube-script"
            else "raw"
        )
        source_metadata: dict = {"content_kind": kind}
        if request.creator_name:
            source_metadata["creator_name"] = request.creator_name
        if request.desired_skill_name:
            source_metadata["desired_skill_name"] = request.desired_skill_name
        if request.audience:
            source_metadata["audience"] = request.audience
        self.db.save_skill(response, source_mode=source_mode, source_metadata=source_metadata)

    # ------------------------------------------------------------------
    # Post-processing
    # ------------------------------------------------------------------

    def _post_process(
        self,
        skill_name: str,
        files: list[GeneratedFile],
        include_yaml: bool,
    ) -> list[GeneratedFile]:
        processed: list[GeneratedFile] = []
        has_yaml = False

        for f in files:
            content = f.content

            if f.relative_path == "SKILL.md":
                content = self._ensure_frontmatter(content, skill_name)
                processed.append(GeneratedFile(relative_path="SKILL.md", content=content))
            elif f.relative_path.startswith("agents/"):
                has_yaml = True
                if f"${skill_name}" not in content:
                    content = self._fix_default_prompt(content, skill_name)
                processed.append(GeneratedFile(relative_path=f.relative_path, content=content))
            else:
                processed.append(GeneratedFile(relative_path=f.relative_path, content=content))

        if include_yaml and not has_yaml:
            processed.append(
                GeneratedFile(
                    relative_path="agents/openai.yaml",
                    content=(
                        "interface:\n"
                        f'  display_name: "{skill_name}"\n'
                        '  short_description: "Generated skill package."\n'
                        f'  default_prompt: "Use ${skill_name} to execute this workflow."\n'
                    ),
                )
            )

        return processed

    def _ensure_frontmatter(self, content: str, skill_name: str) -> str:
        stripped = content.strip()

        # Strip ```yaml frontmatter blocks the LLM sometimes wraps
        yaml_fm = re.match(
            r"^```ya?ml\s*\n(.*?)\n```\s*\n?",
            stripped,
            re.DOTALL,
        )
        if yaml_fm:
            fm_text = yaml_fm.group(1)
            body = stripped[yaml_fm.end():].lstrip("\n")
            desc = self._extract_desc(fm_text)
            return self._build_frontmatter(skill_name, desc, body)

        if stripped.startswith("---"):
            fm_end = stripped.find("\n---\n", 4)
            if fm_end != -1:
                fm_block = stripped[4:fm_end]
                body = stripped[fm_end + 5:].lstrip("\n")
                if f"name: {skill_name}" in fm_block:
                    return stripped
                desc = self._extract_desc(fm_block)
                return self._build_frontmatter(skill_name, desc, body)

        body = stripped
        desc = None
        bare_fm = re.match(
            r"^(?:name:\s*.+\n)?(?:description:\s*.+\n)(?:```\s*\n)?\s*\n?",
            body,
        )
        if bare_fm:
            desc = self._extract_desc(bare_fm.group(0))
            body = body[bare_fm.end():].lstrip("\n")

        return self._build_frontmatter(skill_name, desc, body)

    def _build_frontmatter(self, skill_name: str, desc: str | None, body: str) -> str:
        desc = desc or "Generated skill"
        safe_desc = desc.replace('"', '\\"')
        return (
            f"---\nname: {skill_name}\n"
            f'description: "{safe_desc}"\n'
            f"---\n\n{body}\n"
        )

    def _extract_desc(self, fm_text: str) -> str | None:
        match = re.search(r"description:\s*(.+)", fm_text)
        if match:
            return match.group(1).strip().strip('"').strip("'")
        return None

    def _fix_default_prompt(self, content: str, skill_name: str) -> str:
        prompt = f"Use ${skill_name} to execute this skill workflow."
        if "default_prompt:" in content:
            return re.sub(
                r"default_prompt:.*$",
                f'default_prompt: "{prompt}"',
                content,
                count=1,
                flags=re.MULTILINE,
            )
        return content.rstrip() + f'\n  default_prompt: "{prompt}"\n'

    # ------------------------------------------------------------------
    # Soft checks — return warnings, never block
    # ------------------------------------------------------------------

    def _check(self, skill_name: str, files: list[GeneratedFile]) -> list[str]:
        warnings: list[str] = []
        paths = {f.relative_path for f in files}

        if "SKILL.md" not in paths:
            warnings.append("Missing SKILL.md")

        ref_files = [f for f in files if f.relative_path.startswith("references/")]
        if len(ref_files) < 2:
            warnings.append("Expected at least 2 reference files under references/")

        for f in ref_files:
            chars = len(f.content.strip())
            if chars < 200:
                warnings.append(f"{f.relative_path} is short ({chars} chars)")

        skill_md = next((f.content for f in files if f.relative_path == "SKILL.md"), "")
        steps = re.findall(r"^\d+\.\s+.+", skill_md, re.MULTILINE)
        if len(steps) < 3:
            warnings.append("SKILL.md has fewer than 3 numbered workflow steps")

        for ref in ref_files:
            if ref.relative_path not in skill_md:
                warnings.append(f"SKILL.md doesn't link to {ref.relative_path}")

        return warnings


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")
    return slug[:63] or "generated-skill"
