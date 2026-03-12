"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import styles from "./skills-browser.module.css";
import { fetchSkillsFromSupabase, type SkillRow } from "@/lib/supabase";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://creator-skill-backend-production.up.railway.app";

function zipDownloadUrl(skillName: string) {
  return `${BACKEND_URL}/api/v1/export/${encodeURIComponent(skillName)}/zip`;
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
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
