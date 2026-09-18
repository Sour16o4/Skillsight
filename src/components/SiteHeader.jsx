"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import SkillsightLogo from "./SkillsightLogo";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { useShelfFilters } from "./ShelfFilters";
import { CATEGORIES } from "@/lib/categories";

export default function SiteHeader({ session }) {
  const filters = useShelfFilters();
  const searchRef = useRef(null);

  useEffect(() => {
    if (!filters) return;
    function handleKeyDown(event) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filters]);

  return (
    <header className="skeu-panel sticky top-0 z-40 border-b border-divider bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2.5 max-md:gap-2 sm:flex-nowrap sm:px-6 sm:py-3">
        <Link href="/" className="focus-ring tap-target shrink-0 rounded-md">
          <SkillsightLogo tone="primary" className="text-2xl sm:text-3xl" />
        </Link>

        {filters && (
          <div className="order-3 flex w-full flex-wrap items-center justify-center gap-3 sm:order-none sm:w-auto sm:flex-1">
            <label className="relative w-full sm:w-auto sm:min-w-[9rem] sm:max-w-xs sm:flex-1">
              <span className="sr-only">Search sites</span>
              <input
                ref={searchRef}
                type="search"
                value={filters.query}
                onChange={(e) => filters.setQuery(e.target.value)}
                placeholder="Search the shelf… (press /)"
                className="skeu-well focus-ring w-full rounded-lg border border-border px-3.5 py-2 text-sm text-text placeholder:text-text-muted max-md:min-h-11"
              />
            </label>

            <div
              className="flex flex-wrap items-center justify-center gap-2"
              role="group"
              aria-label="Filter by category"
            >
              {["All", ...CATEGORIES].map((cat) => {
                const active = filters.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => filters.setCategory(cat)}
                    aria-pressed={active}
                    className={`skeu-depth focus-ring tap-target shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-ink"
                        : "border-border text-text-muted hover:border-highlight hover:text-highlight"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <ThemeToggle />
          {session ? (
            <>
              {session.user.role === "admin" && (
                <Link
                  href="/admin"
                  className="skeu-depth focus-ring tap-target flex h-9 items-center rounded-full border border-admin-accent/50 px-3.5 text-sm font-medium text-admin-accent hover:bg-admin-accent/10"
                >
                  Admin
                </Link>
              )}
              <UserMenu name={session.user.name} />
            </>
          ) : (
            <Link
              href="/signin"
              className="skeu-depth focus-ring tap-target flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium text-text transition-colors hover:border-highlight hover:text-highlight"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
