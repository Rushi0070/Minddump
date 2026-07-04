"use client";

import { createReactBlockSpec } from "@blocknote/react";

const ICONS: Record<string, string> = { note: "›", tip: "✦", warn: "⚠" };

export const CalloutBlock = createReactBlockSpec(
  {
    type: "callout",
    propSchema: {
      kind: { default: "note", values: ["note", "tip", "warn"] },
    },
    content: "inline",
  },
  {
    render: ({ block, editor, contentRef }) => {
      const kind = (block.props.kind as string) || "note";
      return (
        <div className={`callout callout-${kind}`}>
          <span className="callout-icon" contentEditable={false}>
            {ICONS[kind] ?? "›"}
          </span>
          <div className="callout-body" ref={contentRef} />
          <select
            className="callout-kind"
            contentEditable={false}
            value={kind}
            onChange={(e) =>
              editor.updateBlock(block, {
                type: "callout",
                props: { kind: e.target.value as "note" | "tip" | "warn" },
              })
            }
          >
            <option value="note">note</option>
            <option value="tip">tip</option>
            <option value="warn">warn</option>
          </select>
        </div>
      );
    },
  }
);
