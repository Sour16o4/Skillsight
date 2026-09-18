"use client";

import { createContext, useContext, useState } from "react";

const ShelfFiltersContext = createContext(null);

export function ShelfFiltersProvider({ children }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  return (
    <ShelfFiltersContext.Provider value={{ query, setQuery, category, setCategory }}>
      {children}
    </ShelfFiltersContext.Provider>
  );
}

// Returns null outside a provider (e.g. on auth pages that reuse SiteHeader
// without the shelf's search/filter row) instead of throwing.
export function useShelfFilters() {
  return useContext(ShelfFiltersContext);
}
