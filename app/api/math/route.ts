import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Authoring-only endpoint. Runs during local `next dev`; disabled on the
// deployed static site so nobody can spend your API budget from the public URL.
function enabled() {
  return process.env.NODE_ENV !== "production";
}

const MODEL = "claude-opus-4-8";

const SYSTEM = [
  "You are a LaTeX transcription tool.",
  "Return ONLY the LaTeX for the equation the user gives you.",
  "Output the raw math body with no surrounding $, $$, \\[ \\], no code fences,",
  "no explanation, no prose — just the LaTeX that would render the equation.",
  "Use standard amsmath commands. Prefer \\frac, \\sum, \\int, subscripts and",
  "superscripts, Greek macros, etc. If given an image, transcribe exactly what",
  "you see.",
].join(" ");

const IMAGE_TYPES: Record<string, "image/png" | "image/jpeg" | "image/gif" | "image/webp"> = {
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/gif": "image/gif",
  "image/webp": "image/webp",
};

function clean(text: string): string {
  let s = text.trim();
  // Strip accidental code fences or $-delimiters the model may add.
  s = s.replace(/^```(?:latex|tex)?\s*/i, "").replace(/```$/i, "").trim();
  s = s.replace(/^\\\[\s*/, "").replace(/\s*\\\]$/, "");
  s = s.replace(/^\${1,2}/, "").replace(/\${1,2}$/, "");
  return s.trim();
}

export async function POST(req: NextRequest) {
  if (!enabled())
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set — add it to .env.local (see .env.local.example)" },
      { status: 400 }
    );

  const client = new Anthropic();
  const contentType = req.headers.get("content-type") || "";

  try {
    let content: Anthropic.MessageParam["content"];

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const image = form.get("image");
      if (!(image instanceof File))
        return NextResponse.json({ error: "no image" }, { status: 400 });
      const media = IMAGE_TYPES[image.type] ?? "image/png";
      const data = Buffer.from(await image.arrayBuffer()).toString("base64");
      content = [
        { type: "image", source: { type: "base64", media_type: media, data } },
        { type: "text", text: "Transcribe this equation to LaTeX." },
      ];
    } else {
      const body = await req.json();
      const describe = String(body.describe || "").trim();
      if (!describe)
        return NextResponse.json({ error: "empty description" }, { status: 400 });
      content = `Write the LaTeX for: ${describe}`;
    }

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: "user", content }],
    });

    if (message.stop_reason === "refusal")
      return NextResponse.json({ error: "request was refused" }, { status: 422 });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return NextResponse.json({ latex: clean(text) });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json(
      { error: e?.message || "request failed" },
      { status }
    );
  }
}
