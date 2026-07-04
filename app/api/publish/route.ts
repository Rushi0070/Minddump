import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const exec = promisify(execFile);

// Local authoring only — commits content and pushes so the deployed site rebuilds.
function enabled() {
  return process.env.NODE_ENV !== "production";
}

async function git(args: string[]) {
  const { stdout } = await exec("git", args, {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

export async function POST(req: NextRequest) {
  if (!enabled())
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });

  let message = "Publish posts";
  try {
    const body = await req.json();
    if (body?.message) message = String(body.message).slice(0, 200);
  } catch {
    /* no body is fine */
  }

  try {
    // Is this even a git repo with a remote?
    await git(["rev-parse", "--is-inside-work-tree"]);
    const remotes = await git(["remote"]);
    if (!remotes) {
      return NextResponse.json(
        {
          error:
            "No git remote set. Run: git remote add origin <your-repo-url>, then push once.",
        },
        { status: 400 }
      );
    }

    // Stage everything and see if there's anything new.
    await git(["add", "-A"]);
    const staged = await git(["status", "--porcelain"]);
    let committed = false;
    if (staged) {
      await git(["commit", "-m", message]);
      committed = true;
    }

    // Push (also sends any earlier unpushed commits). Assumes upstream is set.
    let pushed = false;
    let pushDetail = "";
    try {
      pushDetail = await git(["push"]);
      pushed = true;
    } catch (e: any) {
      pushDetail = e?.stderr || e?.message || "push failed";
    }

    const branch = await git(["rev-parse", "--abbrev-ref", "HEAD"]);
    const ahead = await git(["rev-list", "--count", "@{u}..HEAD"]).catch(() => "0");

    if (!pushed) {
      return NextResponse.json(
        {
          error: `push failed — ${pushDetail}`,
          committed,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      committed,
      pushed,
      branch,
      nothingNew: !committed && ahead === "0",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.stderr || e?.message || "publish failed" },
      { status: 500 }
    );
  }
}
