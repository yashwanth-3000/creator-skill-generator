"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import styles from "./skill-detail.module.css";
import viewerStyles from "./skill-viewer.module.css";
import { SkillViewer } from "./skill-viewer";
import {
  fileDownloadUrl,
  zipDownloadUrl,
} from "@/lib/frontend-api";
import {
  fetchSkillDetailFromSupabase,
  deleteSkillFromSupabase,
  type SkillWithFiles,
} from "@/lib/supabase";

function buildZipAbsoluteUrl(skillName: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${zipDownloadUrl(skillName)}`;
}

function buildCodexInstallCmd(skillName: string) {
  const zipUrl = buildZipAbsoluteUrl(skillName);
  return `curl -L "${zipUrl}" -o /tmp/${skillName}.zip && mkdir -p ~/.codex/skills/${skillName} && unzip -o /tmp/${skillName}.zip -d ~/.codex/skills/${skillName}/ && rm /tmp/${skillName}.zip`;
}

type SkillDetailProps = {
  skillName: string;
};

export function SkillDetail({ skillName }: SkillDetailProps) {
  const router = useRouter();
  const [skill, setSkill] = useState<SkillWithFiles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<"codex" | "claude" | null>(null);

  const handleCopy = useCallback((target: "codex" | "claude") => {
    const cmd = target === "codex"
      ? buildCodexInstallCmd(skillName)
      : `curl -L "${buildZipAbsoluteUrl(skillName)}" -o /tmp/${skillName}.zip && mkdir -p ~/.claude/skills/${skillName} && unzip -o /tmp/${skillName}.zip -d ~/.claude/skills/${skillName}/ && rm /tmp/${skillName}.zip`;
    navigator.clipboard.writeText(cmd);
    setCopied(target);
    setTimeout(() => setCopied(null), 2000);
  }, [skillName]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      setIsLoading(true);
      try {
        const res = await fetchSkillDetailFromSupabase(skillName);
        if (cancelled) return;
        setSkill(res);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unable to load skill.");
        setSkill(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [skillName]);

  async function refreshSkill() {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetchSkillDetailFromSupabase(skillName);
      setSkill(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load skill.");
      setSkill(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${skillName}"?`)) return;
    startTransition(async () => {
      try {
        await deleteSkillFromSupabase(skillName);
        router.push("/skills");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed.");
      }
    });
  }

  const hasSkillMd = skill?.skill_files.some((f) => f.relative_path === "SKILL.md") ?? false;
  const viewerFiles = skill?.skill_files.map((f) => ({
    relative_path: f.relative_path,
    content: f.content,
  })) ?? [];

  const bundleSidebar = skill ? (
    <div className={viewerStyles.sidebarSection}>
      <p className={viewerStyles.sidebarLabel}>Bundle</p>
      <div className={viewerStyles.summaryList}>
        {[
          { label: "Files", value: <strong>{skill.skill_files.length}</strong> },
          {
            label: "Entry point",
            value: (
              <span className={`${viewerStyles.badge} ${hasSkillMd ? viewerStyles.badgeGreen : viewerStyles.badgeGray}`}>
                {hasSkillMd ? "ready" : "missing"}
              </span>
            ),
          },
          {
            label: "Archive",
            value: (
              <span className={`${viewerStyles.badge} ${skill.has_zip ? viewerStyles.badgeGreen : viewerStyles.badgeGray}`}>
                {skill.has_zip ? "zip ready" : "none"}
              </span>
            ),
          },
          {
            label: "Source",
            value: <strong>{skill.source_mode}</strong>,
          },
          {
            label: "Created",
            value: <strong>{new Date(skill.created_at).toLocaleDateString()}</strong>,
          },
        ].map(({ label, value }) => (
          <div key={label} className={viewerStyles.summaryRow}>
            <span>{label}</span>
            {value}
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <motion.div
      className={styles.detail}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerMeta}>
          <Link href="/skills" className={styles.breadcrumb}>← Skills</Link>
          <p className={styles.kicker}>Saved skill</p>
          <h1 className={styles.title}>{skill?.skill_name ?? skillName}</h1>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.ghostButton}
            type="button"
            onClick={() => void refreshSkill()}
          >
            Refresh
          </button>
          {skill?.has_zip && (
            <a className={styles.ghostButton} href={zipDownloadUrl(skillName)}>
              Download zip
            </a>
          )}
          <button
            className={`${styles.codexButton} ${copied === "codex" ? styles.codexButtonCopied : ""}`}
            type="button"
            onClick={() => handleCopy("codex")}
            title="Copy a shell command to install this skill in Codex CLI"
          >
            {copied === "codex" ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                {/* OpenAI logo */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                </svg>
                Codex install
              </>
            )}
          </button>
          <button
            className={`${styles.claudeInstallButton} ${copied === "claude" ? styles.claudeInstallCopied : ""}`}
            type="button"
            onClick={() => handleCopy("claude")}
            title="Copy a shell command to install this skill in Claude Code"
          >
            {copied === "claude" ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                {/* Anthropic Claude logo */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0H10.172L16.74 20.48H13.138L6.569 3.52zM0 20.48h3.603l6.57-16.96H6.57L0 20.48z"/>
                </svg>
                Claude install
              </>
            )}
          </button>
          <button
            className={styles.dangerButton}
            type="button"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete skill"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            className={styles.errorBanner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {!skill ? (
        <div className={styles.emptyState}>
          <p>{isLoading ? "Loading…" : "Skill unavailable."}</p>
          <Link className={styles.inlineLink} href="/skills">Back to skills</Link>
        </div>
      ) : (
        <SkillViewer
          files={viewerFiles}
          skillName={skill.skill_name}
          downloadFileUrl={fileDownloadUrl}
          sidebarTop={bundleSidebar}
        />
      )}
    </motion.div>
  );
}
