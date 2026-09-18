"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Thumbnail from "./Thumbnail";
import TagList from "./TagList";
import CopyButton from "./CopyButton";

function OpenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.5 4H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9.5M9.5 3H13v3.5M7 9l6-6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SiteCard({ site, index = 0, firstPaint = false }) {
  return (
    <motion.li
      layout
      initial={firstPaint ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, delay: firstPaint ? index * 0.04 : 0 }}
      className="group relative flex aspect-[4/5] flex-col overflow-hidden rounded-3xl border border-border transition-colors hover:border-primary/60"
    >
      {/* Single stretched link: the whole card is one tab stop that opens the viewer. */}
      <Link
        href={`/view/${site.slug}`}
        className="focus-ring absolute inset-0 z-0 rounded-3xl"
        aria-label={`Open ${site.name} in Skillsight`}
      >
        <span className="sr-only">Open {site.name}</span>
      </Link>

      {/* Full-bleed photo behind everything, with a bottom-heavy black
          gradient scrim — fixed, not theme-tokened, same reasoning as
          .glass-badge: a photo needs consistent contrast regardless of
          whether the site itself is in light or dark mode. No frosted
          panel anymore — this gradient alone is what the overlay text
          sits on, so it's stronger/taller than before (it used to only
          need to support a badge strip; now it carries the whole bottom
          content block). */}
      <div className="pointer-events-none absolute inset-0">
        <Thumbnail site={site} className="h-full w-full" priority={index === 0} />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.78)_32%,rgba(0,0,0,0.35)_58%,rgba(0,0,0,0.05)_78%,transparent_100%)]" />
      </div>

      <div className="pointer-events-none relative z-10 flex items-start justify-between p-3">
        <span className="glass-badge rounded-full px-2.5 py-1 text-xs font-medium">
          {site.category}
        </span>
        <CopyButton text={site.url} iconOnly className="pointer-events-auto" />
      </div>

      {/* No panel/blur here at all — text sits directly on the black
          gradient above. Fixed light colors, same reasoning as before: the
          background under this text is always dark now, by construction. */}
      <div className="pointer-events-none relative z-10 mt-auto flex flex-col gap-2.5 p-5">
        <h2 className="legible-on-glass truncate font-display text-lg font-semibold tracking-tight text-white">
          {site.name}
        </h2>
        <p className="legible-on-glass line-clamp-2 text-sm font-medium leading-relaxed text-white/90">
          {site.description}
        </p>
        <TagList tags={site.tags} tone="glass" />

        <div className="pointer-events-auto pt-1.5">
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="skeu-depth focus-ring tap-target flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-hover"
          >
            <OpenIcon />
            Open original
          </a>
        </div>
      </div>
    </motion.li>
  );
}
