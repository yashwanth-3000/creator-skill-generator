"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import styles from "./skill-detail.module.css";
import viewerStyles from "./skill-viewer.module.css";
import { SkillViewer } from "./skill-viewer";
import {
  deleteSkill,
  fileDownloadUrl,
  getSkill,
  zipDownloadUrl,
} from "@/lib/frontend-api";
import type { SkillDetail as SkillDetailType } from "@/lib/backend-types";

type SkillDetailProps = {
  skillName: string;
};

export function SkillDetail({ skillName }: SkillDetailProps) {
  const router = useRouter();
  const [skill, setSkill] = useState<SkillDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      setIsLoading(true);
      try {
        const res = await getSkill(skillName);
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
      const res = await getSkill(skillName);
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
        await deleteSkill(skillName);
        router.push("/skills");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed.");
      }
    });
  }

  const bundleSidebar = skill ? (
    <div className={viewerStyles.sidebarSection}>
      <p className={viewerStyles.sidebarLabel}>Bundle</p>
      <div className={viewerStyles.summaryList}>
        {[
          { label: "Files", value: <strong>{skill.files.length}</strong> },
          {
            label: "Entry point",
            value: (
              <span className={`${viewerStyles.badge} ${skill.has_skill_md ? viewerStyles.badgeGreen : viewerStyles.badgeGray}`}>
                {skill.has_skill_md ? "ready" : "missing"}
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
          <h1 className={styles.title}>{skill?.name ?? skillName}</h1>
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
          files={skill.files}
          skillName={skill.name}
          downloadFileUrl={fileDownloadUrl}
          sidebarTop={bundleSidebar}
        />
      )}
    </motion.div>
  );
}
