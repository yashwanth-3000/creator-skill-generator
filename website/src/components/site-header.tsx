import Link from "next/link";
import styles from "./site-header.module.css";

type CurrentPage = "home" | "about" | "skills" | "create" | "live-test";

type SiteHeaderProps = {
  currentPage?: CurrentPage;
};

const navLinks: Array<{ label: string; href: string; page: CurrentPage }> = [
  { label: "Home",   href: "/",                page: "home" },
  { label: "About",  href: "/about",            page: "about" },
  { label: "Skills", href: "/skills",           page: "skills" },
  { label: "Create", href: "/create-new-skill", page: "create" },
  { label: "Live Test", href: "/live-test",     page: "live-test" },
];

export function SiteHeader({ currentPage }: SiteHeaderProps) {
  return (
    <header className={styles.siteHeader}>
      <Link className={styles.brand} href="/" aria-label="Creator Skill Generator home">
        <span className={styles.brandMark} aria-hidden="true" />
        <span className={styles.brandWord}>Creator Skill Generator</span>
      </Link>

      <nav className={styles.mainNav} aria-label="Primary">
        {navLinks.map(({ label, href, page }) => (
          <Link
            key={page}
            href={href}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>

      <Link
        className={`${styles.button} ${styles.buttonDark}`}
        href="/create-new-skill"
        aria-label="Create a skill"
      >
        <span>Create Skill</span>
        <span className={styles.buttonIcon} aria-hidden="true">→</span>
      </Link>
    </header>
  );
}
