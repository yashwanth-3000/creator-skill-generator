"use client";

import { motion, useReducedMotion } from "framer-motion";
import styles from "./page.module.css";

type WorkflowCard = {
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  imageClassName: "shotLarge" | "shotProfile" | "shotChart";
  points?: Array<{ label: string; text: string }>;
  list?: string[];
};

const navItems = [
  { label: "Platform", href: "#features" },
  { label: "Workflows", href: "#workflows" },
  { label: "Customers", href: "#proof" },
  { label: "Pricing", href: "#pricing" },
];

const featureCards = [
  {
    title: "Scenario generation",
    body: "Generate high-coverage QA scenarios from live product changes, user flows, and regression risk.",
  },
  {
    title: "Flexible automation",
    body: "Route failing checks, assign follow-ups, and coordinate release gates without a second dashboard.",
  },
  {
    title: "Secure audit trails",
    body: "Keep approvals, flaky retries, and production blockers visible with tight, role-based access control.",
  },
  {
    title: "Fresh release context",
    body: "Every suite, deployment, and owner stays synchronized so the team can act on the latest state fast.",
  },
];

const workflowCards: WorkflowCard[] = [
  {
    title: "Release Manager",
    body: "See failing suites, deployment progress, and risk signals in one shared control center before launch.",
    image:
      "https://framerusercontent.com/images/ggLJnqiZxAoXvDNt0FwCX9vT3Jc.png?scale-down-to=1024",
    imageAlt: "Release control dashboard",
    imageClassName: "shotLarge",
    points: [
      {
        label: "Risk scoring",
        text: "Prioritize regressions by severity, blast radius, and customer impact.",
      },
      {
        label: "Launch commands",
        text: "Coordinate approvals, reruns, and rollback readiness from the same pane.",
      },
    ],
  },
  {
    title: "QA Lead",
    body: "Track noisy failures, stabilize brittle flows, and direct focused review where coverage actually matters.",
    image:
      "https://framerusercontent.com/images/1sNt17gI1wQy2QX2W9gzW7vZvc0.png?scale-down-to=1024",
    imageAlt: "QA lead review card",
    imageClassName: "shotProfile",
    list: [
      "Cluster similar failures into one triage lane.",
      "Review high-signal screenshots before escalating to engineering.",
      "Balance browser coverage without duplicating effort.",
    ],
  },
  {
    title: "Engineering Manager",
    body: "Keep shipping velocity high with concise release evidence, workflow ownership, and visible test health trends.",
    image:
      "https://framerusercontent.com/images/TXpGJZ3PoC9dMmdc2h7Rl3SZlU.png?scale-down-to=1024",
    imageAlt: "Engineering release comparison chart",
    imageClassName: "shotChart",
    points: [
      {
        label: "Release analytics",
        text: "Track adoption, escape rate, and test confidence over time.",
      },
      {
        label: "Issue routing",
        text: "Trigger focused handoffs when ownership or service boundaries change.",
      },
    ],
  },
];

const insightCards = [
  {
    kind: "metric",
    eyebrow: "Release automation",
    stat: "92%",
    body: "Faster coordination than spread-out ticket boards and disconnected browser labs.",
  },
  {
    kind: "highlight",
    title: "Customer-facing checkout touched",
    body: "Escalate priority automatically when a critical path changes inside the release branch.",
  },
  {
    kind: "team",
    title: "Cross-team readiness",
    body: "Keep product, engineering, and support aligned with visible launch context and shared evidence.",
  },
] as const;

const trustStats = [
  {
    value: "84%",
    text: "Active users checking the release workspace every month",
  },
  {
    value: "4.9",
    text: "Average rating from 1,938 customers using Creator Skill Generator in production",
  },
];

