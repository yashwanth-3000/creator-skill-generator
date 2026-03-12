"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { AppFrame } from "@/components/product/app-frame";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://creator-skill-backend-production.up.railway.app";

type LogEntry = {
  id: number;
  time: string;
  type: string;
  message: string;
  raw: Record<string, unknown>;
};

type TaskStatus = "pending" | "active" | "done";
type SourceMode = "twitter" | "youtube" | "paste";

const TASK_NAMES = [
  "Analyze creator content",
  "Write SKILL.md",
  "Write framework.md",
  "Write examples.md",
  "Write sources.md",
  "Write openai.yaml",
];

const MODE_META: Record<SourceMode, { label: string; description: string }> = {
  twitter: {
    label: "X / Twitter",
    description: "Fetch tweets from a username and generate a skill from their writing style.",
  },
  youtube: {
    label: "YouTube",
    description: "Provide YouTube video URLs and generate a skill from their transcript content.",
  },
  paste: {
    label: "Raw Paste",
    description: "Paste raw creator content directly and generate a skill from it.",
  },
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
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

function logTypeClass(type: string): string {
  switch (type) {
    case "crew_start": return styles.logCrewStart;
    case "task_start": return styles.logTaskStart;
    case "step": return styles.logStep;
    case "task_done": return styles.logTaskDone;
    case "crew_done": return styles.logCrewDone;
    case "error": return styles.logError;
    default: return styles.logResult;
  }
}

function labelClass(type: string): string {
  switch (type) {
    case "crew_start": return styles.labelStart;
    case "task_start": return styles.labelTask;
    case "step": return styles.labelStep;
    case "task_done": return styles.labelDone;
    case "crew_done": return styles.labelStart;
    case "error": return styles.labelError;
    default: return styles.labelResult;
  }
}

function labelText(type: string): string {
  switch (type) {
    case "crew_start": return "START";
    case "task_start": return "TASK";
    case "step": return "STEP";
    case "task_done": return "DONE";
    case "crew_done": return "FINISH";
    case "error": return "ERROR";
    default: return "INFO";
  }
}

export default function LiveTestPage() {
  const [mode, setMode] = useState<SourceMode>("twitter");
  const [username, setUsername] = useState("mkbhd");
  const [youtubeUrls, setYoutubeUrls] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [skillName, setSkillName] = useState("");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>(
    TASK_NAMES.map(() => "pending"),
  );
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");

  const termRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const logIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function addLog(type: string, raw: Record<string, unknown>) {
    const elapsed = typeof raw.elapsed === "number" ? raw.elapsed : 0;
    const entry: LogEntry = {
      id: logIdRef.current++,
      time: formatElapsed(elapsed),
      type,
      message: formatLogMessage(raw),
      raw,
    };
    setLogs((prev) => [...prev, entry]);
  }

  function buildRequest(): { url: string; body: Record<string, unknown> } | null {
    const shared = {
      desired_skill_name: skillName.trim() || undefined,
      target_outcome: "Create content in this creator's style",
      audience: "Content creators and enthusiasts",
      include_openai_yaml: true,
      persist_to_disk: true,
      include_zip: true,
    };

    if (mode === "twitter") {
      if (!username.trim()) return null;
      return {
        url: `${BACKEND_URL}/api/v2/generate-skill/twitter/stream`,
        body: { twitter_username: username.trim(), ...shared },
      };
    }

    if (mode === "youtube") {
      const urls = youtubeUrls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
      if (urls.length === 0) return null;
      return {
        url: `${BACKEND_URL}/api/v2/generate-skill/youtube/stream`,
        body: { youtube_urls: urls, ...shared },
      };
    }

    if (mode === "paste") {
      if (pasteContent.trim().length < 40) return null;
      return {
        url: `${BACKEND_URL}/api/v2/generate-skill/stream`,
        body: {
          creator_content: pasteContent.trim(),
          content_kind: "generic",
          creator_name: creatorName.trim() || undefined,
          ...shared,
        },
      };
    }

    return null;
  }

  const canRun = !running && buildRequest() !== null;

  async function handleRun() {
    const req = buildRequest();
    if (running || !req) return;

    setRunning(true);
    setStatus("running");
    setLogs([]);
    setElapsed(0);
    setTaskStatuses(TASK_NAMES.map(() => "pending"));
    logIdRef.current = 0;

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(req.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        addLog("error", { type: "error", message: errText, elapsed: 0 });
        setStatus("error");
        setRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let eventType = "log";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            if (eventType === "ping") continue;
            try {
              const data = JSON.parse(jsonStr) as Record<string, unknown>;

              if (eventType === "done") {
                setStatus("done");
                continue;
              }

              if (eventType === "result") {
                addLog("result", {
                  type: "result",
                  message: `Skill "${data.skill_name}" generated with ${(data.files as unknown[])?.length ?? 0} files`,
                  elapsed: data.elapsed ?? 0,
                });
                continue;
              }

              if (eventType === "error") {
                addLog("error", { type: "error", ...data });
                setStatus("error");
                continue;
              }

              const evtType = (data.type ?? eventType) as string;
              addLog(evtType, data);

              if (evtType === "task_start") {
                const idx = data.index as number;
                setTaskStatuses((prev) => prev.map((s, i) => (i === idx ? "active" : s)));
              } else if (evtType === "task_done") {
                const idx = data.index as number;
                setTaskStatuses((prev) => prev.map((s, i) => (i === idx ? "done" : s)));
              }
            } catch {
              /* skip malformed JSON */
            }
            eventType = "log";
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        addLog("error", { type: "error", message: String(err), elapsed: 0 });
        setStatus("error");
      }
    } finally {
      setRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (status !== "error") setStatus("done");
    }
  }

  return (
    <AppFrame currentPage="live-test">
      <div className={styles.main}>
        <div className={styles.header}>
          <p className={styles.kicker}>Live test</p>
          <h1 className={styles.title}>Skill Generation Pipeline</h1>
          <p className={styles.subtitle}>
            {MODE_META[mode].description}
          </p>
        </div>

        {/* ── Source mode tabs ── */}
        <div className={styles.modeTabs}>
          {(Object.keys(MODE_META) as SourceMode[]).map((m) => (
            <button
              key={m}
              className={`${styles.modeTab} ${m === mode ? styles.modeTabActive : ""}`}
              onClick={() => setMode(m)}
              disabled={running}
            >
              {MODE_META[m].label}
            </button>
          ))}
        </div>

        {/* ── Controls per mode ── */}
        <div className={styles.controls}>
          {mode === "twitter" && (
            <label className={styles.field}>
              <span>Username</span>
              <div className={styles.inputPrefix}>
                <span>@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="mkbhd"
                  disabled={running}
                />
              </div>
            </label>
          )}

          {mode === "youtube" && (
            <label className={styles.fieldWide}>
              <span>YouTube URLs (one per line)</span>
              <textarea
                className={styles.textarea}
                value={youtubeUrls}
                onChange={(e) => setYoutubeUrls(e.target.value)}
                placeholder={"https://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=..."}
                rows={3}
                disabled={running}
              />
            </label>
          )}

          {mode === "paste" && (
            <>
              <label className={styles.field}>
                <span>Creator name (optional)</span>
                <div className={styles.inputPrefix}>
                  <span></span>
                  <input
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="e.g. Paul Graham"
                    disabled={running}
                  />
                </div>
              </label>
              <label className={styles.fieldWide}>
                <span>Content (min 40 chars)</span>
                <textarea
                  className={styles.textarea}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Paste the creator's content here…"
                  rows={5}
                  disabled={running}
                />
              </label>
            </>
          )}

          <label className={styles.field}>
            <span>Skill name</span>
            <div className={styles.inputPrefix}>
              <span></span>
              <input
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="auto-generated"
                disabled={running}
              />
            </div>
          </label>

          <button
            className={styles.runButton}
            onClick={handleRun}
            disabled={!canRun}
          >
            {running ? (
              <>
                <span className={styles.spinner} />
                Generating…
              </>
            ) : (
              "Run pipeline"
            )}
          </button>
        </div>

        <div className={styles.terminalWrapper}>
          <div className={styles.terminal}>
            <div className={styles.terminalHeader}>
              <span className={styles.terminalDot} />
              <span className={styles.terminalDot} />
              <span className={styles.terminalDot} />
              <span className={styles.terminalTitle}>
                CrewAI Generation Logs — {MODE_META[mode].label}
              </span>
            </div>

            <div className={styles.terminalBody} ref={termRef}>
              {logs.length === 0 ? (
                <div className={styles.placeholder}>
                  {running
                    ? "Waiting for first event…"
                    : "Configure inputs above and click Run to start"}
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`${styles.logLine} ${logTypeClass(log.type)}`}
                  >
                    <span className={styles.logTime}>{log.time}</span>
                    <span className={styles.logContent}>
                      <span
                        className={`${styles.logLabel} ${labelClass(log.type)}`}
                      >
                        {labelText(log.type)}
                      </span>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <p className={styles.sidebarLabel}>Status</p>
              <div className={styles.elapsedTime}>{formatElapsed(elapsed)}</div>
              <div className={styles.elapsedLabel}>elapsed</div>
              <div
                className={`${styles.statusBadge} ${
                  status === "idle"
                    ? styles.statusIdle
                    : status === "running"
                      ? styles.statusRunning
                      : status === "done"
                        ? styles.statusDone
                        : styles.statusError
                }`}
              >
                {status === "idle" && "Ready"}
                {status === "running" && "Running"}
                {status === "done" && "Complete"}
                {status === "error" && "Failed"}
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <p className={styles.sidebarLabel}>Pipeline</p>
              <div className={styles.taskList}>
                {TASK_NAMES.map((name, i) => (
                  <div
                    key={name}
                    className={`${styles.taskItem} ${
                      taskStatuses[i] === "active"
                        ? styles.taskItemActive
                        : taskStatuses[i] === "done"
                          ? styles.taskItemDone
                          : ""
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
      </div>
    </AppFrame>
  );
}
