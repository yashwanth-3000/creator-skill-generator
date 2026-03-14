"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";
import { SiteHeader } from "@/components/site-header";

const DEMO_VIDEO_ID = "VQdmyS9Zhng";

type WorkflowCard = {
  title: string;
  body: string;
  visual: "sources" | "inputs" | "bundle";
  points?: Array<{ label: string; text: string }>;
  list?: string[];
};

const featureCards = [
  {
    title: "Grounded generation",
    body: "Skills are extracted from real creator material, not blank templates. Every rule, example, and constraint comes from evidence in the source corpus.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="3.5" fill="currentColor" opacity="0.9" />
        <circle cx="3.5" cy="5" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="18.5" cy="5" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="3.5" cy="17" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="18.5" cy="17" r="2" fill="currentColor" opacity="0.5" />
        <line x1="5.2" y1="6.2" x2="9" y2="9.2" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        <line x1="16.8" y1="6.2" x2="13" y2="9.2" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        <line x1="5.2" y1="15.8" x2="9" y2="12.8" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        <line x1="16.8" y1="15.8" x2="13" y2="12.8" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      </svg>
    ),
  },
  {
    title: "Multi-source ingestion",
    body: "Paste raw text, drop a YouTube URL, or link a Twitter/X thread. The backend normalises every format into the same structured extraction pipeline.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="1" y="4" width="8" height="5.5" rx="2" fill="currentColor" opacity="0.5" />
        <rect x="1" y="12.5" width="8" height="5.5" rx="2" fill="currentColor" opacity="0.5" />
        <rect x="13" y="7.5" width="8" height="7" rx="2" fill="currentColor" opacity="0.9" />
        <path d="M9 6.75H11.5L11.5 15.25H9" stroke="currentColor" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
        <path d="M11.5 11L13 11" stroke="currentColor" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Progressive disclosure",
    body: "SKILL.md stays focused and scannable. Heavier examples, framework notes, and source transcripts move into references/, loaded only when needed.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="18" height="3.5" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="2" y="9.25" width="13" height="3" rx="1.5" fill="currentColor" opacity="0.55" />
        <rect x="2" y="15.5" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.28" />
      </svg>
    ),
  },
  {
    title: "Portable zip export",
    body: "Every bundle ships as a self-contained zip: SKILL.md, references/, and optional agent metadata, ready to drop into any Codex or Claude Code project.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="2" width="16" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <path d="M8 2v18" stroke="currentColor" strokeWidth="1.2" opacity="0.3" strokeDasharray="2 2" />
        <path d="M11 8.5V14M11 14l-2.2-2.2M11 14l2.2-2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      </svg>
    ),
  },
];

const workflowCards: WorkflowCard[] = [
  {
    title: "Feed it real creator material",
    body: "Drop in YouTube transcripts, Twitter/X threads, long-form notes, or raw scripts. The backend reads each source and extracts recurring patterns: tone, structure, constraints, and examples that actually appear in the work.",
    visual: "sources",
    points: [
      {
        label: "Evidence-first",
        text: "Every extracted rule traces back to a real example in the source, not a guess or a generic prompt scaffold.",
      },
      {
        label: "Any format",
        text: "Paste raw text, or supply a YouTube URL / Twitter handle and let the ingestor fetch the transcript automatically.",
      },
    ],
  },
  {
    title: "One backend, two workflows",
    body: "v1 handles direct pasted content with fast structure extraction. v2 adds Twitter/X and YouTube ingestion, merges all signals, and feeds the same generation engine. Both return identical, consistent bundles.",
    visual: "inputs",
    list: [
      "v1: raw paste, instant pattern extraction, bundle.",
      "v2: social + video URLs, fetched transcripts, merge, bundle.",
      "Same SKILL.md shape regardless of which path you use.",
    ],
  },
  {
    title: "Export a bundle that travels",
    body: "The finished package centres on SKILL.md. Supporting detail lives in references/ for progressive disclosure. An optional agents/openai.yaml adds metadata for OpenAI-compatible runtimes. One zip, drops anywhere.",
    visual: "bundle",
    points: [
      {
        label: "Tool-agnostic shape",
        text: "Works in Claude Code skills, OpenAI Codex custom instructions, and any tool that can read a markdown file.",
      },
      {
        label: "Reuse forever",
        text: "Stop rewriting context every session. Load the bundle once, get the creator's voice and constraints every time.",
      },
    ],
  },
];

