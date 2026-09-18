"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";

// Both tones render the same Rose Gold accent — admin and user views should
// show the identical logo color, "admin" is kept only as a distinct prop
// value in case callers want to diverge again later.
const TONE_ACCENTS = {
  primary: "var(--color-primary)",
  admin: "var(--color-primary)",
};

const RING_DIAMETER_EM = 1.1;
const TINT_RADIUS_EM = 0.5;

/**
 * Skillsight animated wordmark: a lens sweeps back and forth across the
 * name, tinting the letters it passes over. Every instance renders the
 * same continuous forward/reverse loop — this is the only brand mark in
 * the app, there is no separate icon glyph next to it.
 *
 * The tint (clip-path) and the ring outline are two separate elements, so
 * driving them with two independent `animate()` calls left them free to
 * drift apart (different CSS properties can get optimized/scheduled
 * differently by the browser). Instead, a single motion value ("progress",
 * 0 to 1) is the only thing actually animated; both the clip-path and the
 * ring's position are pure derivations (`useTransform`) of that one value,
 * so they are structurally the same number every frame — sync isn't
 * something that can drift, it's guaranteed by construction. Each circle
 * is inset by its *own* radius (not a shared one) so each one's edge
 * reaches exactly to the "S" and the "t" with no shortfall, and the sweep
 * uses a linear ease so it doesn't decelerate to a crawl right as it
 * reaches the last letter — with easing, the slow final stretch reads as
 * the sweep stopping short even though it technically still completes.
 */
export default function SkillsightLogo({
  className = "text-4xl",
  tone = "primary",
  duration = 3.2,
}) {
  const reduceMotion = useReducedMotion();
  const accent = TONE_ACCENTS[tone] ?? TONE_ACCENTS.primary;
  const wrapRef = useRef(null);
  const [metrics, setMetrics] = useState(null); // { width, fontSize }
  const progress = useMotionValue(0); // 0 -> 1, the single shared timeline

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      setMetrics({
        width: el.offsetWidth,
        fontSize: parseFloat(getComputedStyle(el).fontSize) || 16,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const controls = animate(progress, [0, 1], {
      duration,
      ease: "linear",
      repeat: Infinity,
      repeatType: "reverse",
    });
    return () => controls.stop();
  }, [reduceMotion, duration, progress]);

  let tintStart = 0;
  let tintEnd = 0;
  let tintRadiusPx = 0;
  let ringStart = 0;
  let ringEnd = 0;
  if (metrics) {
    const ringRadiusPx = (metrics.fontSize * RING_DIAMETER_EM) / 2;
    tintRadiusPx = metrics.fontSize * TINT_RADIUS_EM;
    // Each circle is inset by its own radius, independently, so each one's
    // edge reaches exactly to 0 / width with no shortfall either way.
    tintStart = tintRadiusPx;
    tintEnd = Math.max(tintRadiusPx, metrics.width - tintRadiusPx);
    ringStart = ringRadiusPx;
    ringEnd = Math.max(ringRadiusPx, metrics.width - ringRadiusPx);
  }

  const x = useTransform(progress, [0, 1], [ringStart, ringEnd]);
  const clipPath = useTransform(progress, (p) => {
    const cx = tintStart + (tintEnd - tintStart) * p;
    return `circle(${tintRadiusPx}px at ${cx}px 50%)`;
  });

  return (
    <span
      ref={wrapRef}
      role="img"
      aria-label="Skillsight"
      className={`relative inline-block select-none font-display font-semibold leading-none tracking-tight text-text ${className}`}
    >
      <span aria-hidden="true">Skillsight</span>

      {!reduceMotion && metrics && (
        <>
          <motion.span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ color: accent, clipPath }}
          >
            Skillsight
          </motion.span>

          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-0"
            style={{ x }}
          >
            <span
              className="block rounded-full"
              style={{
                width: `${RING_DIAMETER_EM}em`,
                height: `${RING_DIAMETER_EM}em`,
                border: `0.06em solid ${accent}`,
                boxSizing: "border-box",
                transform: "translate(-50%, -50%)",
              }}
            />
          </motion.span>
        </>
      )}
    </span>
  );
}
