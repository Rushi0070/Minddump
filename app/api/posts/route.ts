import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIR = path.join(process.cwd(), "content", "posts");

// Authoring endpoints are local-only. Never enabled on the deployed site.
function enabled() {
  return process.env.NODE_ENV !== "production";
}

export async function GET() {
  if (!enabled())
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  if (!fs.existsSync(DIR)) return NextResponse.json({ posts: [] });
  const posts = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  if (!enabled())
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  const body = await req.json();
  const slug = String(body.slug || "").trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug))
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });

  const post = {
    slug,
    title: String(body.title || "Untitled"),
    date: String(body.date || new Date().toISOString().slice(0, 10)),
    tags: Array.isArray(body.tags) ? body.tags : [],
    summary: String(body.summary || ""),
    draft: !!body.draft,
    blocks: Array.isArray(body.blocks) ? body.blocks : [],
  };

  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DIR, `${slug}.json`),
    JSON.stringify(post, null, 2),
    "utf8"
  );
  return NextResponse.json({ ok: true, slug });
}
