from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class GenerateSkillRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    creator_content: str = Field(..., min_length=40)
    content_kind: str = "generic"
    creator_name: str | None = None
    desired_skill_name: str | None = None
    target_outcome: str | None = None
    audience: str | None = None
    include_openai_yaml: bool = True
    persist_to_disk: bool = True
    include_zip: bool = True


class GeneratedFile(BaseModel):
    relative_path: str
    content: str


class SkillAnalysis(BaseModel):
    """Intermediate analysis produced by the Analyst agent."""

    skill_name: str
    display_name: str
    description: str
    primary_topic: str
    target_audience: str
    tone: str
    workflows: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    key_phrases: list[str] = Field(default_factory=list)


class FileContent(BaseModel):
    """Single file output — used by each per-file generation task.

    OpenAI structured output (json_schema) guarantees this field is always
    present and valid.  Keeping the model to a single string field means
    the LLM can use its entire token budget on content quality.
    """

    content: str = Field(
        ...,
        min_length=50,
        description="Full markdown content of the file. Must be detailed and comprehensive.",
    )


class AgentMeta(BaseModel):
    """Metadata written to agents/openai.yaml."""

    display_name: str
    short_description: str
    default_prompt: str


class GenerateSkillResponse(BaseModel):
    skill_name: str
    output_path: str | None = None
    zip_path: str | None = None
    files: list[GeneratedFile] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class ExportFileRequest(BaseModel):
    skill_name: str
    file_path: str
