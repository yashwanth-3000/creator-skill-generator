import type { Metadata } from "next";
import { AppFrame } from "@/components/product/app-frame";
import { SkillsBrowser } from "@/components/product/skills-browser";
import styles from "../product-page.module.css";

export const metadata: Metadata = {
  title: "Skills | Creator Skill Generator",
  description:
    "Browse skill bundles stored in Supabase, inspect their files, and install them in Codex or Claude Code.",
};

const metrics = [
  { value: "Search", label: "filter by skill slug or file path" },
  { value: "Inspect", label: "open full bundle detail and file contents" },
  { value: "Export", label: "download existing zip archives from the backend" },
];

const managementNotes = [
  {
    endpoint: "Supabase — skills table",
    detail: "Lists all generated bundles with metadata, source mode, and file counts.",
  },
  {
    endpoint: "Supabase — skill_files table",
    detail: "Loads full file contents for a single skill bundle.",
  },
  {
    endpoint: "Auto-save on generation",
    detail: "Every new skill is automatically persisted to the database after generation.",
  },
];

export default function SkillsPage() {
  return (
    <AppFrame currentPage="skills">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            <p className={styles.kicker}>Saved bundles</p>
            <h1 className={styles.title}>Browse generated skill bundles.</h1>
            <p className={styles.lead}>
              Skills are automatically saved to a Supabase database after generation.
              Search, inspect files, and install bundles directly into Codex or Claude Code.
            </p>

            <div className={styles.metricGrid}>
              {metrics.map((metric) => (
                <div key={metric.label} className={styles.metricCard}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className={styles.sideCard}>
            <p className={styles.kicker}>Data layer</p>
            <h2 className={styles.sideCardTitle}>How skills are stored</h2>
            <p className={styles.sideCardLead}>
              Generated skills are persisted to Supabase and fetched directly by the frontend.
            </p>

            <div className={styles.sideList}>
              {managementNotes.map((note) => (
                <div key={note.endpoint} className={styles.sideItem}>
                  <code>{note.endpoint}</code>
                  <span>{note.detail}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className={styles.content}>
          <SkillsBrowser />
        </section>
      </div>
    </AppFrame>
  );
}
