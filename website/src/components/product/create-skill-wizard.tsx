"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./create-skill-wizard.module.css";
import viewerStyles from "./skill-viewer.module.css";
import { SkillViewer } from "./skill-viewer";
import { fetchHealth } from "@/lib/frontend-api";
import type { GenerateMode, GenerateSkillResponse } from "@/lib/backend-types";

type LogEntry = {
  id: number;
  time: string;
  type: string;
  message: string;
};

type TaskStatus = "pending" | "active" | "done";

const PIPELINE_TASKS = [
  "Analyze creator content",
  "Write SKILL.md",
  "Write framework.md",
  "Write examples.md",
  "Write sources.md",
  "Write openai.yaml",
];

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function logTypeClass(type: string, styles: Record<string, string>): string {
  switch (type) {
    case "crew_start": return styles.logCrewStart;
    case "task_start": return styles.logTaskStart;
    case "step":       return styles.logStep;
    case "task_done":  return styles.logTaskDone;
    case "crew_done":  return styles.logCrewDone;
    case "error":      return styles.logError;
    default:           return styles.logResult;
  }
}

function labelClass(type: string, styles: Record<string, string>): string {
  switch (type) {
    case "crew_start": return styles.labelStart;
    case "task_start": return styles.labelTask;
    case "step":       return styles.labelStep;
    case "task_done":  return styles.labelDone;
    case "crew_done":  return styles.labelStart;
    case "error":      return styles.labelError;
    default:           return styles.labelResult;
  }
}

function labelText(type: string): string {
  switch (type) {
    case "crew_start": return "START";
    case "task_start": return "TASK";
    case "step":       return "STEP";
    case "task_done":  return "DONE";
    case "crew_done":  return "FINISH";
    case "error":      return "ERROR";
    default:           return "INFO";
  }
}

function formatLogMessage(event: Record<string, unknown>): string {
  const t = event.type as string;
  if (t === "crew_start") {
    const names = event.task_names as string[] | undefined;
    return names
      ? `Crew started — ${names.length} tasks: ${names.join(" → ")}`
      : "Crew started — generating skill bundle";
  }
  if (t === "task_start") return `Starting: ${event.name}`;
  if (t === "step") return String(event.output ?? "");
  if (t === "task_done") {
    const summary = String(event.summary ?? "");
    return summary ? `Completed: ${event.name} — ${summary}` : `Completed: ${event.name}`;
  }
  if (t === "crew_done") return "All tasks complete — finalizing result";
  if (t === "error") return `Error: ${event.message ?? event.error ?? "Unknown"}`;
  return JSON.stringify(event);
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://creator-skill-backend-production.up.railway.app";

function streamUrl(mode: GenerateMode): string {
  if (mode === "raw") return `${BACKEND_URL}/api/v2/generate-skill/stream`;
  if (mode === "twitter") return `${BACKEND_URL}/api/v2/generate-skill/twitter/stream`;
  return `${BACKEND_URL}/api/v2/generate-skill/youtube/stream`;
}

function zipDownloadUrl(skillName: string) {
  return `${BACKEND_URL}/api/v1/export/${encodeURIComponent(skillName)}/zip`;
}

type FormState = {
  creatorContent: string;
  creatorName: string;
  twitterUsername: string;
  youtubeUrls: string;
  desiredSkillName: string;
  targetOutcome: string;
  audience: string;
  includeOpenAiYaml: boolean;
  persistToDisk: boolean;
  includeZip: boolean;
};

const initialForm: FormState = {
  creatorContent: "",
  creatorName: "",
  twitterUsername: "",
  youtubeUrls: "",
  desiredSkillName: "",
  targetOutcome: "",
  audience: "",
  includeOpenAiYaml: true,
  persistToDisk: true,
  includeZip: true,
};

type SourceOption = {
  value: GenerateMode;
  icon: string;
  label: string;
  description: string;
  hint: string;
};

const sources: SourceOption[] = [
  {
    value: "raw",
    icon: "✦",
    label: "I have content",
    description: "Paste creator material directly — transcripts, essays, threads, or any text.",
    hint: "Requires at least 40 characters.",
  },
  {
    value: "twitter",
    icon: "𝕏",
    label: "Twitter / X",
    description: "Point to a public account and the backend fetches and analyses recent posts.",
    hint: "Enter the username without the @ symbol.",
  },
  {
    value: "youtube",
    icon: "▶",
    label: "YouTube",
    description: "Provide one or more YouTube video URLs. Transcripts are pulled automatically.",
    hint: "One URL per line. Public transcripts must be available.",
  },
];

const toggleOptions = [
  { key: "includeOpenAiYaml" as const, label: "openai.yaml", desc: "OpenAI plugin manifest" },
  { key: "persistToDisk" as const, label: "Persist to disk", desc: "Save bundle to server" },
  { key: "includeZip" as const, label: "Generate zip", desc: "Downloadable archive" },
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
    return { ...shared, twitter_username: form.twitterUsername };
  }

  return {
    ...shared,
    youtube_urls: form.youtubeUrls
      .split(/\n|,/)
      .map((u) => u.trim())
      .filter(Boolean),
  };
}

function formatMetadataLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMetadataValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "—");
}

export function CreateSkillWizard() {
  const [mode, setMode] = useState<GenerateMode | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<GenerateSkillResponse | null>(null);
  const [health, setHealth] = useState("checking");
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>(PIPELINE_TASKS.map(() => "pending"));
  const [elapsed, setElapsed] = useState(0);
  const [genStatus, setGenStatus] = useState<"idle" | "running" | "done" | "error">("idle");

  const termRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    const el = termRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 80) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [logs, scrollToBottom]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const selectedSource = sources.find((s) => s.value === mode);
  const metadataEntries = Object.entries(result?.source_metadata ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && (!Array.isArray(v) || v.length > 0),
  );

  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then((r) => { if (!cancelled) setHealth(r.status === "ok" ? "ok" : "down"); })
      .catch(() => { if (!cancelled) setHealth("down"); });
    return () => { cancelled = true; };
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((cur) => ({ ...cur, [key]: value }));
  }

  function handleSelectMode(m: GenerateMode) {
    setMode(m);
    setResult(null);
    setError(null);
  }

  function isInputValid(): boolean {
    if (!mode) return false;
    if (mode === "raw") return form.creatorContent.trim().length >= 40;
    if (mode === "twitter") return form.twitterUsername.trim().length > 0;
    return form.youtubeUrls.trim().length > 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mode || !isInputValid() || genStatus === "running") return;

    setError(null);
    setResult(null);
    setLogs([]);
    setTaskStatuses(PIPELINE_TASKS.map(() => "pending"));
    setElapsed(0);
    setGenStatus("running");
    logIdRef.current = 0;

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(streamUrl(mode), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(mode, form)),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        let msg = errText;
        try {
          const parsed = JSON.parse(errText) as { detail?: string };
          if (parsed.detail) msg = parsed.detail;
        } catch { /* use raw text */ }
        setError(msg);
        setGenStatus("error");
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let eventType = "log";

      const processLines = (lines: string[]) => {
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            if (eventType === "ping") { eventType = "log"; continue; }
            try {
              const data = JSON.parse(jsonStr) as Record<string, unknown>;

              if (eventType === "done") {
                setGenStatus("done");
                eventType = "log";
                continue;
              }

              if (eventType === "result") {
                const skillResult: GenerateSkillResponse = {
                  skill_name: String(data.skill_name ?? ""),
                  files: (data.files as GenerateSkillResponse["files"]) ?? [],
                  warnings: (data.warnings as string[]) ?? [],
                  output_path: data.output_path as string | undefined,
                  zip_path: data.zip_path as string | undefined,
                  source_metadata: data.source_metadata as Record<string, unknown> | undefined,
                };
                setResult(skillResult);
                addLog("result", `Skill "${skillResult.skill_name}" generated with ${skillResult.files.length} files`, (Date.now() - startTime) / 1000);
                eventType = "log";
                continue;
              }

              if (eventType === "error") {
                const msg = String(data.message ?? data.error ?? "Unknown error");
                addLog("error", msg, (Date.now() - startTime) / 1000);
                setError(msg);
                setGenStatus("error");
                eventType = "log";
                continue;
              }

              const evtType = (data.type ?? eventType) as string;
              const elapsedSec = typeof data.elapsed === "number" ? data.elapsed : (Date.now() - startTime) / 1000;
              addLog(evtType, formatLogMessage(data), elapsedSec);

              if (evtType === "task_start") {
                const idx = data.index as number;
                setTaskStatuses((prev) => prev.map((s, i) => (i === idx ? "active" : s)));
              } else if (evtType === "task_done") {
                const idx = data.index as number;
                setTaskStatuses((prev) => prev.map((s, i) => (i === idx ? "done" : s)));
              }
            } catch { /* skip malformed JSON */ }
            eventType = "log";
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        processLines(lines);
      }

      if (buffer.trim()) {
        processLines(buffer.split("\n"));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const msg = err instanceof Error ? err.message : "Generation failed.";
        setError(msg);
        setGenStatus("error");
      }
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setGenStatus((prev) => (prev === "running" ? "done" : prev));
    }
  }

  function handleReset() {
    abortRef.current?.abort();
    setForm(initialForm);
    setResult(null);
    setError(null);
    setLogs([]);
    setTaskStatuses(PIPELINE_TASKS.map(() => "pending"));
    setElapsed(0);
    setGenStatus("idle");
    logIdRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function addLog(type: string, message: string, elapsedSec: number) {
    setLogs((prev) => [...prev, {
      id: logIdRef.current++,
      time: formatElapsed(elapsedSec),
      type,
      message,
    }]);
  }

  return (
    <div className={`${styles.wizard} ${result ? styles.wizardWide : ""}`}>
      {/* Health indicator */}
      <div className={styles.topBar}>
        <span
          className={`${styles.healthDot} ${
            health === "ok"
              ? styles.healthOk
              : health === "down"
                ? styles.healthDown
                : styles.healthChecking
          }`}
        />
        <span className={styles.healthLabel}>
          {health === "ok"
            ? "Backend online"
            : health === "down"
              ? "Backend unreachable"
              : "Connecting…"}
        </span>
      </div>

      {/* Results (shown instead of form when available) */}
      {result && (
        <section className={styles.results} aria-label="Generated skill output">
          <div className={styles.resultsToolbar}>
            <div>
              <p className={styles.resultsKicker}>Result</p>
              <h2 className={styles.resultsTitle}>{result.skill_name}</h2>
            </div>
            <div className={styles.resultsActions}>
              <button
                type="button"
                className={styles.newSkillButton}
                onClick={handleReset}
              >
                Create a new skill
                <span className={styles.newSkillButtonIcon} aria-hidden="true">→</span>
              </button>
              {result.zip_path && (
                <a className={styles.actionButton} href={zipDownloadUrl(result.skill_name)}>
                  Download zip
                </a>
              )}
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className={styles.warningBox}>
              <strong>Warnings</strong>
              <ul>
                {result.warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
          )}

          <SkillViewer
            files={result.files}
            skillName={result.skill_name}
            downloadFileUrl={(_name, filePath) => {
              const f = result.files.find((x) => x.relative_path === filePath);
              if (!f) return "#";
              const blob = new Blob([f.content], { type: "text/plain;charset=utf-8" });
              return URL.createObjectURL(blob);
            }}
            sidebarBottom={
              <div className={viewerStyles.sidebarSection}>
                <p className={viewerStyles.sidebarLabel}>Bundle summary</p>
                <div className={viewerStyles.summaryList}>
                  {[
                    { label: "Files", value: <strong>{result.files.length}</strong> },
                    { label: "Persisted", value: <strong>{result.output_path ? "Yes" : "No"}</strong> },
                    { label: "Archive", value: <strong>{result.zip_path ? "Zip ready" : "No zip"}</strong> },
                    ...metadataEntries.map(([k, v]) => ({
                      label: formatMetadataLabel(k),
                      value: <strong>{formatMetadataValue(v)}</strong>,
                    })),
                  ].map(({ label, value }) => (
                    <div key={label} className={viewerStyles.summaryRow}>
                      <span>{label}</span>
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        </section>
      )}

      {/* Terminal logs — shown during generation and briefly after until result arrives */}
      {(genStatus === "running" || (genStatus === "done" && !result && !error)) && (
        <div className={styles.terminalWrapper}>
          <div className={styles.terminal}>
            <div className={styles.terminalHeader}>
              <span className={styles.terminalDot} />
              <span className={styles.terminalDot} />
              <span className={styles.terminalDot} />
              <span className={styles.terminalTitle}>CrewAI Generation Logs</span>
            </div>
            <div className={styles.terminalBody} ref={termRef}>
              {logs.length === 0 ? (
                <div className={styles.placeholder}>Waiting for first event…</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={`${styles.logLine} ${logTypeClass(log.type, styles as unknown as Record<string, string>)}`}>
                    <span className={styles.logTime}>{log.time}</span>
                    <span className={styles.logContent}>
                      <span className={`${styles.logLabel} ${labelClass(log.type, styles as unknown as Record<string, string>)}`}>
                        {labelText(log.type)}
                      </span>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.termSidebar}>
            <div className={styles.termSidebarCard}>
              <p className={styles.termSidebarLabel}>Status</p>
              <div className={styles.elapsedTime}>{formatElapsed(elapsed)}</div>
              <div className={styles.elapsedLabel}>elapsed</div>
              <div className={`${styles.statusBadge} ${
                genStatus === "running" ? styles.statusRunning :
                genStatus === "done" ? styles.statusDone : styles.statusRunning
              }`}>
                {genStatus === "running" ? "Running" : genStatus === "done" ? "Complete" : "Running"}
              </div>
            </div>

            <div className={styles.termSidebarCard}>
              <p className={styles.termSidebarLabel}>Pipeline</p>
              <div className={styles.taskList}>
                {PIPELINE_TASKS.map((name, i) => (
                  <div
                    key={name}
                    className={`${styles.taskItem} ${
                      taskStatuses[i] === "active" ? styles.taskItemActive :
                      taskStatuses[i] === "done"   ? styles.taskItemDone : ""
                    }`}
                  >
                    <span className={styles.taskDot} />
                    <span className={styles.taskName}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page header — hidden when results or logs are showing */}
      {!result && genStatus !== "running" && <div className={styles.header}>
        <p className={styles.kicker}>New skill</p>
        <h1 className={styles.title}>Create a skill</h1>
        <p className={styles.subtitle}>
          Choose a content source, fill in the details, and generate a ready-to-use skill bundle.
        </p>
      </div>}

      {/* Source picker */}
      {!result && genStatus !== "running" && <section className={styles.sourceSection}>
        <p className={styles.sectionLabel}>Where is your content?</p>
        <div className={styles.sourceGrid}>
          {sources.map((src) => (
            <button
              key={src.value}
              type="button"
              className={`${styles.sourceCard} ${mode === src.value ? styles.sourceCardActive : ""}`}
              onClick={() => handleSelectMode(src.value)}
            >
              <span className={styles.sourceIcon} aria-hidden="true">
                {src.icon}
              </span>
              <strong className={styles.sourceTitle}>{src.label}</strong>
              <p className={styles.sourceDesc}>{src.description}</p>
              {mode === src.value && (
                <span className={styles.sourceCheck} aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </section>}

      {/* Progressive form */}
      {!result && genStatus !== "running" && mode && (
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Content input */}
          <section className={styles.formSection}>
            <p className={styles.sectionLabel}>Your content</p>

            {mode === "raw" && (
              <>
                <label className={styles.field}>
                  <span>Creator content</span>
                  <textarea
                    rows={10}
                    value={form.creatorContent}
                    onChange={(e) => updateField("creatorContent", e.target.value)}
                    placeholder="Paste transcripts, essays, threads, or any creator corpus here…"
                    required
                  />
                  <small>{selectedSource?.hint}</small>
                </label>

                <label className={styles.field}>
                  <span>
                    Creator name <em>(optional)</em>
                  </span>
                  <input
                    value={form.creatorName}
                    onChange={(e) => updateField("creatorName", e.target.value)}
                    placeholder="Display name, e.g. Paul Graham"
                  />
                </label>
              </>
            )}

            {mode === "twitter" && (
              <label className={styles.field}>
                <span>Twitter / X username</span>
                <div className={styles.inputPrefix}>
                  <span>@</span>
                  <input
                    value={form.twitterUsername}
                    onChange={(e) => updateField("twitterUsername", e.target.value)}
                    placeholder="naval"
                    required
                  />
                </div>
                <small>{selectedSource?.hint}</small>
              </label>
            )}

            {mode === "youtube" && (
              <label className={styles.field}>
                <span>YouTube URLs</span>
                <textarea
                  rows={5}
                  value={form.youtubeUrls}
                  onChange={(e) => updateField("youtubeUrls", e.target.value)}
                  placeholder={"https://youtube.com/watch?v=…\nhttps://youtube.com/watch?v=…"}
                  required
                />
                <small>{selectedSource?.hint}</small>
              </label>
            )}
          </section>

          {/* Configuration */}
          <section className={styles.formSection}>
            <p className={styles.sectionLabel}>Configuration</p>

            <div className={styles.configGrid}>
              <label className={styles.field}>
                <span>
                  Skill name <em>(optional)</em>
                </span>
                <input
                  value={form.desiredSkillName}
                  onChange={(e) => updateField("desiredSkillName", e.target.value)}
                  placeholder="auto-generated if blank"
                />
              </label>

              <label className={styles.field}>
                <span>
                  Audience <em>(optional)</em>
                </span>
                <input
                  value={form.audience}
                  onChange={(e) => updateField("audience", e.target.value)}
                  placeholder="Who is this skill for?"
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>
                Target outcome <em>(optional)</em>
              </span>
              <input
                value={form.targetOutcome}
                onChange={(e) => updateField("targetOutcome", e.target.value)}
                placeholder="What should someone achieve after using this skill?"
              />
            </label>

            <div className={styles.toggleGrid}>
              {toggleOptions.map(({ key, label, desc }) => (
                <label
                  key={key}
                  className={`${styles.toggle} ${form[key] ? styles.toggleOn : ""}`}
                >
                  <div className={styles.toggleInfo}>
                    <span>{label}</span>
                    <small>{desc}</small>
                  </div>
                  <div
                    className={`${styles.toggleSwitch} ${form[key] ? styles.toggleSwitchOn : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => updateField(key, e.target.checked)}
                    />
                    <span className={styles.toggleThumb} />
                  </div>
                </label>
              ))}
            </div>
          </section>

          {error && (
            <div className={styles.errorBox}>
              <strong>Generation failed</strong>
              <p>{error}</p>
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.generateButton}
              disabled={!isInputValid()}
            >
              Generate skill
              <span className={styles.arrowIcon} aria-hidden="true">
                →
              </span>
            </button>

            <button type="button" className={styles.resetButton} onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
