import Link from "next/link";

const links = [
  { href: "/", label: "home" },
  { href: "/blog", label: "blog" },
  { href: "/about", label: "about" },
];

export default function Nav() {
  return (
    <nav className="mono flex items-center justify-between py-6 text-sm">
      <Link href="/" className="lowercase tracking-tight text-ink hover:text-accent">
        ~/sololeveling
      </Link>
      <div className="flex gap-3 text-muted">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-accent">
            [{l.label}]
          </Link>
        ))}
      </div>
    </nav>
  );
}
