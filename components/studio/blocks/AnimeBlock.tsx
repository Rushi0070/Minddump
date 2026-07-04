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
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const url = (block.props.url as string) || "";
      const caption = (block.props.caption as string) || "";
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
        <figure className="anime-fig" contentEditable={false}>
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
          <button
            className="anime-clear"
            onClick={() =>
              editor.updateBlock(block, { type: "anime", props: { url: "" } })
            }
          >
            replace
          </button>
        </figure>
      );
    },
  }
);
