import type { Metadata } from "next";
import { AppFrame } from "@/components/product/app-frame";
import { SkillDetail } from "@/components/product/skill-detail";
import styles from "../../product-page.module.css";

type SkillDetailPageProps = {
  params: Promise<{ skillName: string }>;
};

export async function generateMetadata(
  { params }: SkillDetailPageProps,
): Promise<Metadata> {
  const { skillName } = await params;

  return {
    title: `${skillName} | Creator Skill Generator`,
    description: `Inspect files, downloads, and bundle status for ${skillName}.`,
  };
}

const detailNotes = [
  {
    endpoint: "Supabase — skill + files",
    detail: "Fetches the skill record and all associated files from the database.",
  },
  {
    endpoint: "Delete from Supabase",
    detail: "Removes the skill and its files from the database.",
  },
  {
    endpoint: "Install to Codex / Claude",
    detail: "One-click copy of a shell command to install the skill bundle locally.",
  },
];

export default async function SkillDetailPage({ params }: SkillDetailPageProps) {
  const { skillName } = await params;

  return (
    <AppFrame currentPage="skills">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            <p className={styles.kicker}>Skill detail</p>
            <h1 className={styles.title}>{skillName}</h1>
            <p className={styles.lead}>
              Inspect the generated bundle, preview individual files, install the skill
              into Codex or Claude Code, or remove it from the database.
            </p>

            <div className={styles.chipRow}>
              <span className={styles.chip}>File preview</span>
              <span className={styles.chip}>Install to Codex / Claude</span>
              <span className={styles.chip}>Delete bundle</span>
            </div>
          </div>

          <aside className={styles.sideCard}>
            <p className={styles.kicker}>Skill operations</p>
            <h2 className={styles.sideCardTitle}>Bundle operations</h2>
            <p className={styles.sideCardLead}>
              Preview files, copy content, install to Codex or Claude Code, or delete
              the skill from the database.
            </p>

            <div className={styles.sideList}>
              {detailNotes.map((note) => (
                <div key={note.endpoint} className={styles.sideItem}>
                  <code>{note.endpoint}</code>
                  <span>{note.detail}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className={styles.content}>
          <SkillDetail skillName={skillName} />
        </section>
      </div>
    </AppFrame>
  );
}
