export type GenerateMode = "raw" | "twitter" | "youtube";

export type GeneratedFile = {
  relative_path: string;
  content: string;
};

export type GenerateSkillResponse = {
  skill_name: string;
  output_path?: string | null;
  zip_path?: string | null;
  files: GeneratedFile[];
  warnings: string[];
  source_metadata?: Record<string, unknown> | null;
};

export type SkillFileSummary = {
  relative_path: string;
  size_bytes: number;
};

export type SkillSummary = {
  name: string;
  has_skill_md: boolean;
  has_zip: boolean;
  file_count: number;
  files: SkillFileSummary[];
};

export type SkillsListResponse = {
  skills: SkillSummary[];
  count: number;
};

export type SkillFileDetail = {
  relative_path: string;
  content: string;
};

export type SkillDetail = {
  name: string;
  has_skill_md: boolean;
  has_zip: boolean;
  files: SkillFileDetail[];
};

export type HealthResponse = {
  status: string;
  service: string;
  version: string;
};
