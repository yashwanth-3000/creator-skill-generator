import type {
  GenerateMode,
  GenerateSkillResponse,
  HealthResponse,
  SkillDetail,
  SkillsListResponse,
} from "./backend-types";

const API_ROOT = "/api/backend";

type JsonBody = Record<string, unknown>;

async function readError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as { detail?: string; message?: string };
    return payload.detail ?? payload.message ?? "Request failed";
  }

  const fallback = await response.text();
  return fallback || "Request failed";
}

async function requestJson<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as T;
}

export function zipDownloadUrl(skillName: string) {
  return `${API_ROOT}/v1/export/${encodeURIComponent(skillName)}/zip`;
}

export function fileDownloadUrl(skillName: string, filePath: string) {
  const encodedPath = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${API_ROOT}/v1/export/${encodeURIComponent(skillName)}/${encodedPath}`;
}

export async function fetchHealth() {
  return requestJson<HealthResponse>(`${API_ROOT}/health`);
}

export async function listSkills() {
  return requestJson<SkillsListResponse>(`${API_ROOT}/v1/skills`);
}

export async function getSkill(skillName: string) {
  return requestJson<SkillDetail>(
    `${API_ROOT}/v1/skills/${encodeURIComponent(skillName)}`,
  );
}

export async function deleteSkill(skillName: string) {
  return requestJson<{ deleted: string }>(
    `${API_ROOT}/v1/skills/${encodeURIComponent(skillName)}`,
    { method: "DELETE" },
  );
}

export async function generateSkill(mode: GenerateMode, payload: JsonBody) {
  const path =
    mode === "raw"
      ? `${API_ROOT}/v1/generate-skill`
      : mode === "twitter"
        ? `${API_ROOT}/v2/generate-skill/twitter`
        : `${API_ROOT}/v2/generate-skill/youtube`;

  return requestJson<GenerateSkillResponse>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
