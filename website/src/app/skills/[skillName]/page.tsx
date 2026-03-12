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
        <section className={styles.content}>
          <SkillDetail skillName={skillName} />
        </section>
      </div>
    </AppFrame>
  );
}
