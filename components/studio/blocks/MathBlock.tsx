"use client";

import { createReactBlockSpec } from "@blocknote/react";
import katex from "katex";
import { useState } from "react";

function preview(latex: string): string {
  return katex.renderToString(latex || "\\;", {
    throwOnError: false,
    displayMode: true,
  });
}

export const MathBlock = createReactBlockSpec(
  {
    type: "math",
    propSchema: { latex: { default: "" } },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const latex = (block.props.latex as string) || "";
      const [open, setOpen] = useState(!latex);
      const [draft, setDraft] = useState(latex);
      const [desc, setDesc] = useState("");
      const [busy, setBusy] = useState<"" | "photo" | "describe">("");
      const [err, setErr] = useState("");

      function commit() {
        editor.updateBlock(block, { type: "math", props: { latex: draft } });
        setOpen(false);
        setErr("");
      }

      async function call(payload: FormData | object, mode: "photo" | "describe") {
        setBusy(mode);
        setErr("");
        try {
          const res = await fetch("/api/math", {
            method: "POST",
            ...(payload instanceof FormData
              ? { body: payload }
              : {
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
          setDraft(data.latex || "");
        } catch (e: any) {
          setErr(e?.message || "request failed");
        } finally {
          setBusy("");
        }
      }

      function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("image", file);
        call(fd, "photo");
        e.target.value = "";
      }

      if (!open) {
        return (
          <div
            className="math-view"
            contentEditable={false}
            onClick={() => {
              setDraft(latex);
              setOpen(true);
            }}
            title="click to edit"
            dangerouslySetInnerHTML={{ __html: preview(latex) }}
          />
        );
      }

      return (
        <div className="math-panel" contentEditable={false}>
          <div
            className="math-live"
            dangerouslySetInnerHTML={{ __html: preview(draft) }}
          />
          <textarea
            className="math-input"
            value={draft}
            spellCheck={false}
            placeholder={"type LaTeX, e.g.  \\int_0^1 x^2\\,dx"}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="math-tools">
            <label className="math-btn">
              {busy === "photo" ? "reading…" : "📷 from photo"}
              <input type="file" accept="image/*" hidden onChange={onPhoto} />
            </label>
            <input
              className="math-desc"
              value={desc}
              placeholder="…or describe it in words"
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && desc.trim())
                  call({ describe: desc.trim() }, "describe");
              }}
            />
            <button
              className="math-btn"
              disabled={!desc.trim() || busy === "describe"}
              onClick={() => call({ describe: desc.trim() }, "describe")}
            >
              {busy === "describe" ? "…" : "→ latex"}
            </button>
          </div>
          {err && <div className="math-err">⚠ {err}</div>}
          <div className="math-actions">
            <button className="math-btn primary" onClick={commit}>
              save
            </button>
            <button className="math-btn" onClick={() => setOpen(false)}>
              cancel
            </button>
          </div>
        </div>
      );
    },
  }
);
