import Link from "next/link";
import SkillsightLogo from "@/components/SkillsightLogo";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <SkillsightLogo tone="primary" className="text-3xl" />
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
        Page not found
      </h1>
      <p className="max-w-sm text-text-muted">
        That page doesn&apos;t exist, or that site isn&apos;t on the shelf.
      </p>
      <Link
        href="/"
        className="skeu-depth focus-ring rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-ink transition-opacity hover:opacity-90"
      >
        Back to Skillsight
      </Link>
    </div>
  );
}
