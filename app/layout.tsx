import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import Nav from "@/components/Nav";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "sololeveling",
    template: "%s — sololeveling",
  },
  description:
    "A nerdy little corner of the internet — notes on machine learning, math, and whatever else is rattling around.",
  openGraph: {
    type: "website",
    title: "sololeveling",
    description:
      "Notes on machine learning, math, and whatever else is rattling around.",
  },
  twitter: { card: "summary_large_image" },
};

// Set the theme before paint to avoid a flash of the wrong palette.
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="mx-auto w-full max-w-prose px-5">
          <Nav />
          <main className="min-h-[70vh] pb-24">{children}</main>
          <footer className="mono flex items-center justify-between border-t border-line py-6 text-xs text-faint">
            <span>
              © {new Date().getFullYear()} · built with an unreasonable amount
              of tokens
            </span>
            <ThemeToggle />
          </footer>
        </div>
      </body>
    </html>
  );
}
