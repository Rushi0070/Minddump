"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement for the "§" links next to headings. Clicking one
 * still jumps to the section (default anchor behaviour), but it ALSO copies the
 * full link to that section to the clipboard and shows a brief "copied" hint —
 * so sharing a deep link is one click. If the browser has no clipboard access
 * we silently fall back to plain anchor navigation.
 */
export default function HeadingAnchors() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const anchor = target.closest(".prose .anchor") as HTMLAnchorElement | null;
      if (!anchor) return;

      const url = anchor.href; // absolute URL including the #section hash
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(
          () => flash(anchor),
          () => {
            /* ignore: clipboard blocked, the jump still works */
          }
        );
      }
    }

    // Briefly swap the glyph to a checkmark as confirmation, then restore it.
    function flash(anchor: HTMLElement) {
      anchor.classList.add("anchor-copied");
      window.setTimeout(() => anchor.classList.remove("anchor-copied"), 1000);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
