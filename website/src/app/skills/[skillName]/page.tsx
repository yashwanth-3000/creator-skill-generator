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
    endpoint: "GET /api/backend/v1/skills/{name}",
    detail: "Reads every persisted file and renders its contents in the browser.",
  },
  {
    endpoint: "DELETE /api/backend/v1/skills/{name}",
    detail: "Removes the saved bundle directory and any existing zip archive.",
  },
  {
    endpoint: "GET /api/backend/v1/export/{name}/{file}",
    detail: "Allows direct download of any file shown in the preview pane.",
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
              Inspect the persisted bundle, open individual files, download the current
              archive, or remove the bundle from the backend store. The page works against
              the same saved output surfaced in the skills library.
            </p>

            <div className={styles.chipRow}>
              <span className={styles.chip}>File preview</span>
              <span className={styles.chip}>Direct download</span>
              <span className={styles.chip}>Delete bundle</span>
            </div>
          </div>

          <aside className={styles.sideCard}>
            <p className={styles.kicker}>Detail routes</p>
            <h2 className={styles.sideCardTitle}>Bundle operations</h2>
            <p className={styles.sideCardLead}>
              This page closes the loop from generated output to file-level review and
              export.
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
