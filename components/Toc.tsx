"use client";

import { useEffect, useRef, useState } from "react";
import type { Heading } from "@/lib/posts";

/**
 * Sticky table of contents pinned in the left gutter on wide screens. It
 * highlights the section you are *currently reading* — not just when a heading
 * happens to cross an observer band, but continuously: the active item is the
 * last heading whose top has scrolled above a line near the top of the
 * viewport. Clicking an item smooth-scrolls to it. Inspired by the section
 * rails on colah.github.io and Alisa Liu's long-form posts.
 */
export default function Toc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string>(headings[0]?.id ?? "");
  const ticking = useRef(false);

  useEffect(() => {
    if (headings.length === 0) return;

    // The "read line": a heading counts as current once its top passes this
    // many pixels below the top of the viewport.
    const READ_LINE = 120;

    function update() {
      ticking.current = false;
      let current = headings[0].id;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= READ_LINE) current = h.id;
        else break;
      }
      // Near the very bottom, force the last heading active so the final
      // section always lights up even if it's short.
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4
      ) {
        current = headings[headings.length - 1].id;
      }
      setActive(current);
    }

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [headings]);

  function go(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const el = document.getElementById(id);
    if (!el) return; // let the plain anchor jump handle it
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    setActive(id);
  }

  if (headings.length < 2) return null;

  return (
    <nav className="toc-fixed mono text-xs" aria-label="Table of contents">
      <div className="toc-label">on this page</div>
      <ul className="toc-list">
        {headings.map((h) => (
          <li
            key={h.id}
            className={`toc-item ${active === h.id ? "is-active" : ""}`}
            style={{ paddingLeft: 12 + (h.level - 2) * 12 }}
          >
            <a href={`#${h.id}`} onClick={(e) => go(e, h.id)}>
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
