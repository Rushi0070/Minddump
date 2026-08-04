"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { useState } from "react";

export const AnimeBlock = createReactBlockSpec(
  {
    type: "anime",
    propSchema: {
      url: { default: "" },
      caption: { default: "" },
      width: { default: 0 },
      // "col" = sits in the text column; "bleed" = breaks out full-bleed on the
      // reader page (see renderBlocks + .figure-bleed).
      size: { default: "col" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const url = (block.props.url as string) || "";
      const caption = (block.props.caption as string) || "";
      const size = (block.props.size as string) || "col";
      const [busy, setBusy] = useState(false);

      async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true);
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (res.ok && data.url) {
            editor.updateBlock(block, { type: "anime", props: { url: data.url } });
          }
        } finally {
          setBusy(false);
          e.target.value = "";
        }
      }

      if (!url) {
        return (
          <div className="anime-empty" contentEditable={false}>
            <div className="anime-row">
              <label className="math-btn">
                {busy ? "uploading…" : "⬆ upload image"}
                <input type="file" accept="image/*" hidden onChange={onFile} />
              </label>
              <span className="anime-or">or paste a path</span>
            </div>
            <input
              className="anime-url"
              placeholder="/anime/gojo.png  or  https://…"
              onKeyDown={(e) => {
                const v = (e.target as HTMLInputElement).value.trim();
                if (e.key === "Enter" && v)
                  editor.updateBlock(block, { type: "anime", props: { url: v } });
              }}
            />
          </div>
        );
      }

      return (
        <figure
          className={`anime-fig ${size === "bleed" ? "is-bleed" : ""}`}
          contentEditable={false}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={caption} />
          <input
            className="anime-cap"
            value={caption}
            placeholder="caption (optional)"
            onChange={(e) =>
              editor.updateBlock(block, {
                type: "anime",
                props: { caption: e.target.value },
              })
            }
          />
          <div className="anime-controls">
            {/* Width: sit in the column, or break out full-bleed like a
                distill-style figure. */}
            <div className="anime-seg" role="group" aria-label="figure width">
              <button
                type="button"
                className={size !== "bleed" ? "is-on" : ""}
                onClick={() =>
                  editor.updateBlock(block, {
                    type: "anime",
                    props: { size: "col" },
                  })
                }
              >
                fit column
              </button>
              <button
                type="button"
                className={size === "bleed" ? "is-on" : ""}
                onClick={() =>
                  editor.updateBlock(block, {
                    type: "anime",
                    props: { size: "bleed" },
                  })
                }
              >
                full-bleed
              </button>
            </div>
            <button
              className="anime-clear"
              onClick={() =>
                editor.updateBlock(block, { type: "anime", props: { url: "" } })
              }
            >
              replace
            </button>
          </div>
        </figure>
      );
    },
  }
);
