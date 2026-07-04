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

  const bytes = Buffer.from(await file.arrayBuffer());
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
  const name = `${Date.now()}-${safe}`;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, name), bytes);

  return NextResponse.json({ url: `/uploads/${name}` });
}
