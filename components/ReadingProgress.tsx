"use client";

import { useEffect, useState } from "react";

/**
 * A thin bar pinned to the top of the viewport that fills as you scroll through
 * a post. It measures how far the article body has scrolled past the top of the
 * screen, so it tracks the actual reading position rather than the whole page.
 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    function update() {
      const el = article as HTMLElement;
      // Distance from the article top to the top of the viewport.
      const scrolled = window.scrollY - el.offsetTop;
      // Total scrollable distance within the article (minus one screen).
      const total = el.offsetHeight - window.innerHeight;
      const ratio = total > 0 ? scrolled / total : 0;
      // Clamp to the 0..1 range so it never overshoots at the very ends.
      setProgress(Math.min(1, Math.max(0, ratio)));
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="reading-progress" aria-hidden>
      <div
        className="reading-progress-bar"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
