"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function Favicon({ url, size = 16, loading = false, blocked = false }) {
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReducedMotion();
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    host = "";
  }

  return (
    <motion.span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center rounded-lg bg-text transition-opacity ${
        blocked ? "opacity-70" : "opacity-100"
      }`}
      style={{ width: 28, height: 28 }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <AnimatePresence>
        {loading && (
          <motion.span
            key="loading-ring"
            className="pointer-events-none absolute inset-0.5 rounded-full border-2"
            style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
            initial={{ opacity: 0, rotate: 0 }}
            animate={
              reduceMotion
                ? { opacity: 1, rotate: 0 }
                : { opacity: 1, rotate: 360 }
            }
            exit={{ opacity: 0 }}
            transition={
              reduceMotion
                ? { opacity: { duration: 0.2 } }
                : {
                    rotate: { repeat: Infinity, duration: 0.8, ease: "linear" },
                    opacity: { duration: 0.2 },
                  }
            }
          />
        )}
      </AnimatePresence>

      {failed || !host ? (
        <span className="rounded-sm bg-border" style={{ width: size, height: size }} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          // Fetching the site's own /favicon.ico directly is unreliable —
          // plenty of real sites (e.g. code.claude.com) redirect that path
          // to a webpage instead of serving an actual icon file, or use a
          // non-standard icon path entirely, so the <img> just fails to
          // load. Google's favicon service resolves the real icon
          // regardless of where a site actually keeps it.
          src={`https://www.google.com/s2/favicons?domain=${host}&sz=${size * 2}`}
          alt=""
          width={size}
          height={size}
          className="rounded-sm"
          onError={() => setFailed(true)}
        />
      )}
    </motion.span>
  );
}
