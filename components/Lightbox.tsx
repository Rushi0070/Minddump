"use client";

import { useEffect, useState } from "react";

// Click any article image to view the full-resolution original full-screen.
// Delegated listener so it also covers images added after hydration.
export default function Lightbox() {
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState("");

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName === "IMG" && t.closest(".prose figure")) {
        const img = t as HTMLImageElement;
        setSrc(img.currentSrc || img.src);
        setAlt(img.alt || "");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSrc(null);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = src ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [src]);

  if (!src) return null;

  return (
    <div className="lightbox" onClick={() => setSrc(null)} role="dialog" aria-modal="true">
      <button className="lightbox-close mono" aria-label="Close">
        esc ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
      {alt && <div className="lightbox-cap mono">{alt}</div>}
    </div>
  );
}
