"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "katex/dist/katex.min.css";

import { useEffect, useMemo, useState } from "react";
import { BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems, insertOrUpdateBlock } from "@blocknote/core";
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { MathBlock } from "./blocks/MathBlock";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { AnimeBlock } from "./blocks/AnimeBlock";
import { SidenoteBlock } from "./blocks/SidenoteBlock";
import { slugify } from "@/lib/slug";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    math: MathBlock,
    callout: CalloutBlock,
    anime: AnimeBlock,
    sidenote: SidenoteBlock,
  },
});

type PostSummary = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  draft?: boolean;
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
  const [existing, setExisting] = useState<PostSummary[]>([]);
  const [status, setStatus] = useState("");

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

  function loadPost(p: PostSummary) {
    setTitle(p.title);
    setSlug(p.slug);
    setSlugTouched(true);
    setTags((p.tags || []).join(", "));
    setSummary(p.summary || "");
    setDate(p.date || today());
    setDraft(!!p.draft);
    try {
      if (Array.isArray(p.blocks) && p.blocks.length) {
        editor.replaceBlocks(editor.document, p.blocks as any);
      }
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
    editor.replaceBlocks(editor.document, [
      { type: "paragraph", content: "" },
    ] as any);
    setStatus("new post");
  }

  const slashItems = useMemo(
    () => (query: string) => {
      // Hide default media types we don't render on the static site.
      const hidden = ["Video", "Audio", "File", "Table"];
      const defaults = getDefaultReactSlashMenuItems(editor).filter(
        (it: any) => !hidden.includes(it.title)
      );
      return filterSuggestionItems(
        [
          ...defaults,
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
        <BlockNoteView editor={editor} slashMenu={false} theme="light">
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) => slashItems(query)}
          />
        </BlockNoteView>
      </div>

      <p className="studio-hint mono">
        type <kbd>/</kbd> for blocks (math, code, callouts, sidenotes) · images:{" "}
        <kbd>Ctrl</kbd>+<kbd>V</kbd> a screenshot/copied image, drag a file in, or{" "}
        <kbd>/</kbd>image · drag an image&apos;s edge to resize · click{" "}
        <b>publish</b> when ready
      </p>
    </div>
  );
}
