import Link from "next/link";
import { getAllPosts, formatDate, type PostMeta } from "@/lib/posts";

export const metadata = { title: "blog" };

// Pull the year out of an ISO date; fall back to "undated" if it's malformed.
function yearOf(iso: string): string {
  const year = iso?.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "undated";
}

// Group posts into { year -> posts[] }, preserving the newest-first ordering
// that getAllPosts() already guarantees.
function groupByYear(posts: PostMeta[]): [string, PostMeta[]][] {
  const groups = new Map<string, PostMeta[]>();
  for (const post of posts) {
    const year = yearOf(post.date);
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(post);
  }
  return Array.from(groups.entries());
}

export default function Blog() {
  const posts = getAllPosts();
  const byYear = groupByYear(posts);

  return (
    <div className="pt-6">
      <h1 className="mono text-2xl font-semibold tracking-tight">blog</h1>

      {posts.length === 0 ? (
        <p className="mono mt-6 text-sm text-muted">
          no posts yet. open <code>/studio</code> to write the first one.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {byYear.map(([year, yearPosts]) => (
            <section key={year} className="post-year">
              <h2 className="mono text-sm uppercase tracking-widest text-faint">
                {year}
              </h2>
              <ul className="mt-4 space-y-6">
                {yearPosts.map((p) => (
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
