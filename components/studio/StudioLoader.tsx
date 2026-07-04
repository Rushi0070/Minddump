"use client";

import dynamic from "next/dynamic";

// BlockNote touches the DOM on mount — load it client-only.
const Studio = dynamic(() => import("./Studio"), {
  ssr: false,
  loading: () => <div className="mono p-6 text-sm text-faint">loading studio…</div>,
});

export default function StudioLoader() {
  return <Studio />;
}
