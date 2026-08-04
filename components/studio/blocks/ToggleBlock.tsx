"use client";

import { createReactBlockSpec } from "@blocknote/react";

/**
 * A collapsible "aside" block. On the published site it renders as a native
 * <details> element: readers see the summary line and click to expand the body
 * — perfect for optional depth (derivations, "why does this work?" tangents)
 * without cluttering the main flow.
 *
 * In the editor we always show it expanded so the author can type freely: a
 * summary field on top, and the body (inline content) underneath.
 */
export const ToggleBlock = createReactBlockSpec(
  {
    type: "toggle",
    propSchema: {
      summary: { default: "Details" },
    },
    content: "inline",
  },
  {
    render: ({ block, editor, contentRef }) => {
      const summary = (block.props.summary as string) ?? "Details";
      return (
        <div className="toggle-block">
          <div className="toggle-block-head" contentEditable={false}>
            <span className="toggle-block-marker" aria-hidden>
              ▸
            </span>
            <input
              className="toggle-block-summary"
              value={summary}
              placeholder="Summary (what the reader clicks to expand)…"
              onChange={(e) =>
                editor.updateBlock(block, {
                  type: "toggle",
                  props: { summary: e.target.value },
                })
              }
            />
          </div>
          <div className="toggle-block-body" ref={contentRef} />
        </div>
      );
    },
  }
);
