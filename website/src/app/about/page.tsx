import Link from "next/link";
import styles from "./page.module.css";
import { SiteHeader } from "@/components/site-header";

const stats = [
  { value: "3", label: "Input paths: raw text, Twitter/X, and YouTube." },
  { value: "2", label: "Versioned API workflows in one FastAPI backend." },
  { value: "4", label: "Core bundle layers users can inspect and keep." },
  { value: "1", label: "Main goal: reusable skill output, not one-off prompting." },
];

const corpusItems = [
  {
    tag: "paste",
    title: "Raw creator text",
    body: "scripts, notes, workflows",
  },
  {
    tag: "x",
    title: "Twitter/X import",
    body: "recent posts grouped into one corpus",
  },
  {
    tag: "yt",
    title: "YouTube transcripts",
    body: "video language folded into the same flow",
  },
];

const bundleRows = [
  "SKILL.md",
  "references/framework.md",
  "references/examples.md",
  "references/sources.md",
  "agents/openai.yaml",
];

const traceSteps = [
  {
    title: "Request enters a versioned route.",
    body: "A generation call lands on /api/v1 for raw paste or /api/v2 when the user wants Twitter/X or YouTube ingestion.",
  },
  {
    title: "Validation rejects weak or unsafe inputs.",
    body: "Minimum content length, URL requirements, username bounds, and path traversal guards all run before the generation pipeline starts.",
  },
  {
    title: "Optional fetchers pull external source material.",
    body: "The X client resolves recent tweets while the YouTube client gathers transcript text so every route ends with one normalized corpus.",
  },
  {
    title: "CrewAI extracts what actually repeats.",
    body: "The backend looks for tone, structure, constraints, workflow steps, and source-backed examples instead of producing a generic prompt dump.",
  },
  {
    title: "The bundle is assembled around one entrypoint.",
    body: "SKILL.md becomes the activation surface, heavier guidance is split into references, and optional openai.yaml metadata is added when requested.",
  },
  {
    title: "Delivery stays portable.",
    body: "The API can return files immediately, persist the bundle under generated_skills, and expose later list, fetch, copy, delete, and zip export paths.",
  },
];

