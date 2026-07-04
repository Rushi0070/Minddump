"use client";

import { createReactBlockSpec } from "@blocknote/react";

// A Tufte-style margin note. In the reader it floats into the right gutter
// aligned with the surrounding text; here in the editor it shows as a simple
// bordered note you can type into.
export const SidenoteBlock = createReactBlockSpec(
  {
    type: "sidenote",
    propSchema: {},
    content: "inline",
  },
  {
    render: ({ contentRef }) => (
      <aside className="marginnote">
        <span className="marginnote-label" contentEditable={false}>
          ▸ note
        </span>
        <div ref={contentRef} />
      </aside>
    ),
  }
);
