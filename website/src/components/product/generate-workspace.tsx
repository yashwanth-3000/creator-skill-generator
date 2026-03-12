"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import styles from "./generate-workspace.module.css";
import {
  fetchHealth,
  generateSkill,
} from "@/lib/frontend-api";
import { fetchSkillsFromSupabase, type SkillRow } from "@/lib/supabase";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://creator-skill-backend-production.up.railway.app";

function zipDownloadUrl(skillName: string) {
  return `${BACKEND_URL}/api/v1/export/${encodeURIComponent(skillName)}/zip`;
}
import type {
  GenerateMode,
  GenerateSkillResponse,
} from "@/lib/backend-types";

type FormState = {
  creatorContent: string;
  creatorName: string;
  desiredSkillName: string;
  targetOutcome: string;
  audience: string;
  twitterUsername: string;
  youtubeUrls: string;
  includeOpenAiYaml: boolean;
  persistToDisk: boolean;
  includeZip: boolean;
};

const initialForm: FormState = {
  creatorContent: "",
  creatorName: "",
  desiredSkillName: "",
  targetOutcome: "",
  audience: "",
  twitterUsername: "",
  youtubeUrls: "",
  includeOpenAiYaml: true,
  persistToDisk: true,
  includeZip: true,
};

const modeOptions: Array<{ value: GenerateMode; label: string; description: string }> = [
  {
    value: "raw",
    label: "Raw paste",
    description: "Paste creator material directly into the backend.",
  },
  {
    value: "twitter",
    label: "Twitter/X",
    description: "Generate from a public Twitter/X username.",
  },
  {
    value: "youtube",
    label: "YouTube",
    description: "Generate from one or more YouTube transcript URLs.",
  },
];

function buildPayload(mode: GenerateMode, form: FormState) {
  const shared = {
    desired_skill_name: form.desiredSkillName || undefined,
    target_outcome: form.targetOutcome || undefined,
    audience: form.audience || undefined,
    include_openai_yaml: form.includeOpenAiYaml,
    persist_to_disk: form.persistToDisk,
    include_zip: form.includeZip,
  };

  if (mode === "raw") {
    return {
      ...shared,
      creator_content: form.creatorContent,
      creator_name: form.creatorName || undefined,
      content_kind: "generic",
    };
  }

  if (mode === "twitter") {
    return {
      ...shared,
      twitter_username: form.twitterUsername,
    };
  }

  return {
    ...shared,
    youtube_urls: form.youtubeUrls
      .split(/\n|,/)
      .map((url) => url.trim())
      .filter(Boolean),
  };
}

function getHealthLabel(status: string) {
  if (status === "ok") return "Backend online";
  if (status === "down") return "Backend unreachable";
  return "Checking backend";
}

function formatMetadataLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMetadataValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value ?? "—");
}

