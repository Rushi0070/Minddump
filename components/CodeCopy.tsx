"use client";

import { useEffect } from "react";

/**
 * Wires up the "copy" button that the static renderer prints above every code
 * block. We use a single delegated click listener (like the lightbox) so it
 * works for every code block on the page without React owning each button.
 */
export default function CodeCopy() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const button = target.closest(".code-copy") as HTMLButtonElement | null;
      if (!button) return;

      const wrapper = button.closest(".code-block");
      const pre = wrapper?.querySelector("pre");
      if (!pre) return;

      const code = pre.textContent ?? "";
      if (!navigator.clipboard) return;

      navigator.clipboard.writeText(code).then(() => {
        button.textContent = "copied";
        button.classList.add("is-copied");
        window.setTimeout(() => {
          button.textContent = "copy";
          button.classList.remove("is-copied");
        }, 1200);
      });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
