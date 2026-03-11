import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import styles from "./app-frame.module.css";

type CurrentPage = "home" | "about" | "skills" | "create" | "live-test";

type AppFrameProps = {
  children: ReactNode;
  currentPage?: CurrentPage;
  hideFooter?: boolean;
};

export function AppFrame({ children, currentPage, hideFooter }: AppFrameProps) {
  return (
    <div className={styles.page}>
      <div className={styles.gridBackdrop} aria-hidden="true" />
      <div className={styles.heroGlowOrange} aria-hidden="true" />
      <div className={styles.heroGlowViolet} aria-hidden="true" />

      <SiteHeader currentPage={currentPage} />

      <main className={styles.main}>{children}</main>

      {!hideFooter && (
        <footer className={styles.siteFooter}>
          <div className={styles.footerBrand}>
            <Link className={styles.footerBrandLink} href="/" aria-label="Creator Skill Generator home">
              <span className={styles.footerBrandMark} aria-hidden="true" />
              <span className={styles.footerBrandWord}>Creator Skill Generator</span>
            </Link>
          </div>

          <div className={styles.footerLinks}>
            <Link href="/skills">Skills</Link>
            <Link href="/about">About</Link>
            <Link href="/create-new-skill">Create</Link>
          </div>
        </footer>
      )}
    </div>
  );
}
