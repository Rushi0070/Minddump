import fs from "node:fs";
import path from "node:path";
import { slugify, plainText } from "./slug";

export type { ReadingStats } from "./slug";
export { readingStats } from "./slug";

export type Block = {
  id?: string;
  type: string;
  props?: Record<string, any>;
  content?: any;
  children?: Block[];
};

export type PostMeta = {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  tags: string[];
  summary: string;
  draft?: boolean;
  cover?: string; // optional hero image URL shown at the top of the post
  coverCredit?: string; // small caption / credit line under the cover
};

export type Post = PostMeta & {
  blocks: Block[];
};

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

function readAll(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".json"));
  const posts: Post[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const data = JSON.parse(raw) as Post;
      if (!data.slug) data.slug = file.replace(/\.json$/, "");
      posts.push(data);
    } catch {
      // skip malformed files rather than crash the build
    }
  }
  return posts;
}

const isProd = process.env.NODE_ENV === "production";

function visible(p: Post): boolean {
  return !(isProd && p.draft);
}

export function getAllPosts(): PostMeta[] {
  return readAll()
    .filter(visible)
    .map(({ blocks, ...meta }) => meta)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post | null {
  const post = readAll().find((p) => p.slug === slug);
  if (!post || !visible(post)) return null;
  return post;
}

export function getAllSlugs(): string[] {
  return readAll().filter(visible).map((p) => p.slug);
}

export type Heading = { id: string; text: string; level: number };

export function getHeadings(blocks: Block[]): Heading[] {
  const hs: Heading[] = [];
  blocks.forEach((b, i) => {
    if (b.type === "heading") {
      const text = plainText(b.content);
      const level = Number(b.props?.level ?? 2);
      hs.push({ id: slugify(text) || `h-${i}`, text, level });
    }
  });
  return hs;
}

/**
 * Given a slug, find the posts immediately before and after it in the list
 * (which is sorted newest-first). "prev" is the newer post, "next" is the
 * older one — the same reading direction you get scrolling down an archive.
 */
export function getAdjacentPosts(slug: string): {
  prev: PostMeta | null;
  next: PostMeta | null;
} {
  const posts = getAllPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? posts[index - 1] : null,
    next: index < posts.length - 1 ? posts[index + 1] : null,
  };
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
