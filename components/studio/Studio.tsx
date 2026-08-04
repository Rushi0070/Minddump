"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "katex/dist/katex.min.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems, insertOrUpdateBlock } from "@blocknote/core";
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { MathBlock } from "./blocks/MathBlock";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { AnimeBlock } from "./blocks/AnimeBlock";
import { SidenoteBlock } from "./blocks/SidenoteBlock";
import { ToggleBlock } from "./blocks/ToggleBlock";
import { slugify, readingStats } from "@/lib/slug";

// Where in-progress work is mirrored so a refresh or crash never loses it.
const AUTOSAVE_KEY = "studio:autosave";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    math: MathBlock,
    callout: CalloutBlock,
    anime: AnimeBlock,
    sidenote: SidenoteBlock,
    toggle: ToggleBlock,
  },
});

type PostSummary = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  draft?: boolean;
  cover?: string;
  coverCredit?: string;
  blocks: any[];
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Upload a file (from the picker, a drop, or a clipboard paste) and return its
// URL. Wiring this into the editor is what makes Ctrl+V / drag-drop / screenshot
// paste "just work" — BlockNote routes all of them through here.
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data?.error || "upload failed");
  return data.url as string;
}

export default function Studio() {
  const editor = useCreateBlockNote({ schema, uploadFile });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [tags, setTags] = useState("");
  const [summary, setSummary] = useState("");
  const [date, setDate] = useState(today());
  const [draft, setDraft] = useState(false);
  const [cover, setCover] = useState("");
  const [coverCredit, setCoverCredit] = useState("");
  const [coverBusy, setCoverBusy] = useState(false);
  const [existing, setExisting] = useState<PostSummary[]>([]);
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState({ words: 0, minutes: 1 });

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  async function refreshList() {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      setExisting(data.posts || []);
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    refreshList();
  }, []);

  // One place that assembles the current working state into a post object.
  // Both saving and autosaving use it, so they can never drift apart.
  const gatherDraft = useCallback(() => {
    return {
      slug: slugify(slug || title),
      title: title || "Untitled",
      date,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      summary,
      draft,
      cover: cover.trim(),
      coverCredit: coverCredit.trim(),
      blocks: editor.document,
    };
  }, [slug, title, date, tags, summary, draft, cover, coverCredit, editor]);

  // Recompute the live word count / reading time from the editor's content.
  const recomputeStats = useCallback(() => {
    setStats(readingStats(editor.document as any));
  }, [editor]);

  // --- Autosave -------------------------------------------------------------
  // Mirror the whole working draft to localStorage shortly after any change,
  // so an accidental refresh or crash never loses work. Debounced so we are not
  // hammering storage on every keystroke.
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restored = useRef(false);
  // Always points at the latest save(); lets the keyboard shortcut call it
  // without re-registering the listener on every render.
  const saveRef = useRef<() => void>(() => {});

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      try {
        const snapshot = { ...gatherDraft(), savedAt: Date.now() };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot));
      } catch {
        /* storage full or unavailable — non-fatal */
      }
    }, 800);
  }, [gatherDraft]);

  // On first mount, offer to restore an unsaved draft from a previous session.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return;
      const snap = JSON.parse(raw);
      const hasContent =
        (snap.title && snap.title !== "Untitled") ||
        (Array.isArray(snap.blocks) &&
          snap.blocks.some((b: any) => (b.content?.length ?? 0) > 0));
      if (!hasContent) return;
      setTitle(snap.title === "Untitled" ? "" : snap.title || "");
      setSlug(snap.slug || "");
      setSlugTouched(true);
      setTags((snap.tags || []).join(", "));
      setSummary(snap.summary || "");
      setDate(snap.date || today());
      setDraft(!!snap.draft);
      setCover(snap.cover || "");
      setCoverCredit(snap.coverCredit || "");
      if (Array.isArray(snap.blocks) && snap.blocks.length) {
        editor.replaceBlocks(editor.document, snap.blocks as any);
      }
      setStatus("restored your unsaved draft (from this browser)");
      recomputeStats();
    } catch {
      /* ignore malformed autosave */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-run autosave whenever any metadata field changes (editor content changes
  // are handled by the editor's onChange below).
  useEffect(() => {
    scheduleAutosave();
  }, [title, slug, tags, summary, date, draft, cover, coverCredit, scheduleAutosave]);

  // Ctrl/Cmd+S saves, instead of opening the browser's "save page" dialog.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function loadPost(p: PostSummary) {
    setTitle(p.title);
    setSlug(p.slug);
    setSlugTouched(true);
    setTags((p.tags || []).join(", "));
    setSummary(p.summary || "");
    setDate(p.date || today());
    setDraft(!!p.draft);
    setCover(p.cover || "");
    setCoverCredit(p.coverCredit || "");
    try {
      if (Array.isArray(p.blocks) && p.blocks.length) {
        editor.replaceBlocks(editor.document, p.blocks as any);
      }
      recomputeStats();
      setStatus(`loaded "${p.title}"`);
    } catch (e: any) {
      setStatus(`couldn't load blocks: ${e?.message || e}`);
    }
  }

  async function doSave(): Promise<string | null> {
    const s = slugify(slug || title);
    if (!s) {
      setStatus("give it a title first");
      return null;
    }
    const post = {
      slug: s,
      title: title || "Untitled",
      date,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      summary,
      draft,
      cover: cover.trim(),
      coverCredit: coverCredit.trim(),
      blocks: editor.document,
    };
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      refreshList();
      return s;
    } catch (e: any) {
      setStatus(`save failed: ${e?.message || e}`);
      return null;
    }
  }

  async function save() {
    setStatus("saving…");
    const s = await doSave();
    if (s) setStatus(`saved → content/posts/${s}.json  ·  view at /blog/${s}`);
  }
  // Keep the shortcut pointed at the current save closure.
  saveRef.current = save;

  async function publish() {
    setStatus("saving…");
    const s = await doSave();
    if (!s) return;
    setStatus("publishing… (committing + pushing)");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Publish: ${title || s}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStatus(
        data.nothingNew
          ? `already up to date — nothing new to publish`
          : `published ✓  /blog/${s} — live on your site in ~1 min`
      );
    } catch (e: any) {
      setStatus(`publish failed: ${e?.message || e}`);
    }
  }

  function newPost() {
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setTags("");
    setSummary("");
    setDate(today());
    setDraft(false);
    setCover("");
    setCoverCredit("");
    editor.replaceBlocks(editor.document, [
      { type: "paragraph", content: "" },
    ] as any);
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch {
      /* ignore */
    }
    setStats({ words: 0, minutes: 1 });
    setStatus("new post");
  }

  // Upload a chosen file and use its URL as the post's cover image. Reuses the
  // same /api/upload endpoint the in-editor image blocks use.
  async function onCoverPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverBusy(true);
    try {
      const url = await uploadFile(file);
      setCover(url);
    } catch (err: any) {
      setStatus(`cover upload failed: ${err?.message || err}`);
    } finally {
      setCoverBusy(false);
      e.target.value = "";
    }
  }

  const slashItems = useMemo(
    () => (query: string) => {
      // A short, curated set — the handful of blocks these essays actually use,
      // in a deliberate order. Everything else BlockNote ships (video, audio,
      // file, check lists, emoji, toggle headings…) is intentionally left out
      // to keep the menu calm and Word-like rather than Notion-busy.
      const keep = [
        "Paragraph",
        "Heading 1",
        "Heading 2",
        "Heading 3",
        "Bullet List",
        "Numbered List",
        "Quote",
        "Code Block",
        "Table",
        "Image",
      ];
      const byTitle = new Map(
        getDefaultReactSlashMenuItems(editor).map((it: any) => [it.title, it])
      );
      const defaults = keep
        .map((t) => byTitle.get(t))
        .filter(Boolean) as any[];
      // Our custom "Technical" blocks come first so they are easy to reach.
      return filterSuggestionItems(
        [
          {
            title: "Math (equation)",
            group: "Technical",
            aliases: ["math", "latex", "equation", "tex", "formula"],
            subtext: "Display equation — photo, words, or LaTeX",
            icon: <span style={{ fontSize: 16 }}>∑</span>,
            onItemClick: () => insertOrUpdateBlock(editor, { type: "math" } as any),
          },
          {
            title: "Callout",
            group: "Technical",
            aliases: ["callout", "note", "tip", "warning", "aside"],
            subtext: "Highlighted note / tip / warning",
            icon: <span style={{ fontSize: 16 }}>›</span>,
            onItemClick: () =>
              insertOrUpdateBlock(editor, { type: "callout" } as any),
          },
          {
            title: "Sidenote (margin note)",
            group: "Technical",
            aliases: ["sidenote", "margin", "note", "aside", "tufte"],
            subtext: "Note that floats into the right margin",
            icon: <span style={{ fontSize: 16 }}>▸</span>,
            onItemClick: () =>
              insertOrUpdateBlock(editor, { type: "sidenote" } as any),
          },
          {
            title: "Toggle (collapsible)",
            group: "Technical",
            aliases: ["toggle", "details", "collapse", "expand", "spoiler"],
            subtext: "Collapsible section the reader clicks to expand",
            icon: <span style={{ fontSize: 16 }}>▸</span>,
            onItemClick: () =>
              insertOrUpdateBlock(editor, { type: "toggle" } as any),
          },
          {
            title: "Figure (wide image)",
            group: "Technical",
            aliases: ["figure", "diagram", "wide", "fullbleed", "full-bleed", "chart"],
            subtext: "Captioned image that can break out full-bleed",
            icon: <span style={{ fontSize: 16 }}>▭</span>,
            onItemClick: () =>
              insertOrUpdateBlock(editor, { type: "anime" } as any),
          },
          ...defaults,
        ],
        query
      );
    },
    [editor]
  );

  return (
    <div className="studio">
      <div className="studio-bar mono">
        <div className="studio-meta">
          <input
            className="studio-title"
            placeholder="post title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="studio-fields">
            <label>
              slug
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
              />
            </label>
            <label>
              date
              <input value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              tags
              <input
                value={tags}
                placeholder="ml, math"
                onChange={(e) => setTags(e.target.value)}
              />
            </label>
            <label className="studio-draft">
              <input
                type="checkbox"
                checked={draft}
                onChange={(e) => setDraft(e.target.checked)}
              />
              draft
            </label>
          </div>
          <input
            className="studio-summary"
            placeholder="one-line summary…"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <div className="studio-cover">
            <label className="math-btn">
              {coverBusy ? "uploading…" : cover ? "change cover" : "+ cover image"}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={onCoverPick}
              />
            </label>
            {cover && (
              <>
                <input
                  className="studio-cover-credit"
                  placeholder="cover credit / caption…"
                  value={coverCredit}
                  onChange={(e) => setCoverCredit(e.target.value)}
                />
                <button
                  type="button"
                  className="anime-clear"
                  onClick={() => {
                    setCover("");
                    setCoverCredit("");
                  }}
                >
                  remove
                </button>
              </>
            )}
          </div>
          {cover && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img className="studio-cover-preview" src={cover} alt="cover" />
          )}
        </div>
        <div className="studio-actions">
          <button
            className="math-btn primary"
            onClick={publish}
            title="Save, commit, and push — updates your live site"
          >
            publish
          </button>
          <button className="math-btn" onClick={save} title="Save locally only">
            save
          </button>
          <button className="math-btn" onClick={newPost}>
            new
          </button>
          <select
            className="studio-load"
            value=""
            onChange={(e) => {
              const p = existing.find((x) => x.slug === e.target.value);
              if (p) loadPost(p);
            }}
          >
            <option value="">load…</option>
            {existing.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
                {p.draft ? " (draft)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status && <div className="studio-status mono">{status}</div>}

      <div className="studio-editor">
        <BlockNoteView
          editor={editor}
          slashMenu={false}
          theme="light"
          onChange={() => {
            recomputeStats();
            scheduleAutosave();
          }}
        >
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) => slashItems(query)}
          />
        </BlockNoteView>
      </div>

      <div className="studio-footer mono">
        <span className="studio-count">
          {stats.words.toLocaleString()} words · {stats.minutes} min read ·
          autosaved
        </span>
        <p className="studio-hint">
          type <kbd>/</kbd> for blocks (math, code, tables, callouts, toggles,
          sidenotes) · images: <kbd>Ctrl</kbd>+<kbd>V</kbd> a screenshot, drag a
          file in, or <kbd>/</kbd>image · <kbd>Ctrl</kbd>+<kbd>S</kbd> to save ·
          click <b>publish</b> when ready
        </p>
      </div>
    </div>
  );
}
