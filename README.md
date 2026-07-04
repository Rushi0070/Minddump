# sololeveling

A minimalist, nerdy technical blog — inspired by [maxmynter.com](https://www.maxmynter.com/),
Fergus Finn's deep-dives, and Notion's reading experience. Black-on-white, monospace
accents, KaTeX math, syntax-highlighted code, callouts, anime images, and an auto
table-of-contents for long posts.

It has **two surfaces in one Next.js app**:

1. **The reader site** (`/`, `/blog`, `/blog/[slug]`, `/about`) — static, fast, and
   simple. This is what you deploy and share.
2. **The studio** (`/studio`) — a local, Notion-style block editor where you write posts
   with a `/` slash menu (no markdown to remember). It turns **a photo of an equation**
   or **a plain-English description** into LaTeX via the Claude API. The studio is
   **disabled on the deployed site** — it only runs when you're developing locally.

Posts are stored as block JSON in `content/posts/*.json`. The same block components
render both in the editor and as static HTML on the public site — one source of truth.

---

## Run it locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The sample post lives at
`/blog/reparameterization-trick`.

## Write a post

1. Go to <http://localhost:3000/studio>.
2. Fill in the **title** (the slug auto-fills), and optionally date / tags / summary.
3. Write. Press **`/`** anywhere to insert a block:
   - **Math (equation)** — type LaTeX, **upload a photo** of an equation, or **describe
     it in words**; live KaTeX preview.
   - **Code Block** — pick a language; highlighted with Shiki on the site.
   - **Callout** — note / tip / warning.
   - **Anime / Image** — upload an image or paste a path (e.g. `/anime/gojo.png`).
   - plus headings, lists, quotes, dividers — all from the menu.
4. Click **save**. The post is written to `content/posts/<slug>.json` and appears at
   `/blog/<slug>`.
5. Use **load…** to reopen and edit an existing post.

### The math feature (photo → LaTeX)

The studio's math block calls the Claude API. Add your key once:

```bash
cp .env.local.example .env.local
# then edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at <https://console.anthropic.com/>. Restart `npm run dev` after adding it.
Without a key you can still type LaTeX by hand — and the equation photo can be
transcribed during a Claude Code session as a fallback.

## Deploy (Vercel)

```bash
npm i -g vercel   # if needed
vercel            # first run links/creates the project
vercel --prod     # deploy
```

- The reader pages are pre-rendered to static HTML; `/studio` and the `/api/*` routes
  **404 / are disabled in production**, so the public site stays a clean static blog.
- Set `NEXT_PUBLIC_SITE_URL` in Vercel to your final URL (used for OpenGraph tags).
- You do **not** need `ANTHROPIC_API_KEY` on Vercel — the math feature only runs in the
  local studio. Keep writing locally, then `git push` (or `vercel --prod`) to publish.

Because content is committed to the repo, publishing a post is just: write in the
studio → save → commit → deploy.

---

## Project map

```
app/
  page.tsx              home
  blog/                 post list + static post page (generateStaticParams)
  about/page.tsx
  studio/               the editor (dev-only guard)
  api/math              Claude OCR / describe → LaTeX  (dev-only)
  api/posts             save + list posts             (dev-only)
  api/upload            image upload → /public/uploads (dev-only)
components/
  renderBlocks.tsx      block JSON → static HTML (KaTeX + Shiki)
  Toc.tsx, Nav.tsx, ThemeToggle.tsx, Rule.tsx
  studio/               BlockNote editor + custom blocks (Math/Callout/Anime)
lib/
  posts.ts              read/list posts, headings, dates
  shiki.ts, slug.ts
content/posts/*.json    your posts
```

## Tech

Next.js (App Router) · TypeScript · Tailwind · BlockNote (editor) · KaTeX (math) ·
Shiki (code) · `@anthropic-ai/sdk` (math intelligence).