export function GenerateWorkspace() {
  const [mode, setMode] = useState<GenerateMode>("raw");
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<GenerateSkillResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState("");
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [health, setHealth] = useState("checking");
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState("");
  const [isPending, startTransition] = useTransition();

  const currentFile = result?.files.find((file) => file.relative_path === selectedFile);
  const metadataEntries = Object.entries(result?.source_metadata ?? {}).filter(
    ([, value]) =>
      value !== null &&
      value !== undefined &&
      (!Array.isArray(value) || value.length > 0),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const healthResponse = await fetchHealth();
        if (!cancelled) {
          setHealth(healthResponse.status === "ok" ? "ok" : "down");
        }
      } catch {
        if (!cancelled) {
          setHealth("down");
        }
      }

      try {
        const rows = await fetchSkillsFromSupabase();
        if (!cancelled) {
          setSkills(rows);
        }
      } catch {
        if (!cancelled) {
          setSkills([]);
        }
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!copyState) return;

    const timeout = window.setTimeout(() => setCopyState(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  async function refreshSkills() {
    try {
      const rows = await fetchSkillsFromSupabase();
      setSkills(rows);
    } catch {
      setSkills([]);
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await generateSkill(mode, buildPayload(mode, form));
        setResult(response);
        setSelectedFile(response.files[0]?.relative_path ?? "");
        await refreshSkills();
      } catch (submissionError) {
        const detail =
          submissionError instanceof Error
            ? submissionError.message
            : "Unable to generate the skill.";
        setError(detail);
      }
    });
  }

  async function copyCurrentFile() {
    if (!currentFile) return;

    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopyState("Copied");
    } catch {
      setCopyState("Copy failed");
    }
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>Generation</p>
            <h2 className={styles.panelTitle}>Send a request to the backend</h2>
          </div>
          <span
            className={`${styles.healthBadge} ${health === "ok" ? styles.healthOk : styles.healthDown}`}
          >
            {getHealthLabel(health)}
          </span>
        </div>

        <div className={styles.modeTabs}>
          {modeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.modeTab} ${mode === option.value ? styles.modeTabActive : ""}`}
              onClick={() => setMode(option.value)}
            >
              <span>{option.label}</span>
              <small>{option.description}</small>
            </button>
          ))}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === "raw" && (
            <>
              <label className={styles.field}>
                <span>Creator content</span>
                <textarea
                  rows={12}
                  value={form.creatorContent}
                  onChange={(event) => updateField("creatorContent", event.target.value)}
                  placeholder="Paste the creator corpus here. The backend requires at least 40 characters."
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Creator name</span>
                <input
                  value={form.creatorName}
                  onChange={(event) => updateField("creatorName", event.target.value)}
                  placeholder="Optional display name"
                />
              </label>
            </>
          )}

          {mode === "twitter" && (
            <label className={styles.field}>
              <span>Twitter/X username</span>
              <input
                value={form.twitterUsername}
                onChange={(event) => updateField("twitterUsername", event.target.value)}
                placeholder="example: naval"
                required
              />
            </label>
          )}

          {mode === "youtube" && (
            <label className={styles.field}>
              <span>YouTube URLs</span>
              <textarea
                rows={6}
                value={form.youtubeUrls}
                onChange={(event) => updateField("youtubeUrls", event.target.value)}
                placeholder="Paste one or more YouTube URLs, one per line."
                required
              />
            </label>
          )}

          <div className={styles.gridFields}>
            <label className={styles.field}>
              <span>Desired skill name</span>
              <input
                value={form.desiredSkillName}
                onChange={(event) => updateField("desiredSkillName", event.target.value)}
                placeholder="Optional slug override"
              />
            </label>

            <label className={styles.field}>
              <span>Audience</span>
              <input
                value={form.audience}
                onChange={(event) => updateField("audience", event.target.value)}
                placeholder="Who the skill is for"
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Target outcome</span>
            <input
              value={form.targetOutcome}
              onChange={(event) => updateField("targetOutcome", event.target.value)}
              placeholder="What the generated skill should help accomplish"
            />
          </label>

          <div className={styles.toggleGrid}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.includeOpenAiYaml}
                onChange={(event) => updateField("includeOpenAiYaml", event.target.checked)}
              />
              <span>Include `openai.yaml`</span>
            </label>

            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.persistToDisk}
                onChange={(event) => updateField("persistToDisk", event.target.checked)}
              />
              <span>Persist skill bundle</span>
            </label>

            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.includeZip}
                onChange={(event) => updateField("includeZip", event.target.checked)}
              />
              <span>Generate zip export</span>
            </label>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.formActions}>
            <button className={styles.submitButton} type="submit" disabled={isPending}>
              {isPending ? "Generating..." : "Generate skill"}
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                setForm(initialForm);
                setError(null);
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      <div className={styles.sideColumn}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>Result</p>
              <h2 className={styles.panelTitle}>Generated bundle preview</h2>
            </div>
            {result && <span className={styles.resultBadge}>{result.skill_name}</span>}
          </div>

          {!result ? (
            <div className={styles.emptyState}>
              <p>
                Submit a raw, Twitter/X, or YouTube request to preview the generated
                files here.
              </p>
            </div>
          ) : (
            <div className={styles.resultStack}>
              <div className={styles.resultMeta}>
                <div>
                  <strong>{result.skill_name}</strong>
                  <p>
                    {result.files.length} files returned from the backend.{" "}
                    {result.output_path
                      ? "The bundle was persisted and can be opened from the saved-skills view."
                      : "This is a response-only preview. Turn on persistence to save it."}
                  </p>
                </div>
                <div className={styles.resultActions}>
                  {result.output_path && (
                    <Link className={styles.resultLink} href={`/skills/${result.skill_name}`}>
                      Open detail
                    </Link>
                  )}
                  {result.zip_path && (
                    <a className={styles.resultLink} href={zipDownloadUrl(result.skill_name)}>
                      Download zip
                    </a>
                  )}
                </div>
              </div>

              {result.warnings.length > 0 && (
                <div className={styles.warningBox}>
                  <p>Warnings</p>
                  <ul>
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {metadataEntries.length > 0 && (
                <div className={styles.metaGrid}>
                  {metadataEntries.map(([key, value]) => (
                    <div key={key} className={styles.metaCard}>
                      <span>{formatMetadataLabel(key)}</span>
                      <strong>{formatMetadataValue(value)}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.fileTabs}>
                {result.files.map((file) => (
                  <button
                    key={file.relative_path}
                    type="button"
                    className={`${styles.fileTab} ${selectedFile === file.relative_path ? styles.fileTabActive : ""}`}
                    onClick={() => setSelectedFile(file.relative_path)}
                  >
                    {file.relative_path}
                  </button>
                ))}
              </div>

              {currentFile && (
                <div className={styles.fileViewer}>
                  <div className={styles.fileViewerHeader}>
                    <p>{currentFile.relative_path}</p>
                    <button type="button" onClick={copyCurrentFile}>
                      {copyState || "Copy"}
                    </button>
                  </div>
                  <pre>{currentFile.content}</pre>
                </div>
              )}
            </div>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>Saved skills</p>
              <h2 className={styles.panelTitle}>Existing backend output</h2>
            </div>
            <Link className={styles.inlineLink} href="/skills">
              View all
            </Link>
          </div>

          <div className={styles.skillList}>
            {skills.length === 0 ? (
              <p className={styles.emptyCopy}>
                No persisted skills found yet. Existing backend-generated bundles will
                appear here.
              </p>
            ) : (
              skills.slice(0, 5).map((skill) => (
                <Link key={skill.id} className={styles.skillItem} href={`/skills/${skill.skill_name}`}>
                  <div>
                    <strong>{skill.display_name || skill.skill_name}</strong>
                    <p>
                      {skill.file_count} files
                      {skill.has_zip ? " · zip ready" : ""}
                      {skill.source_mode !== "raw" ? ` · ${skill.source_mode}` : ""}
                    </p>
                  </div>
                  <span>→</span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
