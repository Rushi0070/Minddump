"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/posts";

export default function Toc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 }
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav className="toc-fixed mono text-xs" aria-label="Table of contents">
      <div className="mb-3 uppercase tracking-widest text-faint">
        on this page
      </div>
      <ul className="space-y-1.5">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: (h.level - 2) * 12 }}>
            <a
              href={`#${h.id}`}
              className={
                active === h.id
                  ? "text-accent"
                  : "text-faint transition-colors hover:text-ink"
              }
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
