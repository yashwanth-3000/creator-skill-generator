from __future__ import annotations

import re

from app.config import Settings
from app.crew import SkillCrewRunner
from app.schemas import (
    GenerateSkillRequest,
    GenerateSkillResponse,
    GeneratedFile,
)
from app.storage import SkillStorageService


class SkillGenerationService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.storage = SkillStorageService(settings.skill_output_dir)
        self.crew = SkillCrewRunner(
            model=settings.crewai_model,
            verbose=settings.crewai_verbose,
        )

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

        return GenerateSkillResponse(
            skill_name=skill_name,
            output_path=output_path,
            zip_path=zip_path,
            files=files,
            warnings=warnings,
        )

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
