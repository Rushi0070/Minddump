"use client";

import { createReactBlockSpec } from "@blocknote/react";
import katex from "katex";
import { useMemo, useRef, useState } from "react";

// A private-use character we drop into templates to mark where the cursor
// should land after inserting. It will never appear in real LaTeX input.
const CARET = "";

/**
 * "Structures" — the handful of building blocks people actually reach for,
 * mirroring Word's equation ribbon. Each has a rendered `icon` (drawn as real
 * math) and a `tpl` (template) inserted at the cursor. The CARET marks where
 * the caret lands; any selected text is dropped in there so you can wrap a
 * selection (select `x+1`, click √, get `\sqrt{x+1}`).
 */
const STRUCTURES: { title: string; icon: string; tpl: string }[] = [
  { title: "Fraction", icon: "\\frac{a}{b}", tpl: `\\frac{${CARET}}{}` },
  { title: "Power", icon: "x^{2}", tpl: `^{${CARET}}` },
  { title: "Subscript", icon: "x_{n}", tpl: `_{${CARET}}` },
  { title: "Square root", icon: "\\sqrt{x}", tpl: `\\sqrt{${CARET}}` },
  { title: "Sum", icon: "\\sum", tpl: `\\sum_{${CARET}}^{}` },
  { title: "Integral", icon: "\\int", tpl: `\\int_{${CARET}}^{}` },
  { title: "Brackets", icon: "(\\,)", tpl: `\\left(${CARET}\\right)` },
];

/**
 * "Symbols" — a compact palette of the most common Greek letters and operators.
 * The glyph shown is Unicode (snappy, no render needed); the `tpl` is the LaTeX
 * inserted. A trailing space keeps macros like \pi from gluing onto the next
 * token.
 */
const SYMBOLS: { g: string; tpl: string; title: string }[] = [
  { g: "π", tpl: "\\pi ", title: "pi" },
  { g: "θ", tpl: "\\theta ", title: "theta" },
  { g: "α", tpl: "\\alpha ", title: "alpha" },
  { g: "β", tpl: "\\beta ", title: "beta" },
  { g: "λ", tpl: "\\lambda ", title: "lambda" },
  { g: "μ", tpl: "\\mu ", title: "mu" },
  { g: "σ", tpl: "\\sigma ", title: "sigma" },
  { g: "Δ", tpl: "\\Delta ", title: "Delta" },
  { g: "∇", tpl: "\\nabla ", title: "nabla / grad" },
  { g: "∞", tpl: "\\infty ", title: "infinity" },
  { g: "×", tpl: "\\times ", title: "times" },
  { g: "·", tpl: "\\cdot ", title: "dot" },
  { g: "±", tpl: "\\pm ", title: "plus-minus" },
  { g: "≤", tpl: "\\leq ", title: "≤" },
  { g: "≥", tpl: "\\geq ", title: "≥" },
  { g: "≠", tpl: "\\neq ", title: "≠" },
  { g: "≈", tpl: "\\approx ", title: "≈" },
  { g: "→", tpl: "\\to ", title: "arrow" },
];

// Render a small inline KaTeX snippet — used to draw the toolbar button icons
// as real math (so "fraction" looks like a fraction, not the word).
function icon(latex: string): string {
  return katex.renderToString(latex, { throwOnError: false, displayMode: false });
}

/**
 * The novel bit: given the raw LaTeX and where the caret sits inside it, say —
 * in plain English — what part of the equation you're editing right now. This
 * is what lets someone who has never written LaTeX understand the code they're
 * looking at ("oh, I'm typing the denominator of a fraction"). We walk the
 * string keeping a stack of open groups, tagging each with the macro that owns
 * it, and read off the stack at the caret.
 */