const insightCards = [
  {
    kind: "metric",
    eyebrow: "Reuse ratio",
    stat: "∞ sessions",
    body: "Write the skill once from real material. Reuse it across every project, session, and tool without rewriting context.",
  },
  {
    kind: "highlight",
    title: "Grounded beats generic",
    body: "Skills built from real creator corpora outperform blank-template prompts because every constraint has evidence behind it, not guesswork.",
  },
  {
    kind: "team",
    title: "Two runtimes, one bundle",
    body: "The same zip works in Claude Code and OpenAI Codex. One generation workflow, deployed to every major AI coding tool.",
  },
] as const;

const trustStats = [
  {
    value: "v1 + v2",
    text: "Versioned workflows: raw paste for speed, multi-source ingestion for depth. Same output shape either way.",
  },
  {
    value: "ZIP",
    text: "Skills are persisted, listable, fetchable, exportable, and deletable via REST. Full CRUD on your bundle library.",
  },
];

// ─── SVG Illustrations ─────────────────────────────────────────────────────

function SourcesIllustration() {
  return (
    <div className={`${styles.workflowShell} ${styles.sourcesShell}`}>
      <div className={styles.workflowShellHeader}>
        <span>Creator inputs</span>
        <span>3 sources</span>
      </div>

      <div className={styles.sourceList}>
        <article className={styles.sourceItem}>
          <span className={`${styles.sourceBadge} ${styles.sourceBadgeYoutube}`}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <rect x="0.5" y="0.5" width="12" height="12" rx="3" fill="currentColor" opacity="0.15" />
              <path d="M5 4.5l4 2-4 2V4.5z" fill="currentColor" />
            </svg>
          </span>
          <div className={styles.sourceMeta}>
            <strong>YouTube transcript</strong>
            <small>22 segments · auto-fetched</small>
          </div>
          <svg className={styles.sourceCheck} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.12" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </article>

        <article className={styles.sourceItem}>
          <span className={`${styles.sourceBadge} ${styles.sourceBadgeTwitter}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1.5h3.5L6.5 4.5 9 1.5H11L7.5 6 11 10.5H7.5L5.5 7.5 3 10.5H1L4.5 6 1 1.5z" fill="currentColor" />
            </svg>
          </span>
          <div className={styles.sourceMeta}>
            <strong>Twitter / X thread</strong>
            <small>9 posts · clustered by topic</small>
          </div>
          <svg className={styles.sourceCheck} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.12" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </article>

        <article className={styles.sourceItem}>
          <span className={`${styles.sourceBadge} ${styles.sourceBadgePaste}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <rect x="2" y="1" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="4" y1="4" x2="8" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="4" y1="6" x2="8" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="4" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </span>
          <div className={styles.sourceMeta}>
            <strong>Pasted creator notes</strong>
            <small>4 long-form examples</small>
          </div>
          <svg className={styles.sourceCheck} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.12" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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

function InputsIllustration() {
  return (
    <div className={`${styles.workflowShell} ${styles.inputsShell}`}>
      <div className={styles.workflowShellHeader}>
        <span>Generation pipeline</span>
        <span>multi-source</span>
      </div>

      {/* Source nodes */}
      <div className={styles.pipelineGrid}>
        <div className={styles.pipelineNodes}>
          <article className={styles.pipelineNode}>
            <span className={`${styles.pipelinePill} ${styles.pipelinePillPaste}`}>v1</span>
            <div>
              <strong>Raw paste</strong>
              <small>scripts · notes · posts</small>
            </div>
          </article>
          <article className={styles.pipelineNode}>
            <span className={`${styles.pipelinePill} ${styles.pipelinePillSocial}`}>v2</span>
            <div>
              <strong>Social + video</strong>
              <small>Twitter/X · YouTube</small>
            </div>
          </article>
        </div>

        {/* Arrow */}
        <div className={styles.pipelineArrow} aria-hidden="true">
          <svg width="32" height="48" viewBox="0 0 32 48" fill="none">
            <path d="M16 2C16 2 16 20 16 24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.35" />
            <path d="M16 24C16 28 16 46 16 46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.35" />
            <path d="M10 40l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          </svg>
        </div>

        {/* Merge engine */}
        <article className={styles.mergeEngine}>
          <div className={styles.mergeEngineHeader}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.6" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.6" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.6" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9" />
            </svg>
            <span className={styles.mergeEngineLabel}>Merge engine</span>
          </div>
          <strong>Pattern assembly</strong>
          <small>tone · structure · constraints</small>
          <div className={styles.mergeChips}>
            <span>tone</span>
            <span>examples</span>
            <span>format</span>
            <span>rules</span>
          </div>
        </article>

        {/* Output */}
        <article className={styles.pipelineOutput}>
          <div className={styles.pipelineOutputLeft}>
            <span className={styles.pipelineOutputReady}>Bundle ready</span>
            <strong>Grounded skill bundle</strong>
            <small>consistent across every source path</small>
          </div>
          <div className={styles.pipelineOutputTags}>
            <span>SKILL.md</span>
            <span>refs/</span>
            <span>.zip</span>
          </div>
        </article>
      </div>
    </div>
  );
}

function BundleIllustration() {
  return (
    <div className={`${styles.workflowShell} ${styles.bundleShell}`}>
      <div className={styles.workflowShellHeader}>
        <span>Generated package</span>
        <span>portable export</span>
      </div>

      {/* File tree */}
      <div className={styles.fileTree}>
        <div className={styles.fileTreeFolder}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M1.5 4.5A1.5 1.5 0 013 3h3.5l1.5 2H13A1.5 1.5 0 0114.5 6.5v6A1.5 1.5 0 0113 14H3a1.5 1.5 0 01-1.5-1.5v-8z" fill="currentColor" opacity="0.7" />
          </svg>
          <span>creator-skill-pack/</span>
        </div>

        <div className={styles.fileTreeChildren}>
          <div className={`${styles.fileTreeItem} ${styles.fileTreeItemActive}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="4" y1="4.5" x2="10" y2="4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="4" y1="6.5" x2="10" y2="6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="4" y1="8.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span>SKILL.md</span>
            <small>entrypoint</small>
          </div>

          <div className={styles.fileTreeSubfolder}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 4A1.5 1.5 0 012.5 2.5H5.5L7 4H11.5A1.5 1.5 0 0113 5.5v5.5A1.5 1.5 0 0111.5 12.5H2.5A1.5 1.5 0 011 11V4z" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
            </svg>
            <span>references/</span>
          </div>

          <div className={styles.fileTreeChildren}>
            <div className={styles.fileTreeItem}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
              </svg>
              <span>framework.md</span>
              <small>loaded on demand</small>
            </div>
            <div className={styles.fileTreeItem}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
              </svg>
              <span>examples.md</span>
              <small>source-backed</small>
            </div>
          </div>

          <div className={styles.fileTreeItem}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
              <path d="M5 4.5h4M5 6.5h3M5 8.5h4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
            </svg>
            <span>agents/openai.yaml</span>
            <small>optional metadata</small>
          </div>
        </div>
      </div>

      {/* Export card */}
      <div className={styles.exportCard}>
        <div className={styles.exportCardLeft}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="currentColor" opacity="0.08" />
            <path d="M10 8h6.5L22 13.5V24H10V8z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M16.5 8v5.5H22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            <path d="M13 19v4M13 23l-2-2M13 23l2-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <strong>creator-skill-pack.zip</strong>
            <small>folder + export artifact</small>
          </div>
        </div>
        <span className={styles.exportChip}>ZIP ready</span>
      </div>
    </div>
  );
}

// ─── Hero Dashboard ─────────────────────────────────────────────────────────

function HeroDashboard() {
  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <div className={styles.dashboardSidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrandRow}>
            <span className={styles.sidebarBrandIcon} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
                <rect x="7.5" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity="0.6" />
                <rect x="1" y="7.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity="0.6" />
                <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity="0.3" />
              </svg>
            </span>
            <span className={styles.sidebarBrand}>Skill Generator</span>
          </div>
          <span className={styles.sidebarSearch} />
        </div>

        <div className={styles.sidebarGroup}>
          <span className={styles.sidebarLabel}>Workspace</span>
          <span className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M1.5 7H6V11.5H1.5V7zM7 1.5H11.5V6H7V1.5zM1.5 1.5H6V6H1.5V1.5zM7 7H11.5V11.5H7V7z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
            </svg>
            Overview
          </span>
          <span className={styles.sidebarItem}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
              <path d="M4.5 5l3 1.5-3 1.5V5z" fill="currentColor" opacity="0.5" />
            </svg>
            Sources
          </span>
          <span className={styles.sidebarItem}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <rect x="1.5" y="3" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
              <path d="M4.5 3V2a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
            </svg>
            Bundles
          </span>
          <span className={styles.sidebarItem}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <rect x="2" y="1.5" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
              <path d="M6.5 5v4M6.5 9L4.5 7M6.5 9L8.5 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            </svg>
            Exports
          </span>
        </div>

        <div className={styles.sidebarGroup}>
          <span className={styles.sidebarLabel}>Ingest</span>
          <span className={styles.sidebarItem}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1.5h3.5L6.5 4.5 9 1.5H11L7.5 6 11 10.5H7.5L5.5 7.5 3 10.5H1L4.5 6 1 1.5z" fill="currentColor" opacity="0.5" />
            </svg>
            Twitter / X
          </span>
          <span className={styles.sidebarItem}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <rect x="0.5" y="0.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <path d="M4.5 4l3.5 2-3.5 2V4z" fill="currentColor" opacity="0.6" />
            </svg>
            YouTube
          </span>
        </div>
      </div>

      {/* Main */}
      <div className={styles.dashboardMain}>
        <div className={styles.dashboardHeader}>
          <div>
            <span className={styles.dashboardTitle}>Generation overview</span>
            <span className={styles.dashboardSubtitle}>Creator Skill Generator</span>
          </div>
          <span className={styles.liveBadge}>
            <span className={styles.liveDot} aria-hidden="true" />
            Live
          </span>
        </div>

        <div className={styles.dashboardStats}>
          <article className={styles.statCard}>
            <div className={styles.statCardTop}>
              <span>Input modes</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 10l4-4 2.5 2.5L12 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
              </svg>
            </div>
            <strong>3</strong>
            <small>text · Twitter/X · YouTube</small>
          </article>
          <article className={styles.statCard}>
            <div className={styles.statCardTop}>
              <span>Bundle parts</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.4" />
                <rect x="7.5" y="2" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.4" />
                <rect x="2" y="7.5" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.4" />
                <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.15" />
              </svg>
            </div>
            <strong>4</strong>
            <small>SKILL.md · refs · agents · zip</small>
          </article>
        </div>

        {/* SKILL.md code preview */}
        <article className={styles.skillPreviewCard}>
          <div className={styles.skillPreviewHeader}>
            <span className={styles.skillPreviewDots} aria-hidden="true">
              <span /><span /><span />
            </span>
            <span className={styles.skillPreviewFilename}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                <path d="M3 3.5h5M3 5.5h3.5M3 7.5h5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
              </svg>
              SKILL.md
            </span>
            <span className={styles.skillPreviewGenBadge}>generating...</span>
          </div>
          <div className={styles.skillPreviewBody}>
            <div className={`${styles.skillLine} ${styles.skillLineH1}`}>
              <span className={styles.skillLinePound}>#</span>{" "}Writing in the voice of @creator
            </div>
            <div className={`${styles.skillLine} ${styles.skillLineBlank}`} />
            <div className={styles.skillLine}>
              <span className={styles.skillLineLabel}>tone:</span>{" "}direct, evidence-first, no fluff
            </div>
            <div className={styles.skillLine}>
              <span className={styles.skillLineLabel}>format:</span>{" "}hook → proof → CTA
            </div>
            <div className={`${styles.skillLine} ${styles.skillLineBlank}`} />
            <div className={`${styles.skillLine} ${styles.skillLineSection}`}>
              <span className={styles.skillLinePound}>##</span>{" "}Rules
            </div>
            <div className={styles.skillLine}>
              <span className={styles.skillLineBullet}>-</span>{" "}Open with the hardest claim
            </div>
            <div className={styles.skillLine}>
              <span className={styles.skillLineBullet}>-</span>{" "}Every claim needs evidence
            </div>
            <div className={`${styles.skillLine} ${styles.skillLineBlank}`} />
            <div className={`${styles.skillLine} ${styles.skillLineSection}`}>
              <span className={styles.skillLinePound}>##</span>{" "}References
            </div>
            <div className={`${styles.skillLine} ${styles.skillLineDim}`}>
              See references/examples.md
            </div>
            <div className={styles.skillCursor} aria-hidden="true" />
          </div>
        </article>
      </div>
    </div>
  );
}

// ─── YouTube Demo Modal ──────────────────────────────────────────────────────

function DemoModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Demo video"
    >
      <motion.div
        className={styles.modalContent}
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Watch Demo</span>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close video">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className={styles.modalVideo}>
          <iframe
            src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}?autoplay=1&rel=0`}
            title="Creator Skill Generator demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();
  const [demoOpen, setDemoOpen] = useState(false);

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
      <AnimatePresence>
        {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
      </AnimatePresence>

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
        {/* ── Hero ── */}
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
                <span className={styles.buttonIcon} aria-hidden="true">→</span>
              </Link>
              <Link className={`${styles.button} ${styles.buttonGhost}`} href="/skills">
                <span>Browse Skills</span>
                <span className={styles.buttonGhostIcon} aria-hidden="true">→</span>
              </Link>
            </div>
          </motion.div>

          <div className={styles.heroVisual}>
            <div className={styles.heroGrid} aria-hidden="true" />

            <motion.div
              className={styles.dashboardWrapper}
              initial={reduceMotion ? false : { opacity: 0.001, scale: 0.9 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={spring200(0.6)}
              {...hoverLift(-10, 1.012)}
            >
              <HeroDashboard />
              {/* Hover overlay with Watch Demo */}
              <button
                className={styles.dashboardOverlay}
                onClick={() => setDemoOpen(true)}
                aria-label="Watch demo video"
              >
                <div className={styles.dashboardOverlayInner}>
                  <span className={styles.dashboardPlayBtn} aria-hidden="true">
                    <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
                      <path d="M2 2l18 11L2 24V2z" fill="currentColor" />
                    </svg>
                  </span>
                  <span className={styles.dashboardPlayLabel}>Watch Demo</span>
                </div>
              </button>
            </motion.div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className={styles.featureSection}>
          <div className={styles.featureGrid}>
            {featureCards.map((card, index) => (
              <motion.article
                key={card.title}
                className={styles.featureCard}
                {...fadeUp(index * 0.08, 50)}
                {...hoverLift(-8, 1.015)}
              >
                <span className={styles.featureIcon} aria-hidden="true">
                  {card.icon}
                </span>
                <h4>{card.title}</h4>
                <p>{card.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ── Workflows ── */}
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
                <div className={styles.workflowFrame}>
                  {card.visual === "sources" && <SourcesIllustration />}
                  {card.visual === "inputs" && <InputsIllustration />}
                  {card.visual === "bundle" && <BundleIllustration />}
                </div>
              </div>
            </motion.article>
          ))}
        </section>

        {/* ── Why ── */}
        <section id="why" className={styles.insightSection}>
          <motion.div className={styles.sectionHeading} {...fadeUp(0.08, 50)}>
            <p className={styles.eyebrow}>Why it matters</p>
            <h2>Stop rewriting context every session</h2>
            <p>
              Every AI coding session starts cold. This project turns the creator's
              voice, rules, and examples into a portable package that loads once
              and works everywhere.
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
                  <div className={styles.toolRow} aria-hidden="true">
                    <span className={styles.toolChip}>Claude Code</span>
                    <span className={styles.toolChip}>OpenAI Codex</span>
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        </section>

        {/* ── Backend status ── */}
        <section id="pricing" className={styles.trustSection}>
          <motion.div className={styles.sectionHeading} {...fadeUp(0.08, 50)}>
            <p className={styles.eyebrow}>API status</p>
            <h2>Full REST API, deployed today</h2>
            <p>
              The FastAPI backend is live on Railway. Generate, persist, list,
              fetch, export, and delete skill bundles via versioned REST endpoints.
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

        {/* ── CTA ── */}
        <motion.section id="cta" className={styles.ctaBand} {...fadeUp(0.08, 50)}>
          <div>
            <p className={styles.eyebrow}>Ready to build</p>
            <h2>Create your first skill bundle</h2>
            <p>
              Paste creator content, link a YouTube video, or import a Twitter/X thread.
              Get a reusable SKILL.md bundle in seconds.
            </p>
          </div>

          <Link className={`${styles.button} ${styles.buttonDark}`} href="/create-new-skill">
            <span>Build a skill</span>
            <span className={styles.buttonIcon} aria-hidden="true">→</span>
          </Link>
        </motion.section>
      </main>
    </div>
  );
}
