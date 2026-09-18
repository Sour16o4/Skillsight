"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "skillsight-theme";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // The blocking script in layout.js already set data-theme on <html>
  // before hydration (avoiding a flash of the wrong theme); this just
  // reads that same value back so React's state agrees with the DOM.
  const [theme, setTheme] = useState(() => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private mode, disabled storage, etc.) —
      // theme still applies for this page load, just won't persist.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
