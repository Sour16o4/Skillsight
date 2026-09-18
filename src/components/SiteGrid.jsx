"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SiteCard from "./SiteCard";
import { useShelfFilters } from "./ShelfFilters";

export default function SiteGrid({ sites }) {
  const { query, category, setQuery, setCategory } = useShelfFilters();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sites.filter((site) => {
      const matchesCategory = category === "All" || site.category === category;
      if (!matchesCategory) return false;
      if (!q) return true;
      const haystack = `${site.name} ${site.description} ${site.tags.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [sites, query, category]);

  function clearFilters() {
    setQuery("");
    setCategory("All");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="text-text-muted">No sites match your search.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="focus-ring rounded-full border border-border px-4 py-2 text-sm font-medium text-text hover:border-highlight hover:text-highlight"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <motion.ul layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((site, i) => (
              <SiteCard key={site.id} site={site} index={i} />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
