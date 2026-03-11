from __future__ import annotations

import zipfile
from datetime import datetime
from pathlib import Path

from app.schemas import GeneratedFile


class SkillStorageService:
    def __init__(self, output_root: Path) -> None:
        self.output_root = output_root
        self.output_root.mkdir(parents=True, exist_ok=True)

    def persist(
        self,
        skill_name: str,
        files: list[GeneratedFile],
        include_zip: bool = True,
    ) -> tuple[str, str | None]:
        bundle_dir = self._resolve_bundle_dir(skill_name)
        bundle_dir.mkdir(parents=True, exist_ok=True)

        for f in files:
            target = bundle_dir / f.relative_path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(f.content, encoding="utf-8")

        zip_path = None
        if include_zip:
            zip_target = bundle_dir.with_suffix(".zip")
            with zipfile.ZipFile(zip_target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                for f in files:
                    archive.write(bundle_dir / f.relative_path, arcname=f.relative_path)
            zip_path = str(zip_target)

        return str(bundle_dir), zip_path

    def _resolve_bundle_dir(self, skill_name: str) -> Path:
        candidate = self.output_root / skill_name
        if not candidate.exists():
            return candidate
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return self.output_root / f"{skill_name}-{timestamp}"
