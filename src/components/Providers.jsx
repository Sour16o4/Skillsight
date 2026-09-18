"use client";

import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "./ThemeProvider";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-full flex-1 flex-col">{children}</div>
      </MotionConfig>
    </ThemeProvider>
  );
}
