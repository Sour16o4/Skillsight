"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SkillsightLogo from "./SkillsightLogo";
import ThemeToggle from "./ThemeToggle";
import Favicon from "./Favicon";
import CopyButton from "./CopyButton";
import TagList from "./TagList";

export default function Viewer({ site }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking"); // checking | embeddable | blocked | error
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/embed-check/${site.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setStatus(data.embeddable ? "embeddable" : "blocked");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("blocked");
      });

    return () => {
      cancelled = true;
    };
  }, [site.slug]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        router.push("/");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="flex h-dvh flex-col bg-surface-sunk">
      <div className="skeu-panel flex items-center gap-3 border-b border-border px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="focus-ring tap-target flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-text-muted hover:text-text"
        >
          <span aria-hidden="true">&larr;</span>
          <SkillsightLogo tone="primary" className="text-sm" />
        </button>

        <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

        <Favicon
          url={site.url}
          size={16}
          loading={status === "checking" || (status === "embeddable" && !iframeLoaded)}
          blocked={status === "blocked"}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">{site.name}</p>
        </div>
        <div className="hidden sm:block">
          <TagList tags={site.tags} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <CopyButton text={site.url} iconOnly />
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="skeu-depth focus-ring tap-target rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-hover"
          >
            Visit
          </a>
        </div>
      </div>

      {status === "checking" && (
        <div className="relative h-0.5 w-full overflow-hidden bg-border">
          <motion.div
            className="absolute inset-y-0 left-0 w-1/3 bg-primary"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
          />
        </div>
      )}

      <main className="relative flex-1">
        {status === "checking" && (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted">
            Checking if {site.name} allows embedding…
          </div>
        )}

        {status === "embeddable" && (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                Loading {site.name}…
              </div>
            )}
            <iframe
              key={site.slug}
              src={site.embedUrl || site.url}
              title={site.name}
              className="h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={() => setIframeLoaded(true)}
            />
          </>
        )}

        {status === "blocked" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <SkillsightLogo tone="primary" className="text-2xl" />
            <p className="max-w-sm text-text-muted">
              {site.name} doesn&apos;t allow itself to be opened inside another
              site. Visit it directly instead.
            </p>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="skeu-depth focus-ring tap-target rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-hover"
            >
              Visit {site.name}
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
