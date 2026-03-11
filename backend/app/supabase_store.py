"""Supabase persistence layer for generated skills."""

from __future__ import annotations

import logging
from typing import Any

from supabase import Client, create_client

from app.schemas import GeneratedFile, GenerateSkillResponse

logger = logging.getLogger(__name__)


class SupabaseSkillStore:
    def __init__(self, url: str, service_role_key: str) -> None:
        self.client: Client = create_client(url, service_role_key)

    def save_skill(
        self,
        response: GenerateSkillResponse,
        source_mode: str = "raw",
        source_metadata: dict[str, Any] | None = None,
    ) -> str | None:
        """Upsert a skill + its files into Supabase. Returns the skill id."""
        try:
            skill_row = {
                "skill_name": response.skill_name,
                "display_name": response.skill_name,
                "description": _extract_description(response),
                "source_mode": source_mode,
                "source_metadata": source_metadata or {},
                "has_zip": bool(response.zip_path),
                "file_count": len(response.files),
                "warnings": response.warnings or [],
            }

            result = (
                self.client.table("skills")
                .upsert(skill_row, on_conflict="skill_name")
                .execute()
            )
            skill_id = result.data[0]["id"]

            self.client.table("skill_files").delete().eq(
                "skill_id", skill_id
            ).execute()

            file_rows = [
                {
                    "skill_id": skill_id,
                    "relative_path": f.relative_path,
                    "content": f.content,
                    "size_bytes": len(f.content.encode("utf-8")),
                }
                for f in response.files
            ]
            if file_rows:
                self.client.table("skill_files").insert(file_rows).execute()

            logger.info("Saved skill %s (%s) to Supabase", response.skill_name, skill_id)
            return skill_id

        except Exception:
            logger.exception("Failed to save skill %s to Supabase", response.skill_name)
            return None

    def list_skills(self) -> list[dict[str, Any]]:
        result = (
            self.client.table("skills")
            .select("id, skill_name, display_name, description, source_mode, has_zip, file_count, created_at")
            .order("created_at", desc=True)
            .execute()
        )
        return result.data

    def get_skill(self, skill_name: str) -> dict[str, Any] | None:
        result = (
            self.client.table("skills")
            .select("*, skill_files(*)")
            .eq("skill_name", skill_name)
            .maybe_single()
            .execute()
        )
        return result.data

    def delete_skill(self, skill_name: str) -> bool:
        result = (
            self.client.table("skills")
            .delete()
            .eq("skill_name", skill_name)
            .execute()
        )
        return len(result.data) > 0


def _extract_description(response: GenerateSkillResponse) -> str | None:
    """Pull description from SKILL.md frontmatter."""
    for f in response.files:
        if f.relative_path == "SKILL.md":
            for line in f.content.splitlines():
                stripped = line.strip()
                if stripped.startswith("description:"):
                    desc = stripped[len("description:"):].strip().strip('"').strip("'")
                    return desc if desc else None
    return None
