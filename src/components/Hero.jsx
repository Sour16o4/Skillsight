"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl"
      >
        Every Skill, In Sight.
      </motion.h1>
    </div>
  );
}