const principles = [
  {
    number: "01",
    title: "Evidence over invention",
    body: "The product is most useful when it starts from real creator material. It should infer the workflow from evidence instead of guessing it from a vague brief.",
  },
  {
    number: "02",
    title: "The entrypoint stays short",
    body: "SKILL.md should explain the repeatable job clearly, not carry every example and note. Bigger material belongs in references where it can be loaded only when needed.",
  },
  {
    number: "03",
    title: "Portable output is the feature",
    body: "A good result is one the user can review, export, reinstall, and use again in a later task. That is why package shape matters as much as the generation step.",
  },
  {
    number: "04",
    title: "The product state stays honest",
    body: "The backend is the working product today. The website is the shell around it. Being explicit about that makes both the UX and the roadmap clearer.",
  },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.gridBackdrop} aria-hidden="true" />
      <div className={styles.heroGlowOrange} aria-hidden="true" />
      <div className={styles.heroGlowViolet} aria-hidden="true" />

      <SiteHeader currentPage="about" />

      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.heroKicker}>About the project</p>
          <h1 className={styles.heroTitle}>
            Creator material,
            <br />
            turned into
            <br />
            reusable <span>skills.</span>
          </h1>
          <p className={styles.heroLead}>
            Creator Skill Generator turns creator source material into portable,
            SKILL.md-centered bundles. This page explains the product in plain
            language and keeps the layout intentionally article-like.
          </p>
        </section>

        <article className={styles.article}>
          <section id="story" className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionKicker}>Why it exists</p>
              <h2>Built for the moment prompts stop scaling.</h2>
            </div>

            <div className={styles.prose}>
              <p>
                This project started from a simple but repeatable failure mode:
                creator workflows keep collapsing back into the same manual
                prompt ritual. Paste a long brief. Re-explain the tone. Re-state
                the structure. Re-state the constraints. Hope the model stays
                consistent.
              </p>
              <p>
                That workflow does not scale. It is slow, brittle, hard to
                review, and almost impossible to reuse cleanly across sessions.
                The goal here is to package stable creator context once, then let
                future tasks start from that packaged knowledge instead of
                rebuilding it from scratch every time.
              </p>
              <p>
                The result should not feel magical. It should feel inspectable.
                One clear entrypoint, supporting references where bulk material
                belongs, and a bundle shape that can keep working after the
                current chat is over.
              </p>
            </div>

            <div className={styles.pullQuote}>
              <p>
                Do not rewrite the creator context every time. Package it once,
                then reuse it.
              </p>
            </div>

            <div className={styles.statStrip}>
              {stats.map((item) => (
                <div key={item.label} className={styles.statCell}>
                  <p className={styles.statValue}>{item.value}</p>
                  <p className={styles.statLabel}>{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="bundle" className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionKicker}>Bundle shape</p>
              <h2>From creator corpus to portable skill package.</h2>
            </div>

            <div className={styles.prose}>
              <p>
                This is the main structural move in the product. Different kinds
                of creator material are normalized into one corpus, then written
                back out as a package that can be reviewed, exported, and reused.
              </p>
            </div>

            <div className={styles.flowCard}>
              <div className={styles.flowColumn}>
                <p className={styles.flowHeading}>Creator corpus</p>
                <div className={styles.flowItemList}>
                  {corpusItems.map((item) => (
                    <div key={item.title} className={styles.flowItem}>
                      <span className={styles.flowTag}>{item.tag}</span>
                      <div>
                        <p className={styles.flowItemTitle}>{item.title}</p>
                        <p className={styles.flowItemBody}>{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.flowArrow} aria-hidden="true">
                →
              </div>

              <div className={styles.flowColumn}>
                <p className={styles.flowHeading}>Portable skill package</p>
                <div className={styles.bundlePanel}>
                  <p className={styles.bundlePanelLabel}>Generated bundle</p>
                  <p className={styles.bundlePanelTitle}>creator-skill/</p>
                  <div className={styles.bundleTree}>
                    {bundleRows.map((row) => (
                      <div key={row} className={styles.bundleRow}>
                        <span className={styles.bundleDot} aria-hidden="true" />
                        <p>{row}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <p className={styles.bundleNote}>
                  Reusable in skills-compatible tools and exportable as zip.
                </p>
              </div>
            </div>
          </section>

          <section id="trace" className={styles.section}>
            <div className={styles.traceHeader}>
              <div>
                <p className={styles.sectionKicker}>Request flow</p>
                <h2>Source to skill bundle</h2>
              </div>
              <span className={styles.traceMeta}>example backend trace</span>
            </div>

            <div className={styles.traceCard}>
              {traceSteps.map((step, index) => {
                const isLast = index === traceSteps.length - 1;

                return (
                  <div key={step.title} className={styles.traceStep}>
                    <div className={styles.traceRail} aria-hidden="true">
                      <span className={styles.traceBullet} />
                      {!isLast && <span className={styles.traceLine} />}
                    </div>
                    <div className={styles.traceContent}>
                      <p className={styles.traceTitle}>{step.title}</p>
                      <p className={styles.traceBody}>{step.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="principles" className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionKicker}>Principles</p>
              <h2>Four rules that keep the product honest.</h2>
            </div>

            <div className={styles.principlesList}>
              {principles.map((principle) => (
                <div key={principle.number} className={styles.principleRow}>
                  <p className={styles.principleNumber}>{principle.number}</p>
                  <div className={styles.principleContent}>
                    <p className={styles.principleTitle}>{principle.title}</p>
                    <p className={styles.principleBody}>{principle.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.ctaBand}>
            <p className={styles.sectionKicker}>Next step</p>
            <h2>Explore the backend-first product surface.</h2>
            <p className={styles.ctaBody}>
              The home page covers the generation flow. This page explains why
              the product is structured that way.
            </p>

            <div className={styles.ctaActions}>
              <Link className={`${styles.button} ${styles.buttonDark}`} href="/create-new-skill">
                <span>Create a Skill</span>
                <span className={styles.buttonIcon} aria-hidden="true">
                  →
                </span>
              </Link>
              <Link className={`${styles.button} ${styles.buttonGhostLight}`} href="/skills">
                <span>Browse Skills</span>
                <span className={styles.buttonGhostLightIcon} aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </section>
        </article>
      </main>

    </div>
  );
}
