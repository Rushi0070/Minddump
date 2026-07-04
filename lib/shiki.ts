import { createHighlighter, type Highlighter } from "shiki";

const LANGS = [
  "plaintext",
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "python",
  "bash",
  "shell",
  "json",
  "rust",
  "c",
  "cpp",
  "go",
  "java",
  "sql",
  "yaml",
  "toml",
  "markdown",
  "html",
  "css",
];

let instance: Promise<Highlighter> | null = null;

function highlighter(): Promise<Highlighter> {
  if (!instance) {
    instance = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: LANGS,
    });
  }
  return instance;
}

/** Highlight code to dual-theme HTML (light/dark via CSS vars). */
export async function highlightCode(
  code: string,
  lang: string
): Promise<string> {
  const h = await highlighter();
  const language = h.getLoadedLanguages().includes(lang) ? lang : "plaintext";
  return h.codeToHtml(code, {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}
