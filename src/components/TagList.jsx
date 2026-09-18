export default function TagList({ tags = [], tone = "surface" }) {
  if (!tags.length) return null;

  // "glass" is for tags floating directly on a photo (SiteCard's full-bleed
  // thumbnail background) — same fixed dark-scrim chip as .glass-badge, not
  // theme-tokened, so it stays legible over any photo regardless of theme.
  const chipClass =
    tone === "glass"
      ? "glass-badge rounded-full px-2 py-0.5 text-xs font-medium"
      : "rounded-full border border-divider bg-surface-sunk px-2 py-0.5 text-xs text-text-muted";

  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li key={tag} className={chipClass}>
          {tag}
        </li>
      ))}
    </ul>
  );
}
