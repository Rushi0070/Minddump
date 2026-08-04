import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPost,
  getAllSlugs,
  formatDate,
  getHeadings,
  getAdjacentPosts,
  readingStats,
} from "@/lib/posts";
import { renderBlocks } from "@/components/renderBlocks";
import Toc from "@/components/Toc";
import Lightbox from "@/components/Lightbox";
import ReadingProgress from "@/components/ReadingProgress";
import HeadingAnchors from "@/components/HeadingAnchors";
import CodeCopy from "@/components/CodeCopy";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) return {};
  return { title: post.title, description: post.summary };
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const body = await renderBlocks(post.blocks);
  const headings = getHeadings(post.blocks);
  const stats = readingStats(post.blocks);
  const { prev, next } = getAdjacentPosts(post.slug);

  return (
    <article className="pt-6">
      <ReadingProgress />
      <Toc headings={headings} />
      <header>
        <h1 className="mono text-3xl font-semibold leading-tight tracking-tight">
          {post.title}
        </h1>
        {post.summary && (
          <p className="mt-3 text-lg text-muted">{post.summary}</p>
        )}
        <div className="mono mt-3 text-sm text-faint">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span> · {stats.minutes} min read</span>
          <span> · {stats.words.toLocaleString()} words</span>
          {post.tags?.length > 0 && (
            <span> · {post.tags.map((t) => `#${t}`).join("  ")}</span>
          )}
        </div>
      </header>

      {post.cover && (
        <figure className="post-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover} alt={post.coverCredit || post.title} />
          {post.coverCredit && (
            <figcaption className="mono">{post.coverCredit}</figcaption>
          )}
        </figure>
      )}

      <div className="prose mt-10">{body}</div>
      <Lightbox />
      <HeadingAnchors />
      <CodeCopy />

      <div className="rule" aria-hidden>
        * * *
      </div>

      {/* Previous / next navigation — "prev" is newer, "next" is older. */}
      {(prev || next) && (
        <nav className="post-nav mono" aria-label="More posts">
          <div className="post-nav-side">
            {next && (
              <Link href={`/blog/${next.slug}`} className="post-nav-link">
                <span className="post-nav-dir">← older</span>
                <span className="post-nav-title">{next.title}</span>
              </Link>
            )}
          </div>
          <div className="post-nav-side post-nav-right">
            {prev && (
              <Link href={`/blog/${prev.slug}`} className="post-nav-link">
                <span className="post-nav-dir">newer →</span>
                <span className="post-nav-title">{prev.title}</span>
              </Link>
            )}
          </div>
        </nav>
      )}

      <p className="mono mt-8 text-sm">
        <Link href="/blog" className="text-muted hover:text-accent">
          ← back to all posts
        </Link>
      </p>
    </article>
  );
}
