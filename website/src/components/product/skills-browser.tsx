"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import styles from "./skills-browser.module.css";
import { listSkills, zipDownloadUrl } from "@/lib/frontend-api";
import type { SkillSummary } from "@/lib/backend-types";

export function SkillsBrowser() {
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    startTransition(async () => {
      try {
        const response = await listSkills();
        setSkills(response.skills);
      } catch (refreshError) {
        const detail =
          refreshError instanceof Error
            ? refreshError.message
            : "Unable to load skills from the backend.";
        setError(detail);
      }
    });
  }, []);

  function refreshSkills() {
    setError(null);

    startTransition(async () => {
      try {
        const response = await listSkills();
        setSkills(response.skills);
      } catch (refreshError) {
        const detail =
          refreshError instanceof Error
            ? refreshError.message
            : "Unable to load skills from the backend.";
        setError(detail);
      }
    });
  }

  const filteredSkills = skills.filter((skill) => {
    const needle = deferredQuery.trim().toLowerCase();
    if (!needle) return true;

    return (
      skill.name.toLowerCase().includes(needle) ||
      skill.files.some((file) => file.relative_path.toLowerCase().includes(needle))
    );
  });

  return (
    <div className={styles.browser}>
      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          <span>Search saved skills</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by skill name or file path"
          />
        </label>

        <button className={styles.refreshButton} type="button" onClick={refreshSkills}>
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.summaryRow}>
        <p>{filteredSkills.length} skills available</p>
        <Link className={styles.inlineLink} href="/generate">
          Open generator
        </Link>
      </div>

      <div className={styles.grid}>
        {filteredSkills.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{deferredQuery.trim() ? "No matching saved skills." : "No saved skills yet."}</p>
            <span>
              {deferredQuery.trim()
                ? "Try a different skill name or file path."
                : "Persisted backend output will appear here."}
            </span>
          </div>
        ) : (
          filteredSkills.map((skill) => (
            <article key={skill.name} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h2>{skill.name}</h2>
                  <p>
                    {skill.file_count} files
                    {skill.has_zip ? " · zip ready" : ""}
                  </p>
                </div>
                <span className={styles.cardBadge}>
                  {skill.has_skill_md ? "SKILL.md" : "No SKILL.md"}
                </span>
              </div>

              <div className={styles.fileList}>
                {skill.files.slice(0, 4).map((file) => (
                  <div key={file.relative_path} className={styles.fileItem}>
                    <span>{file.relative_path}</span>
                    <small>{Math.max(1, Math.round(file.size_bytes / 1024))} KB</small>
                  </div>
                ))}
                {skill.file_count > 4 && (
                  <p className={styles.fileOverflow}>+{skill.file_count - 4} more files</p>
                )}
              </div>

              <div className={styles.cardActions}>
                <Link className={styles.primaryAction} href={`/skills/${skill.name}`}>
                  Open detail
                </Link>
                {skill.has_zip && (
                  <a className={styles.secondaryAction} href={zipDownloadUrl(skill.name)}>
                    Download zip
                  </a>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