function pathAt(src: string, caret: number): string[] {
  type Frame = { label: string };
  const stack: Frame[] = [];
  // `pending` is the macro (or ^ / _) we just saw; the next {, [ belongs to it.
  let pending: { name: string; seen: number } | null = null;
  const cut = Math.min(caret, src.length);
  let i = 0;

  const label = (name: string, arg: number, open: string): string => {
    switch (name) {
      case "frac":
      case "dfrac":
      case "tfrac":
        return arg === 0 ? "numerator" : "denominator";
      case "^":
        return "power";
      case "_":
        return "subscript";
      case "sqrt":
        return open === "[" ? "root index" : "square root";
      case "sum":
      case "int":
      case "prod":
        return arg === 0 ? "lower limit" : "upper limit";
      case "vec":
        return "vector";
      case "hat":
        return "hat";
      case "bar":
      case "overline":
        return "overline";
      case "text":
      case "mathrm":
        return "text";
      case "":
        return "group";
      default:
        return name;
    }
  };

  while (i < cut) {
    const c = src[i];
    if (c === "\\") {
      let j = i + 1;
      while (j < src.length && /[a-zA-Z]/.test(src[j])) j++;
      if (j === i + 1) j = i + 2; // escaped symbol like \{ or \,
      pending = { name: src.slice(i + 1, j), seen: 0 };
      i = j;
      continue;
    }
    if (c === "^" || c === "_") {
      pending = { name: c, seen: 0 };
      i++;
      continue;
    }
    if (c === "{" || c === "[") {
      const name = pending ? pending.name : "";
      const arg = pending ? pending.seen : 0;
      stack.push({ label: label(name, arg, c) });
      if (pending) pending.seen++;
      i++;
      continue;
    }
    if (c === "}" || c === "]") {
      stack.pop();
      // keep `pending` so the next group counts as the macro's next argument
      i++;
      continue;
    }
    if (c === " " || c === "\n" || c === "\t") {
      i++;
      continue;
    }
    pending = null; // any real token ends a macro's argument run
    i++;
  }
  return stack.map((f) => f.label);
}

