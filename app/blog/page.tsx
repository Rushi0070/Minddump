import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";

export const metadata = { title: "blog" };

export default function Blog() {
  const posts = getAllPosts();

  return (
    <div className="pt-6">
      <h1 className="mono text-2xl font-semibold tracking-tight">blog</h1>

      {posts.length === 0 ? (
        <p className="mono mt-6 text-sm text-muted">
          no posts yet. open <code>/studio</code> to write the first one.
        </p>
      ) : (
        <ul className="mt-8 space-y-6">
          {posts.map((p) => (
            <li key={p.slug}>
              <div className="flex items-baseline gap-4">
                <time className="mono w-28 flex-none text-sm text-faint">
                  {formatDate(p.date)}
                </time>
                <div>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-lg underline decoration-line decoration-1 underline-offset-4 hover:decoration-accent"
                  >
                    {p.title}
                  </Link>
                  {p.summary && (
                    <p className="mt-1 text-sm text-muted">{p.summary}</p>
                  )}
                  {p.tags?.length > 0 && (
                    <p className="mono mt-1 text-xs text-faint">
                      {p.tags.map((t) => `#${t}`).join("  ")}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
