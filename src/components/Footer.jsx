import Link from "next/link";

const DEFAULT_LINKS = [
  { label: "Sign in", href: "/signin" },
  { label: "Admin", href: "/admin/login" },
];

export default function Footer({ links = DEFAULT_LINKS }) {
  return (
    <footer className="border-t border-border/80 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>&copy; {new Date().getFullYear()} Skillsight.</p>
        <nav className="flex items-center gap-5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring rounded-md transition-colors hover:text-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
