"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useState, useTransition } from "react";
import styles from "./skills-browser.module.css";
import { fetchSkillsFromSupabase, type SkillRow } from "@/lib/supabase";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://creator-skill-backend-production.up.railway.app";

function zipDownloadUrl(skillName: string) {
  return `${BACKEND_URL}/api/v1/export/${encodeURIComponent(skillName)}/zip`;
}

function buildInstallCmd(skillName: string, tool: "codex" | "claude") {
  const zipUrl = zipDownloadUrl(skillName);
  const skillDir = tool === "codex"
    ? `~/.codex/skills/${skillName}`
    : `~/.claude/skills/${skillName}`;
  return `curl -L "${zipUrl}" -o /tmp/${skillName}.zip && mkdir -p ${skillDir} && unzip -o /tmp/${skillName}.zip -d ${skillDir}/ && rm /tmp/${skillName}.zip`;
}

function InstallButtons({ skillName }: { skillName: string }) {
  const [copied, setCopied] = useState<"codex" | "claude" | null>(null);

  const handleCopy = useCallback((target: "codex" | "claude") => {
    navigator.clipboard.writeText(buildInstallCmd(skillName, target));
    setCopied(target);
    setTimeout(() => setCopied(null), 2000);
  }, [skillName]);

  return (
    <>
      <button
        className={`${styles.codexButton} ${copied === "codex" ? styles.buttonCopied : ""}`}
        type="button"
        onClick={() => handleCopy("codex")}
        title="Copy shell command to install in Codex"
      >
        {copied === "codex" ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
            </svg>
            Codex
          </>
        )}
      </button>
      <button
        className={`${styles.claudeButton} ${copied === "claude" ? styles.buttonCopied : ""}`}
        type="button"
        onClick={() => handleCopy("claude")}
        title="Copy shell command to install in Claude Code"
      >
        {copied === "claude" ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0H10.172L16.74 20.48H13.138L6.569 3.52zM0 20.48h3.603l6.57-16.96H6.57L0 20.48z"/>
            </svg>
            Claude
          </>
        )}
      </button>
    </>
  );
}

export function SkillsBrowser() {
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    startTransition(async () => {
      try {
        const rows = await fetchSkillsFromSupabase();
        setSkills(rows);
      } catch (refreshError) {
        const detail =
          refreshError instanceof Error
            ? refreshError.message
            : "Unable to load skills.";
        setError(detail);
      }
    });
  }, []);

  function refreshSkills() {
    setError(null);

    startTransition(async () => {
      try {
        const rows = await fetchSkillsFromSupabase();
        setSkills(rows);
      } catch (refreshError) {
        const detail =
          refreshError instanceof Error
            ? refreshError.message
            : "Unable to load skills.";
        setError(detail);
      }
    });
  }

  const filteredSkills = skills.filter((skill) => {
    const needle = deferredQuery.trim().toLowerCase();
    if (!needle) return true;

    return (
      skill.skill_name.toLowerCase().includes(needle) ||
      (skill.description ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <div className={styles.browser}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}>Skills</h1>
          <p className={styles.headerCount}>
            {filteredSkills.length} {filteredSkills.length === 1 ? "skill" : "skills"}
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              className={styles.searchInput}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search skills…"
            />
          </div>
          <button className={styles.refreshButton} type="button" onClick={refreshSkills}>
            {isRefreshing ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.spin}>
                <path d="M4 12a8 8 0 018-8V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M20 12a8 8 0 01-8 8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 12a8 8 0 018-8c2.21 0 4.21.9 5.66 2.34L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 12a8 8 0 01-8 8c-2.21 0-4.21-.9-5.66-2.34L3 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <Link className={styles.createButton} href="/create-new-skill">
            + New skill
          </Link>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        {filteredSkills.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{deferredQuery.trim() ? "No matching saved skills." : "No saved skills yet."}</p>
            <span>
              {deferredQuery.trim()
                ? "Try a different skill name or description."
                : "Generated skills will appear here automatically."}
            </span>
          </div>
        ) : (
          filteredSkills.map((skill) => (
            <article key={skill.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h2>{skill.display_name || skill.skill_name}</h2>
                  <p>
                    {skill.file_count} files
                    {skill.has_zip ? " · zip ready" : ""}
                    {" · "}
                    {skill.source_mode}
                  </p>
                </div>
                <span className={styles.cardBadge}>
                  {skill.source_mode === "twitter" ? "X / Twitter" :
                   skill.source_mode === "youtube" ? "YouTube" : "Raw paste"}
                </span>
              </div>

              {skill.description && (
                <p className={styles.cardDescription}>{skill.description}</p>
              )}

              <div className={styles.cardMeta}>
                <span>{new Date(skill.created_at).toLocaleDateString()}</span>
              </div>

              <div className={styles.cardActions}>
                <Link className={styles.primaryAction} href={`/skills/${skill.skill_name}`}>
                  Open detail
                </Link>
                {skill.has_zip && (
                  <a className={styles.secondaryAction} href={zipDownloadUrl(skill.skill_name)}>
                    Download zip
                  </a>
                )}
                {skill.has_zip && <InstallButtons skillName={skill.skill_name} />}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
