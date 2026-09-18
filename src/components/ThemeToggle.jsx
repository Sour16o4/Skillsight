"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "./ThemeProvider";

function subscribeNoop() {
  return () => {};
}
function getMountedSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

// React's own recommended way to get a hydration-safe "has this mounted on
// the client yet" flag without an effect calling setState (which would
// trigger a lint error for cascading renders) — the store never actually
// changes, it just reports `false` for the one render React reuses from the
// server and `true` for every client render after that.
function useMounted() {
  return useSyncExternalStore(subscribeNoop, getMountedSnapshot, getServerSnapshot);
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// One icon, two faces: a single round button whose glyph morphs between a
// sun and a moon as the mode flips, rather than a labeled switch.
export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  // The real theme is only known once this has mounted client-side (the
  // server always renders the same markup, with no idea which mode the
  // visitor's browser/localStorage will resolve to). Rendering a neutral
  // icon until then keeps the first client render identical to the server
  // render — swapping straight to the real icon on mount would otherwise
  // hydrate as a structural mismatch (a <path> where the server sent a
  // <circle>), which React can't patch up quietly.
  const mounted = useMounted();
  const isDark = mounted && theme === "dark";
  const icon = mounted ? (isDark ? <MoonIcon /> : <SunIcon />) : <SunIcon />;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      className={`skeu-depth focus-ring tap-target relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border text-text-muted transition-colors hover:border-highlight hover:text-highlight ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mounted ? (isDark ? "moon" : "sun") : "placeholder"}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {icon}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
