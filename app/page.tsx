import Link from "next/link";
import Rule from "@/components/Rule";
import { getAllPosts, formatDate } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts().slice(0, 5);

  return (
    <div>
      <section className="pt-6">
        <h1 className="mono text-2xl font-semibold tracking-tight">
          hi, i&apos;m rushi <span className="text-accent">.</span>
        </h1>
        <p className="mt-5 text-muted">
          i study machine learning and i think out loud here — half-formed ideas
          about models, math, and the occasional rabbit hole. expect equations,
          code, and an unreasonable amount of anime.
        </p>
        <p className="mono mt-4 text-sm text-faint">
          a place to dump my mind, mostly.
        </p>
      </section>

      <Rule />

      <section>
        <h2 className="mono text-sm uppercase tracking-widest text-faint">
          latest
        </h2>
        {posts.length === 0 ? (
          <p className="mono mt-4 text-sm text-muted">
            nothing here yet — the first post is brewing.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {posts.map((p) => (
              <li key={p.slug} className="flex items-baseline gap-4">
                <time className="mono w-28 flex-none text-sm text-faint">
                  {formatDate(p.date)}
                </time>
                <Link
                  href={`/blog/${p.slug}`}
                  className="underline decoration-line decoration-1 underline-offset-4 hover:decoration-accent"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mono mt-6 text-sm">
          <Link href="/blog" className="text-muted hover:text-accent">
            → all posts
          </Link>
        </p>
      </section>
    </div>
  );
}