const growthCards = [
  {
    title: "Critical path monitoring",
    body: "Track checkout, auth, and onboarding changes before they hit production.",
    image:
      "https://framerusercontent.com/images/ChkmE2RxM5sdA7F3c95T0NIHND4.png?scale-down-to=512",
  },
  {
    title: "Launch-safe evidence",
    body: "Bundle screenshots, logs, and approvals into one clean release review.",
    image:
      "https://framerusercontent.com/images/DrKwoytI1bxLWBhRSDKAowGRTwQ.png?scale-down-to=512",
  },
] as const;

const proofPortraitSrc =
  "https://framerusercontent.com/images/sOZtIoamimFQQsbKPa1tUlrMiYA.png?scale-down-to=2048";
const proofLogoSrc =
  "https://framerusercontent.com/images/DyMne4e4YdUulsVMBOQXzGH36fs.png";

export default function Home() {
  const reduceMotion = useReducedMotion();

  const revealViewport = { once: true, amount: 0.28 };
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

      <header className={styles.siteHeader}>
        <a className={styles.brand} href="#top" aria-label="Creator Skill Generator home">
          <span className={styles.brandMark} aria-hidden="true" />
          <span className={styles.brandWord}>Creator Skill Generator</span>
        </a>

        <nav className={styles.mainNav} aria-label="Primary">
          {navItems.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className={`${styles.button} ${styles.buttonDark} ${styles.headerButton}`} href="#cta">
          <span>Get This Layout</span>
          <span className={styles.buttonIcon} aria-hidden="true">
            →
          </span>
        </a>
      </header>

      <main id="top" className={styles.main}>
        <section className={styles.heroSection}>
          <motion.div className={styles.heroCopy} {...fadeUp(0.6, 50)}>
            <p className={styles.eyebrow}>Release control platform</p>
            <h1>Run every release from one clean QA app.</h1>
            <p className={styles.heroText}>
              Monitor regressions, review critical flows, and approve launches
              from one clear control surface.
            </p>

            <div className={styles.heroActions}>
              <a className={`${styles.button} ${styles.buttonDark}`} href="#pricing">
                <span>Start Free Trial</span>
                <span className={styles.buttonIcon} aria-hidden="true">
                  →
                </span>
              </a>
              <a className={`${styles.button} ${styles.buttonGhost}`} href="#proof">
                <span>Book a Demo</span>
                <span className={styles.buttonGhostIcon} aria-hidden="true">
                  →
                </span>
              </a>
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
                    Dashboard
                  </span>
                  <span className={styles.sidebarItem}>Suites</span>
                  <span className={styles.sidebarItem}>Releases</span>
                  <span className={styles.sidebarItem}>Owners</span>
                </div>

                <div className={styles.sidebarGroup}>
                  <span className={styles.sidebarLabel}>Signals</span>
                  <span className={styles.sidebarItem}>Browsers</span>
                  <span className={styles.sidebarItem}>Escapes</span>
                </div>
              </div>

              <div className={styles.dashboardMain}>
                <div className={styles.dashboardHeader}>
                  <span className={styles.dashboardTitle}>Release overview</span>
                  <span className={styles.liveBadge}>Live sync</span>
                </div>

                <div className={styles.dashboardStats}>
                  <article className={styles.statCard}>
                    <span>Suite health</span>
                    <strong>98.4%</strong>
                    <small>+6.2% in the last sprint</small>
                  </article>
                  <article className={styles.statCard}>
                    <span>Open regressions</span>
                    <strong>13</strong>
                    <small>4 critical paths in review</small>
                  </article>
                </div>

                <article className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <span>Release confidence</span>
                    <span>March, 2026</span>
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
              <span>Watch Demo</span>
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
              {...hoverLift(-10, 1.008)}
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
                <div className={styles.workflowFrame}>
                  <img
                    className={`${styles.workflowShot} ${styles[card.imageClassName]}`}
                    src={card.image}
                    alt={card.imageAlt}
                  />
                </div>
              </div>
            </motion.article>
          ))}
        </section>

        <section className={styles.growthSection}>
          <motion.div className={styles.growthHeading} {...fadeUp(0.08, 50)}>
            <h2>Release clarity is the main priority</h2>
            <p>
              Keep browser coverage, owner handoff, and critical-path checks aligned
              before the launch window opens.
            </p>
          </motion.div>

          <div className={styles.growthGrid}>
            {growthCards.map((card, index) => (
              <motion.article
                key={card.title}
                className={styles.growthCard}
                {...fadeUp(0.12 + index * 0.08, 50)}
                {...hoverLift(-8, 1.01)}
              >
                <img className={styles.growthImage} src={card.image} alt={card.title} />
                <div className={styles.growthContent}>
                  <h4>{card.title}</h4>
                  <p>{card.body}</p>
                  <a className={styles.growthLink} href="#proof">
                    Review launch story
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <motion.section
          id="proof"
          className={styles.proofBand}
          {...fadeUp(0.12, 50)}
          {...hoverLift(-4, 1.004)}
        >
          <div className={styles.portraitPanel}>
            <img
              className={styles.portraitImage}
              src={proofPortraitSrc}
              alt="Customer story portrait"
            />
          </div>

          <div className={styles.proofCopy}>
            <h3>
              “Creator Skill Generator became the one place our team checks regressions,
              validates critical paths, and approves releases. We saw a 30% lift
              in shipping confidence within a quarter.”
            </h3>

            <div className={styles.proofMeta}>
              <div>
                <strong>Stefan Persson</strong>
                <span>Product Manager</span>
              </div>
              <img className={styles.proofLogoImage} src={proofLogoSrc} alt="Alt+Shift" />
            </div>

            <div className={styles.proofStats}>
              <div>
                <strong>284%</strong>
                <span>Revenue boost in the last 30 days</span>
              </div>
              <div>
                <strong>76%</strong>
                <span>Conversion rate from all active channels</span>
              </div>
            </div>

            <a className={styles.proofStoryLink} href="#pricing">
              Read Full Story
            </a>
          </div>
        </motion.section>

        <section className={styles.insightSection}>
          <motion.div className={styles.sectionHeading} {...fadeUp(0.08, 50)}>
            <p className={styles.eyebrow}>What sets us apart</p>
            <h2>Built for sharp operators, not cluttered QA dashboards.</h2>
            <p>
              Real-time signals, cleaner evidence capture, and action-first
              release summaries keep the whole team aligned.
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
            <p className={styles.eyebrow}>Customer proof</p>
            <h2>Trusted by 25,000+ happy customers</h2>
            <p>
              Join fast-moving teams using Creator Skill Generator to run cleaner releases
              with fewer tools, sharper evidence, and better visibility.
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
            <p className={styles.eyebrow}>Start now</p>
            <h2>Start getting cleaner releases</h2>
            <p>
              Unlock the potential of your QA team with a faster, more visual,
              more accountable release workspace.
            </p>
          </div>

          <a className={`${styles.button} ${styles.buttonDark}`} href="#top">
            <span>Get This Layout</span>
            <span className={styles.buttonIcon} aria-hidden="true">
              →
            </span>
          </a>
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
          </div>
          <div className={styles.footerColumn}>
            <p className={styles.footerTitle}>Template</p>
            <a href="#features">Feature Page</a>
            <a href="#workflows">Case Studies</a>
            <a href="#proof">Book a Demo</a>
            <a href="#pricing">Changelog</a>
          </div>
        </motion.div>

        <div className={styles.footerContact}>
          <motion.div className={styles.footerSocial} {...slideLeft(0.18, -30)}>
            <p className={styles.footerSocialTitle}>Find on Social Media</p>
            <div className={styles.socialRow}>
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                fb
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noreferrer">
                pi
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                in
              </a>
            </div>
          </motion.div>

          <motion.div className={styles.contactLinks} {...slideLeft(0.24, -30)}>
            <a href="mailto:hello@creatorskillgenerator.com">
              hello@creatorskillgenerator.com
            </a>
            <a href="tel:+0214802025906">+021 480-202-5906</a>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
