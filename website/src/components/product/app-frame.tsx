import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import styles from "./app-frame.module.css";

type CurrentPage = "home" | "about" | "skills" | "create";

type AppFrameProps = {
  children: ReactNode;
  currentPage?: CurrentPage;
};

export function AppFrame({ children, currentPage }: AppFrameProps) {
  return (
    <div className={styles.page}>
      <div className={styles.gridBackdrop} aria-hidden="true" />
      <div className={styles.heroGlowOrange} aria-hidden="true" />
      <div className={styles.heroGlowViolet} aria-hidden="true" />

      <SiteHeader currentPage={currentPage} />

      <main className={styles.main}>{children}</main>
    </div>
  );
}
