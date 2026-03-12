import type { Metadata } from "next";
import { AppFrame } from "@/components/product/app-frame";
import { SkillsBrowser } from "@/components/product/skills-browser";
import styles from "../product-page.module.css";

export const metadata: Metadata = {
  title: "Skills | Creator Skill Generator",
  description:
    "Browse skill bundles stored in Supabase, inspect their files, and install them in Codex or Claude Code.",
};

export default function SkillsPage() {
  return (
    <AppFrame currentPage="skills">
      <div className={styles.page}>
        <section className={styles.content}>
          <SkillsBrowser />
        </section>
      </div>
    </AppFrame>
  );
}
