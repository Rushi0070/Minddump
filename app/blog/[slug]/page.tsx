import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getAllSlugs, formatDate, getHeadings } from "@/lib/posts";
import { renderBlocks } from "@/components/renderBlocks";
import Toc from "@/components/Toc";
import Lightbox from "@/components/Lightbox";

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

  return (
    <article className="pt-6">
      <Toc headings={headings} />
      <header>
        <h1 className="mono text-3xl font-semibold leading-tight tracking-tight">
          {post.title}
        </h1>
        <div className="mono mt-3 text-sm text-faint">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.tags?.length > 0 && (
            <span> · {post.tags.map((t) => `#${t}`).join("  ")}</span>
          )}
        </div>
      </header>

      <div className="prose mt-10">{body}</div>
      <Lightbox />

      <div className="rule" aria-hidden>
        * * *
      </div>
      <p className="mono text-sm">
        <Link href="/blog" className="text-muted hover:text-accent">
          ← back to all posts
        </Link>
      </p>
    </article>
  );
}
