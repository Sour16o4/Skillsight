"use client";

import { useState, useCallback } from "react";

export default function Thumbnail({ site, className = "", priority = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // A cached image can finish loading before React attaches the onLoad
  // listener, so the load event fires once and is missed — the image then
  // sits at opacity-0 forever. This ref callback checks `complete` the
  // moment the node mounts, which catches that race.
  const imgRef = useCallback((node) => {
    if (node?.complete) setLoaded(true);
  }, []);
  const showFallback = !site.image || failed;
  const letter = site.name.trim().charAt(0).toUpperCase();

  return (
    <div
      className={`relative overflow-hidden bg-surface ${className}`}
    >
      {!showFallback && (
        <>
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-border/60" aria-hidden="true" />
          )}
          {/* Plain <img>, not next/image: these thumbnails are already
              pre-sized, pre-optimized local webp files, so next/image's
              runtime resize/optimize proxy is pure round-trip overhead here
              — measured as a real LCP regression (89 -> 86 on Lighthouse
              mobile) when tried. Width/height + fetchPriority give the same
              "right size, priority" benefit without that cost. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={site.image}
            alt=""
            width={640}
            height={400}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </>
      )}
      {showFallback && (
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-surface-sunk to-background"
          aria-hidden="true"
        >
          <span
            className="absolute h-20 w-20 rounded-full border border-primary/25"
            style={{ boxShadow: "0 0 40px 4px color-mix(in srgb, var(--color-primary) 18%, transparent)" }}
          />
          <span className="relative font-display text-4xl font-semibold text-primary">
            {letter}
          </span>
        </div>
      )}
    </div>
  );
}
