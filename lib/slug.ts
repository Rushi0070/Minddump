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
