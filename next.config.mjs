/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Public reader pages are statically pre-rendered via generateStaticParams.
  // We keep the full Next server (not `output: export`) so the dev-only /studio
  // and its API routes (math OCR, save) can run locally.
};

export default nextConfig;
