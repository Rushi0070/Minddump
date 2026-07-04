import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function enabled() {
  return process.env.NODE_ENV !== "production";
}

export async function POST(req: NextRequest) {
  if (!enabled())
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "no file" }, { status: 400 });

  if (file.type && !file.type.startsWith("image/"))
    return NextResponse.json({ error: "only images are supported" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024)
    return NextResponse.json({ error: "image too large (max 20MB)" }, { status: 400 });

  const EXT: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/avif": "avif",
    "image/bmp": "bmp",
  };

  // Clipboard pastes / screenshots often arrive with no filename — synthesize one.
  let base = (file.name || "image")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
  if (!/\.[a-z0-9]+$/.test(base)) base += `.${EXT[file.type] || "png"}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = `${Date.now()}-${base}`;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, name), bytes);

  return NextResponse.json({ url: `/uploads/${name}` });
}
