"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./page.module.css";
import { SiteHeader } from "@/components/site-header";

type WorkflowCard = {
  title: string;
  body: string;
  visual: "sources" | "inputs" | "bundle";
  points?: Array<{ label: string; text: string }>;
  list?: string[];
};

const navItems = [
  { label: "Overview", href: "#features" },
  { label: "Flow", href: "#workflows" },
  { label: "Why", href: "#why" },
  { label: "Backend", href: "#pricing" },
];

const featureCards = [
  {
    title: "Source-derived generation",
    body: "Generate grounded skill bundles from creator material instead of starting from a blank one-off prompt.",
  },
  {
    title: "Twitter/X + YouTube ingestion",
    body: "The unified backend supports raw pasted content plus Twitter/X and YouTube transcript ingestion.",
  },
  {
    title: "Progressive disclosure shape",
    body: "Keep SKILL.md focused while heavier guidance moves into references/ and optional companion metadata.",
  },
  {
    title: "Portable exports",
    body: "Return generated files directly, persist bundles under generated_skills/, and ship reusable zip exports.",
  },
];

const workflowCards: WorkflowCard[] = [
  {
    title: "Gather creator source material",
    body: "Start with pasted scripts, posts, notes, or transcripts. The backend extracts recurring structure, tone, constraints, and examples from real source material.",
    visual: "sources",
    points: [
      {
        label: "Grounded extraction",
        text: "The workflow starts from evidence in the creator corpus, not a generic scaffold or random prompt.",
      },
      {
        label: "Focused entrypoint",
        text: "It keeps SKILL.md concise and pushes bulky detail into references/ for progressive disclosure.",
      },
    ],
  },
  {
    title: "Generate from multiple inputs",
    body: "The active FastAPI backend supports raw pasted content plus Twitter/X and YouTube ingestion, then folds everything into the same generation flow.",
    visual: "inputs",
    list: [
      "Use v1 for raw pasted creator content.",
      "Use v2 for raw content plus Twitter/X and YouTube ingestion.",
      "Return generated files directly in the API response.",
    ],
  },
  {
    title: "Export reusable skill bundles",
    body: "Persist bundles, create zip exports, and hand off a SKILL.md-centered package that Codex and Claude Code can both consume.",
    visual: "bundle",
    points: [
      {
        label: "Portable shape",
        text: "Generated output centers on SKILL.md, references/, and optional agents/openai.yaml metadata.",
      },
      {
        label: "Workflow reuse",
        text: "Reuse the same grounded skill across sessions, projects, and tools instead of rewriting context every time.",
      },
    ],
  },
];

const insightCards = [
  {
    kind: "metric",
    eyebrow: "Progressive disclosure",
    stat: "1 bundle",
    body: "Keep the entrypoint focused and move large examples, sources, and framework notes into references/.",
  },
  {
    kind: "highlight",
    title: "Grounded beats generic",
    body: "This project is strongest when you already have creator material and want a reusable skill extracted from evidence.",
  },
  {
    kind: "team",
    title: "Works across tools",
    body: "The generated package is shaped for skills-compatible tools such as Codex and Claude Code.",
  },
] as const;

const trustStats = [
  {
    value: "v1/v2",
    text: "The unified backend exposes versioned workflows for raw content and multi-source ingestion.",
  },
  {
    value: "ZIP",
    text: "Generated skills can be returned, persisted, listed, fetched, exported, and deleted.",
  },
];

