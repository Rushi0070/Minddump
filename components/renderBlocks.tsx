import React from "react";
import katex from "katex";
import { highlightCode } from "@/lib/shiki";
import { slugify, plainText } from "@/lib/slug";
import type { Block } from "@/lib/posts";

/* ----------------------------------------------------------------------------
   Shared renderer: BlockNote-style JSON -> React. Used by the static reader
   pages (server, async — Shiki/KaTeX run at build time). Inline styling mirrors
   BlockNote's inline content model so the editor and the site agree.
---------------------------------------------------------------------------- */

function inlineMath(latex: string, key: React.Key): React.ReactNode {
  const html = katex.renderToString(latex || "", {
    throwOnError: false,
    displayMode: false,
  });
  return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />;
}

// Split a text run on inline `$...$` math and render each math span with KaTeX.
// Single-line, non-empty content only, so stray dollar signs (prices) are left alone.
function splitInlineMath(text: string): React.ReactNode {
  const re = /\$([^$\n]+?)\$/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last)
      out.push(<React.Fragment key={`t${i}`}>{text.slice(last, m.index)}</React.Fragment>);
    out.push(inlineMath(m[1], `m${i}`));
    last = re.lastIndex;
    i++;
  }
  if (out.length === 0) return text;
  if (last < text.length)
    out.push(<React.Fragment key={`t${i}`}>{text.slice(last)}</React.Fragment>);
  return <>{out}</>;
}

function applyStyles(node: React.ReactNode, styles: any): React.ReactNode {
  if (!styles) return node;
  let n = node;
  if (styles.code) n = <code>{n}</code>;
  if (styles.bold) n = <strong>{n}</strong>;
  if (styles.italic) n = <em>{n}</em>;
  if (styles.underline) n = <u>{n}</u>;
  if (styles.strikethrough) n = <s>{n}</s>;
  return n;
}

function styled(text: string, styles: any, key: number): React.ReactNode {
  // Inline code is verbatim — never parse `$...$` inside it.
  const inner = styles?.code ? text : splitInlineMath(text);
  return <React.Fragment key={key}>{applyStyles(inner, styles)}</React.Fragment>;
}

function renderInline(content: any): React.ReactNode {
  if (content == null) return null;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;
  return content.map((item, i) => {
    if (item == null) return null;
    if (item.type === "text") return styled(item.text ?? "", item.styles, i);
    if (item.type === "link")
      return (
        <a key={i} href={item.href}>
          {renderInline(item.content)}
        </a>
      );
    if (item.type === "inlineMath" || item.type === "inline-math")
      return inlineMath(item.props?.latex ?? item.latex ?? "", i);
    if (typeof item.text === "string") return styled(item.text, item.styles, i);
    return null;
  });
}

async function renderBlock(b: Block, key: number): Promise<React.ReactNode> {
  switch (b.type) {
    case "heading": {
      const level = Number(b.props?.level ?? 2);
      const id = slugify(plainText(b.content)) || `h-${key}`;
      const Tag = (level === 4 ? "h4" : level === 3 ? "h3" : "h2") as
        | "h2"
        | "h3"
        | "h4";
      return (
        <Tag key={key} id={id}>
          {renderInline(b.content)}
          <a href={`#${id}`} className="anchor mono" aria-hidden>
            §
          </a>
        </Tag>
      );
    }
    case "paragraph":
      return <p key={key}>{renderInline(b.content)}</p>;
    case "quote":
      return <blockquote key={key}>{renderInline(b.content)}</blockquote>;
    case "divider":
      return (
        <div key={key} className="rule" aria-hidden>
          * * *
        </div>
      );
    case "math": {
      const html = katex.renderToString(b.props?.latex ?? "", {
        throwOnError: false,
        displayMode: true,
      });
      return <div key={key} dangerouslySetInnerHTML={{ __html: html }} />;
    }
    case "codeBlock":
    case "code": {
      const code = b.props?.code ?? plainText(b.content) ?? "";
      const lang = (b.props?.language ?? "plaintext") as string;
      const html = await highlightCode(code, lang);
      return <div key={key} dangerouslySetInnerHTML={{ __html: html }} />;
    }
    case "callout": {
      const kind = (b.props?.kind ?? "note") as string;
      const icon = kind === "warn" ? "⚠" : kind === "tip" ? "✦" : "›";
      return (
        <div key={key} className="callout">
          <span className="callout-icon" aria-hidden>
            {icon}
          </span>
          <div>{renderInline(b.content)}</div>
        </div>
      );
    }
    case "sidenote":
    case "marginnote":
      return (
        <aside key={key} className="marginnote">
          {renderInline(b.content)}
        </aside>
      );
    case "image":
    case "anime": {
      const url = b.props?.url as string | undefined;
      if (!url) return null;
      const caption = b.props?.caption as string | undefined;
      const width = b.props?.width as number | undefined;
      return (
        <figure key={key}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={caption || ""}
            style={width ? { maxWidth: `${width}px` } : undefined}
          />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    }
    default:
      return <p key={key}>{renderInline(b.content)}</p>;
  }
}

export async function renderBlocks(blocks: Block[]): Promise<React.ReactNode> {
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.type === "bulletListItem" || b.type === "numberedListItem") {
      const ordered = b.type === "numberedListItem";
      const items: Block[] = [];
      const start = i;
      while (i < blocks.length && blocks[i].type === b.type) {
        items.push(blocks[i]);
        i++;
      }
      const lis = items.map((it, k) => (
        <li key={k}>{renderInline(it.content)}</li>
      ));
      out.push(
        ordered ? (
          <ol key={`list-${start}`}>{lis}</ol>
        ) : (
          <ul key={`list-${start}`}>{lis}</ul>
        )
      );
      continue;
    }
    out.push(await renderBlock(b, i));
    i++;
  }
  return <>{out}</>;
}
