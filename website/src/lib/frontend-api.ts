import type {
  GenerateMode,
  GenerateSkillResponse,
  HealthResponse,
} from "./backend-types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://creator-skill-backend-production.up.railway.app";

const API_ROOT = `${BACKEND_URL}/api`;

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

export async function fetchHealth() {
  return requestJson<HealthResponse>(`${API_ROOT}/health`);
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
