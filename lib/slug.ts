export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Flatten BlockNote-style inline content into plain text (for headings/TOC). */
export function plainText(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c) =>
        c?.type === "text"
          ? c.text
          : c?.content
            ? plainText(c.content)
            : ""
      )
      .join("");
  }
  return "";
}

export type ReadingStats = { words: number; minutes: number };

// Average adult reading speed for technical prose. A round, honest number.
const WORDS_PER_MINUTE = 200;

// Count the words in a chunk of text. Splitting on whitespace is a good-enough
// heuristic; we only need a stable estimate, not a precise count.
function countWords(text: string): number {
  const trimmed = (text || "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * Estimate word count and reading time for a list of blocks. This is kept in
 * `slug.ts` (which has no server-only imports) on purpose, so it can run both
 * on the static site AND live inside the browser-based studio editor.
 */
export function readingStats(blocks: any[]): ReadingStats {
  let words = 0;

  function walk(list: any[]) {
    for (const block of list || []) {
      if (!block) continue;
      // Prose, headings, list items, quotes, callouts, captions...
      words += countWords(plainText(block.content));
      // Code blocks store their text in props.code, not inline content.
      if (block.props?.code) words += countWords(String(block.props.code));
      // Nested blocks (e.g. items inside a toggle) count too.
      if (Array.isArray(block.children) && block.children.length) {
        walk(block.children);
      }
    }
  }

  walk(blocks);
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return { words, minutes };
}
