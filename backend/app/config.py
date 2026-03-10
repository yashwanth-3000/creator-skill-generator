from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    app_name: str = "Creator Skill Backend"
    crewai_model: str = "gpt-4o-mini"
    crewai_verbose: bool = False
    openai_api_key: str | None = None
    skill_output_dir: Path = Field(default_factory=lambda: BASE_DIR / "generated_skills")

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    def model_post_init(self, __context: Any) -> None:
        resolved = self.skill_output_dir.expanduser()
        if not resolved.is_absolute():
            resolved = (BASE_DIR / resolved).resolve()
        self.skill_output_dir = resolved


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.skill_output_dir.mkdir(parents=True, exist_ok=True)
    return settings