function renderWorkflowVisual(visual: WorkflowCard["visual"]) {
  if (visual === "sources") {
    return (
      <div className={`${styles.workflowShell} ${styles.sourcesShell}`}>
        <div className={styles.workflowShellHeader}>
          <span>Creator inputs</span>
          <span>3 sources</span>
        </div>

        <div className={styles.sourceList}>
          <article className={styles.sourceItem}>
            <span className={`${styles.sourceBadge} ${styles.sourceBadgeYoutube}`}>YT</span>
            <div className={styles.sourceMeta}>
              <strong>YouTube transcript</strong>
              <small>22 segments imported</small>
            </div>
          </article>
          <article className={styles.sourceItem}>
            <span className={`${styles.sourceBadge} ${styles.sourceBadgeTwitter}`}>X</span>
            <div className={styles.sourceMeta}>
              <strong>Twitter/X thread</strong>
              <small>9 posts clustered</small>
            </div>
          </article>
          <article className={styles.sourceItem}>
            <span className={`${styles.sourceBadge} ${styles.sourceBadgePaste}`}>TXT</span>
            <div className={styles.sourceMeta}>
              <strong>Pasted creator notes</strong>
              <small>4 long-form examples</small>
            </div>
          </article>
        </div>

        <div className={styles.extractGrid}>
          <div className={styles.extractCard}>
            <small>Tone pattern</small>
            <strong>direct + repeatable</strong>
            <span className={styles.extractBar}>
              <span style={{ width: "78%" }} />
            </span>
          </div>
          <div className={styles.extractCard}>
            <small>Format signal</small>
            <strong>hook / proof / CTA</strong>
            <span className={styles.extractBar}>
              <span style={{ width: "86%" }} />
            </span>
          </div>
          <div className={styles.extractCard}>
            <small>Constraint fit</small>
            <strong>references-ready</strong>
            <span className={styles.extractBar}>
              <span style={{ width: "64%" }} />
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (visual === "inputs") {
    return (
      <div className={`${styles.workflowShell} ${styles.inputsShell}`}>
        <div className={styles.workflowShellHeader}>
          <span>Generation flow</span>
          <span>multi-source</span>
        </div>

        <div className={styles.inputsCanvas}>
          <div className={styles.inputsSourceStack}>
            <article className={styles.flowSourceCard}>
              <span className={`${styles.flowSourcePill} ${styles.flowSourcePaste}`}>paste</span>
              <strong>Raw creator text</strong>
              <small>scripts, posts, transcripts</small>
            </article>
            <article className={styles.flowSourceCard}>
              <span className={`${styles.flowSourcePill} ${styles.flowSourceV1}`}>v1</span>
              <strong>Direct parser</strong>
              <small>fast structure extraction</small>
            </article>
            <article className={styles.flowSourceCard}>
              <span className={`${styles.flowSourcePill} ${styles.flowSourceV2}`}>v2</span>
              <strong>Social + video</strong>
              <small>Twitter/X and YouTube ingestion</small>
            </article>
          </div>

          <div className={styles.flowCoreCard}>
            <span className={styles.flowCoreLabel}>Merge engine</span>
            <div>
              <strong>Pattern assembly</strong>
              <small>tone, structure, workflow, constraints</small>
            </div>
            <div className={styles.flowCoreGrid} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className={styles.flowChipRow}>
              <span>tone</span>
              <span>examples</span>
              <span>constraints</span>
            </div>
          </div>
        </div>

        <article className={styles.flowResultCard}>
          <div>
            <span className={styles.flowResultLabel}>Bundle ready</span>
            <strong>Grounded skill bundle</strong>
            <small>consistent across every source path</small>
          </div>
          <div className={styles.flowResultTags}>
            <span>SKILL.md</span>
            <span>references/</span>
            <span>zip</span>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className={`${styles.workflowShell} ${styles.bundleShell}`}>
      <div className={styles.workflowShellHeader}>
        <span>Generated package</span>
        <span>portable export</span>
      </div>

      <div className={styles.bundleTree}>
        <div className={`${styles.bundleTreeItem} ${styles.bundleTreeItemActive}`}>
          <span>SKILL.md</span>
          <small>entrypoint</small>
        </div>
        <div className={styles.bundleTreeItem}>
          <span>references/framework.md</span>
          <small>loaded on demand</small>
        </div>
        <div className={styles.bundleTreeItem}>
          <span>references/examples.md</span>
          <small>source-backed examples</small>
        </div>
        <div className={styles.bundleTreeItem}>
          <span>agents/openai.yaml</span>
          <small>optional metadata</small>
        </div>
      </div>

      <div className={styles.bundleExportCard}>
        <span className={styles.bundleChip}>ZIP ready</span>
        <strong>creator-skill-pack.zip</strong>
        <small>folder + export artifact</small>
      </div>
    </div>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();

  const revealViewport = { once: true, amount: 0.16 };
  const hoverEase = [0.22, 1, 0.36, 1] as const;

  const spring200 = (delay = 0) =>
    reduceMotion
      ? { duration: 0 }
      : { type: "spring" as const, stiffness: 200, damping: 60, mass: 1, delay };

  const fadeUp = (delay = 0, y = 50) =>
    reduceMotion
      ? { initial: false }
      : {
          initial: { opacity: 0, y },
          whileInView: { opacity: 1, y: 0 },
          viewport: revealViewport,
          transition: spring200(delay),
        };

  const slideLeft = (delay = 0, x = -30) =>
    reduceMotion
      ? { initial: false }
      : {
          initial: { opacity: 0, x },
          whileInView: { opacity: 1, x: 0 },
          viewport: revealViewport,
          transition: spring200(delay),
        };

  const hoverLift = (y = -6, scale = 1.01) =>
    reduceMotion
      ? {}
      : {
          whileHover: {
            y,
            scale,
            transition: { duration: 0.24, ease: hoverEase },
          },
        };

  return (
    <div className={styles.page}>
      <div className={styles.gridBackdrop} aria-hidden="true" />

      <motion.div
        className={styles.heroGlowOrange}
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0.001, scale: 0.9 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={spring200(0.6)}
      />
      <motion.div
        className={styles.heroGlowViolet}
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0.001 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        transition={spring200(0.6)}
      />

      <SiteHeader currentPage="home" />

      <main id="top" className={styles.main}>
        <section className={styles.heroSection}>
          <motion.div className={styles.heroCopy} {...fadeUp(0.6, 50)}>
            <p className={styles.eyebrow}>Source-driven skill builder</p>
            <h1>
              <span className={styles.heroLine}>Creator material,</span>
              <span className={styles.heroLine}>turned into</span>
              <span className={styles.heroLine}>
                reusable <span className={styles.heroAccent}>skills.</span>
              </span>
            </h1>
            <p className={styles.heroText}>
              Creator Skill Generator turns creator corpora into portable,
              SKILL.md-centered packages that can be reused in Codex and Claude Code.
            </p>

            <div className={styles.heroActions}>
              <Link className={`${styles.button} ${styles.buttonDark}`} href="/create-new-skill">
                <span>Create a Skill</span>
                <span className={styles.buttonIcon} aria-hidden="true">
                  →
                </span>
              </Link>
              <Link className={`${styles.button} ${styles.buttonGhost}`} href="/skills">
                <span>Browse Skills</span>
                <span className={styles.buttonGhostIcon} aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </motion.div>

          <div className={styles.heroVisual}>
            <div className={styles.heroGrid} aria-hidden="true" />

            <motion.div
              className={styles.dashboard}
              initial={reduceMotion ? false : { opacity: 0.001, scale: 0.9 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={spring200(0.6)}
              {...hoverLift(-10, 1.012)}
            >
              <div className={styles.dashboardSidebar}>
                <span className={styles.sidebarBrand}>Creator Skill Generator</span>
                <span className={styles.sidebarSearch} />

                <div className={styles.sidebarGroup}>
                  <span className={styles.sidebarLabel}>Main menu</span>
                  <span className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}>
                    Sources
                  </span>
                  <span className={styles.sidebarItem}>Analysis</span>
                  <span className={styles.sidebarItem}>Bundles</span>
                  <span className={styles.sidebarItem}>Exports</span>
                </div>

                <div className={styles.sidebarGroup}>
                  <span className={styles.sidebarLabel}>Signals</span>
                  <span className={styles.sidebarItem}>Twitter/X</span>
                  <span className={styles.sidebarItem}>YouTube</span>
                </div>
              </div>

              <div className={styles.dashboardMain}>
                <div className={styles.dashboardHeader}>
                  <span className={styles.dashboardTitle}>Generation overview</span>
                  <span className={styles.liveBadge}>Backend first</span>
                </div>

                <div className={styles.dashboardStats}>
                  <article className={styles.statCard}>
                    <span>Input modes</span>
                    <strong>3</strong>
                    <small>raw text, Twitter/X, YouTube</small>
                  </article>
                  <article className={styles.statCard}>
                    <span>Bundle parts</span>
                    <strong>4</strong>
                    <small>SKILL.md, refs, agents, zip</small>
                  </article>
                </div>

                <article className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <span>Unified backend</span>
                    <span>v1 + v2</span>
                  </div>
                  <div className={styles.chartBars} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span className={styles.chartBarAccent} />
                  </div>
                </article>
              </div>
            </motion.div>

            <motion.div
              className={styles.demoPill}
              initial={reduceMotion ? false : { opacity: 0, y: 50 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={spring200(0.78)}
              {...hoverLift(-4, 1.01)}
            >
              <span className={styles.playRing} aria-hidden="true" />
              <span>Preview SKILL.md</span>
            </motion.div>
          </div>
        </section>

        <section id="features" className={styles.featureSection}>
          <div className={styles.featureGrid}>
            {featureCards.map((card, index) => (
              <motion.article
                key={card.title}
                className={styles.featureCard}
                {...fadeUp(index * 0.08, 50)}
                {...hoverLift(-8, 1.015)}
              >
                <span className={styles.featureIcon} aria-hidden="true" />
                <h4>{card.title}</h4>
                <p>{card.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="workflows" className={styles.workflowSection}>
          {workflowCards.map((card, index) => (
            <motion.article
              key={card.title}
              className={`${styles.workflowCard} ${index % 2 === 1 ? styles.workflowCardReverse : ""}`}
              {...fadeUp(0.1 + index * 0.06, 50)}
            >
              <div className={styles.workflowCopy}>
                <h2>{card.title}</h2>
                <p>{card.body}</p>

                {card.points ? (
                  <div className={styles.workflowPoints}>
                    {card.points.map((point) => (
                      <div key={point.label} className={styles.pointCard}>
                        <strong>{point.label}</strong>
                        <span>{point.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className={styles.workflowList}>
                    {card.list?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={styles.workflowVisual}>
                <div className={styles.workflowFrame}>{renderWorkflowVisual(card.visual)}</div>
              </div>
            </motion.article>
          ))}
        </section>

        <section id="why" className={styles.insightSection}>
          <motion.div className={styles.sectionHeading} {...fadeUp(0.08, 50)}>
            <p className={styles.eyebrow}>Why skills win</p>
            <h2>Why this project exists</h2>
            <p>
              Repeated creator prompting is slow, inconsistent, and hard to reuse.
              This project turns repeated creator context into a reusable skill package.
            </p>
          </motion.div>

          <div className={styles.insightGrid}>
            {insightCards.map((card, index) => (
              <motion.article
                key={card.kind === "metric" ? card.eyebrow : card.title}
                className={`${styles.insightCard} ${card.kind === "highlight" ? styles.insightCardHighlight : ""}`}
                {...fadeUp(index * 0.08, 50)}
                {...hoverLift(-8, 1.012)}
              >
                {card.kind === "metric" ? (
                  <div className={styles.insightTop}>
                    <span>{card.eyebrow}</span>
                    <strong>{card.stat}</strong>
                  </div>
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p>{card.body}</p>

                {card.kind === "team" && (
                  <div className={styles.avatarRow} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        </section>

        <section id="pricing" className={styles.trustSection}>
          <motion.div className={styles.sectionHeading} {...fadeUp(0.08, 50)}>
            <p className={styles.eyebrow}>Repository status</p>
            <h2>Backend first, website second</h2>
            <p>
              The website now proxies the FastAPI backend and exposes generator,
              saved-skill, and detail views on top of the existing API contract.
            </p>
          </motion.div>

          <div className={styles.trustCards}>
            {trustStats.map((item, index) => (
              <motion.article
                key={item.value}
                className={styles.trustCard}
                {...fadeUp(index * 0.08, 50)}
                {...hoverLift(-8, 1.012)}
              >
                <strong>{item.value}</strong>
                <span>{item.text}</span>
              </motion.article>
            ))}
          </div>
        </section>

        <motion.section id="cta" className={styles.ctaBand} {...fadeUp(0.08, 50)}>
          <div>
            <p className={styles.eyebrow}>Next step</p>
            <h2>Create your first skill bundle</h2>
            <p>
              Start with pasted creator text, Twitter/X, or YouTube transcripts,
              then export a reusable SKILL.md-centered bundle.
            </p>
          </div>

          <Link className={`${styles.button} ${styles.buttonDark}`} href="/create-new-skill">
            <span>Create a Skill</span>
            <span className={styles.buttonIcon} aria-hidden="true">
              →
            </span>
          </Link>
        </motion.section>
      </main>

      <footer className={styles.siteFooter}>
        <motion.div className={styles.footerBrandWrap} {...slideLeft(0.08, -30)}>
          <a className={styles.brand} href="#top" aria-label="Creator Skill Generator home">
            <span className={styles.brandMark} aria-hidden="true" />
            <span className={styles.brandWord}>Creator Skill Generator</span>
          </a>
        </motion.div>

        <motion.div className={styles.footerMenus} {...fadeUp(0.12, 50)}>
          <div className={styles.footerColumn}>
            <p className={styles.footerTitle}>Navigation</p>
            {navItems.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
            <Link href="/about">About</Link>
            <Link href="/skills">Skills</Link>
            <Link href="/create-new-skill">Create</Link>
          </div>
          <div className={styles.footerColumn}>
            <p className={styles.footerTitle}>Repository</p>
            <a href="#features">Why Skills</a>
            <a href="#workflows">Generation Flow</a>
            <a href="#why">Why It Exists</a>
            <a href="#pricing">Backend Today</a>
          </div>
        </motion.div>

        <div className={styles.footerContact}>
          <motion.div className={styles.footerSocial} {...slideLeft(0.18, -30)}>
            <p className={styles.footerSocialTitle}>Jump to Sections</p>
            <div className={styles.socialRow}>
              <a href="#features">
                ov
              </a>
              <a href="#workflows">
                wf
              </a>
              <a href="#pricing">
                api
              </a>
            </div>
          </motion.div>

          <motion.div className={styles.contactLinks} {...slideLeft(0.24, -30)}>
            <Link href="/create-new-skill">Create a skill</Link>
            <Link href="/skills">Browse saved bundles</Link>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
