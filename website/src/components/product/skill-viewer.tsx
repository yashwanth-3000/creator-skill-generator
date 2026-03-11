"use client";

import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import styles from "./skill-viewer.module.css";

type SkillFile = {
  relative_path: string;
  content: string;
};

type Props = {
  files: SkillFile[];
  skillName: string;
  downloadFileUrl: (skillName: string, filePath: string) => string;
  /** Extra sidebar sections rendered above the Files list */
  sidebarTop?: React.ReactNode;
  /** Extra sidebar sections rendered below the Files list */
  sidebarBottom?: React.ReactNode;
};

function fileExt(path: string) {
  return path.split(".").pop() ?? "";
}

function fileParts(path: string): { dir: string; name: string } {
  const idx = path.lastIndexOf("/");
  if (idx === -1) return { dir: "", name: path };
  return { dir: path.slice(0, idx + 1), name: path.slice(idx + 1) };
}

export function SkillViewer({ files, skillName, downloadFileUrl, sidebarTop, sidebarBottom }: Props) {
  const [selectedFile, setSelectedFile] = useState(files[0]?.relative_path ?? "");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copyState, setCopyState] = useState("");

  const activeFile = files.find((f) => f.relative_path === selectedFile);

  async function copyFile() {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopyState("Copied");
    } catch {
      setCopyState("Failed");
    }
    setTimeout(() => setCopyState(""), 1800);
  }

  function selectFile(path: string) {
    setSelectedFile(path);
    setViewMode("preview");
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarPanel}>
          {sidebarTop}

          {sidebarTop && <div className={styles.sidebarDivider} />}

          <div className={styles.sidebarSection}>
            <p className={styles.sidebarLabel}>Files</p>
            <div className={styles.fileList}>
              {files.map((file) => {
                const { dir, name } = fileParts(file.relative_path);
                const ext = fileExt(file.relative_path);
                const isActive = selectedFile === file.relative_path;
                return (
                  <button
                    key={file.relative_path}
                    type="button"
                    className={`${styles.fileBtn} ${isActive ? styles.fileBtnActive : ""}`}
                    onClick={() => selectFile(file.relative_path)}
                  >
                    <span className={`${styles.extBadge} ${(styles as Record<string, string>)[`ext_${ext}`] ?? ""}`}>
                      {ext}
                    </span>
                    <span className={styles.filePath}>
                      {dir && <span className={styles.fileDir}>{dir}</span>}
                      <span className={styles.fileName}>{name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {sidebarBottom && <div className={styles.sidebarDivider} />}
          {sidebarBottom}
        </div>
      </aside>

      {/* Preview */}
      <section className={styles.preview}>
        <AnimatePresence mode="wait">
          {activeFile ? (
            <motion.div
              key={activeFile.relative_path}
              className={styles.previewPanel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className={styles.previewHeader}>
                <div className={styles.previewTitle}>
                  <p className={styles.kicker}>Open file</p>
                  <h2 className={styles.previewFileName}>
                    {fileParts(activeFile.relative_path).dir && (
                      <span className={styles.previewDir}>
                        {fileParts(activeFile.relative_path).dir}
                      </span>
                    )}
                    {fileParts(activeFile.relative_path).name}
                  </h2>
                </div>
                <div className={styles.previewActions}>
                  {activeFile.relative_path.endsWith(".md") && (
                    <div className={styles.viewToggle}>
                      <button
                        type="button"
                        className={`${styles.viewToggleBtn} ${viewMode === "preview" ? styles.viewToggleBtnActive : ""}`}
                        onClick={() => setViewMode("preview")}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        className={`${styles.viewToggleBtn} ${viewMode === "code" ? styles.viewToggleBtnActive : ""}`}
                        onClick={() => setViewMode("code")}
                      >
                        Code
                      </button>
                    </div>
                  )}
                  <a
                    className={styles.ghostButton}
                    href={downloadFileUrl(skillName, activeFile.relative_path)}
                  >
                    Download
                  </a>
                  <button
                    className={styles.ghostButton}
                    type="button"
                    onClick={copyFile}
                  >
                    {copyState || "Copy"}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {activeFile.relative_path.endsWith(".md") && viewMode === "preview" ? (
                  <motion.div
                    key="preview"
                    className={styles.markdownBody}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ReactMarkdown>{activeFile.content}</ReactMarkdown>
                  </motion.div>
                ) : (
                  <motion.pre
                    key="code"
                    className={styles.rawPre}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeFile.content}
                  </motion.pre>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className={styles.previewEmpty}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p>Select a file to preview.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