// Trim KaTeX's verbose parse errors down to a short, friendly hint.
function friendlyError(msg: string): string {
  const m = msg || "";
  if (/Expected 'EOF'|Unexpected|Expected/.test(m)) {
    if (/\{|\}/.test(m)) return "check your { } braces";
  }
  if (/Undefined control sequence/.test(m)) {
    const cmd = m.match(/\\[a-zA-Z]+/);
    return cmd ? `unknown command ${cmd[0]}` : "unknown command";
  }
  if (/Can't use function/.test(m)) return "misplaced symbol";
  return "not valid yet — keep typing";
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
      const [caret, setCaret] = useState(0);
      const [desc, setDesc] = useState("");
      const [busy, setBusy] = useState<"" | "photo" | "describe">("");
      const [err, setErr] = useState("");
      const inputRef = useRef<HTMLTextAreaElement>(null);

      // Render toolbar icons once — they never change.
      const structureIcons = useMemo(
        () => STRUCTURES.map((s) => icon(s.icon)),
        []
      );

      // Live preview + validity, recomputed only when the code changes. KaTeX is
      // fast enough to run synchronously on every keystroke.
      const { html, problem } = useMemo(() => {
        const source = draft || "\\;";
        try {
          return {
            html: katex.renderToString(source, {
              throwOnError: true,
              displayMode: true,
            }),
            problem: "",
          };
        } catch (e: any) {
          return {
            html: katex.renderToString(source, {
              throwOnError: false,
              displayMode: true,
            }),
            problem: friendlyError(e?.message || ""),
          };
        }
      }, [draft]);

      // Where-am-I breadcrumb: "fraction › denominator" etc.
      const path = useMemo(() => pathAt(draft, caret), [draft, caret]);

      function commit() {
        editor.updateBlock(block, { type: "math", props: { latex: draft } });
        setOpen(false);
        setErr("");
      }

      // Discard edits: drop the draft back to the committed value and close.
      function cancel() {
        setDraft(latex);
        setOpen(false);
        setErr("");
      }

      function syncCaret() {
        const ta = inputRef.current;
        if (ta) setCaret(ta.selectionStart);
      }

      // Splice `text` in over the current selection, leaving the caret at
      // `caretOffset` characters into the inserted text (default: end).
      function splice(text: string, start: number, end: number, caretOffset: number) {
        const next = draft.slice(0, start) + text + draft.slice(end);
        const pos = start + caretOffset;
        setDraft(next);
        setCaret(pos);
        requestAnimationFrame(() => {
          const el = inputRef.current;
          if (!el) return;
          el.focus();
          el.setSelectionRange(pos, pos);
        });
      }

      // Insert a structure template at the cursor. Any highlighted text is
      // placed where the CARET marker sits, so you can wrap a selection.
      function insert(tpl: string) {
        const ta = inputRef.current;
        const start = ta ? ta.selectionStart : draft.length;
        const end = ta ? ta.selectionEnd : draft.length;
        const selected = draft.slice(start, end);
        const markerAt = tpl.indexOf(CARET);
        const filled = tpl.replace(CARET, selected);
        const caretOffset =
          markerAt >= 0 ? markerAt + selected.length : filled.length;
        splice(filled, start, end, caretOffset);
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

      // ---- View mode: just the rendered equation, click to edit ------------
      // Always render the *committed* latex here (not the live draft) so a
      // cancelled edit never leaks into the saved view.
      if (!open) {
        const committed = katex.renderToString(latex || "\\;", {
          throwOnError: false,
          displayMode: true,
        });
        return (
          <div
            className="math-view"
            contentEditable={false}
            onClick={() => {
              setDraft(latex);
              setCaret(latex.length);
              setOpen(true);
            }}
            title="click to edit"
            dangerouslySetInnerHTML={{ __html: committed }}
          />
        );
      }

      // ---- Edit mode: live preview on top, breadcrumb, toolbar, then code --
      return (
        <div className="math-editor" contentEditable={false}>
          {/* The change shows here, live, above everything you edit. */}
          <div className="math-live" dangerouslySetInnerHTML={{ __html: html }} />

          {/* Plain-English "you are here" — no LaTeX knowledge needed. */}
          <div className={`math-crumb ${problem ? "warn" : ""}`}>
            {problem ? (
              <span className="math-crumb-warn">⚠ {problem}</span>
            ) : path.length ? (
              <>
                <span className="math-crumb-pin">editing</span>
                {path.map((p, i) => (
                  <span key={i} className="math-crumb-step">
                    {p}
                  </span>
                ))}
              </>
            ) : (
              <>
                <span className="math-crumb-pin">editing</span>
                <span className="math-crumb-step">main line</span>
              </>
            )}
          </div>

          {/* Word-style ribbon: structures + a compact symbol strip.
              onMouseDown preventDefault keeps the textarea's cursor/selection
              intact when a button is clicked. */}
          <div className="math-toolbar">
            <div className="math-tool-row">
              {STRUCTURES.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  className="math-tool"
                  title={s.title}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insert(s.tpl)}
                  dangerouslySetInnerHTML={{ __html: structureIcons[i] }}
                />
              ))}
            </div>
            <div className="math-tool-row math-sym-row">
              {SYMBOLS.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  className="math-sym"
                  title={s.title}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insert(s.tpl)}
                >
                  {s.g}
                </button>
              ))}
            </div>
          </div>

          {/* The raw LaTeX — edit as code if you like. Typing `{` auto-closes. */}
          <textarea
            ref={inputRef}
            className="math-input"
            value={draft}
            spellCheck={false}
            autoFocus
            placeholder="click a symbol above, or type — e.g.  \int_0^1 x^2 dx"
            onChange={(e) => {
              setDraft(e.target.value);
              setCaret(e.target.selectionStart);
            }}
            onClick={syncCaret}
            onKeyUp={syncCaret}
            onSelect={syncCaret}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") return commit();
              if (e.key === "Escape") return cancel();
              // Auto-close braces so groups are always balanced.
              if (e.key === "{") {
                e.preventDefault();
                const ta = e.currentTarget;
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                const sel = draft.slice(start, end);
                splice(`{${sel}}`, start, end, 1 + sel.length);
              }
            }}
          />

          {/* Subtle AI helpers for people who don't want to touch LaTeX at all. */}
          <div className="math-ai-row">
            <label className="math-mini" title="Upload a photo of an equation">
              {busy === "photo" ? "reading…" : "📷 photo"}
              <input type="file" accept="image/*" hidden onChange={onPhoto} />
            </label>
            <span className="math-ai-sep" aria-hidden>
              or
            </span>
            <input
              className="math-desc"
              value={desc}
              placeholder="describe it in words…"
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && desc.trim())
                  call({ describe: desc.trim() }, "describe");
              }}
            />
            <button
              type="button"
              className="math-mini"
              disabled={!desc.trim() || busy === "describe"}
              onClick={() => call({ describe: desc.trim() }, "describe")}
            >
              {busy === "describe" ? "…" : "→"}
            </button>
          </div>

          {err && <div className="math-err">{err}</div>}

          <div className="math-actions">
            <button className="math-btn primary" onClick={commit}>
              done
            </button>
            <button className="math-btn" onClick={cancel}>
              cancel
            </button>
            <span className="math-hint">Ctrl+Enter to finish</span>
          </div>
        </div>
      );
    },
  }
);
