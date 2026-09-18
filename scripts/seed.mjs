import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db/index.js";

// Sites that used to be seeded here and were deliberately replaced — kept
// as an explicit list so re-running this script actually removes them from
// the database too, not just from this file (this script only upserts by
// slug otherwise, so a slug simply missing from SITES below would silently
// stick around forever).
const REMOVED_SLUGS = [
  "wikipedia",
  "github",
  "mdn",
  "excalidraw",
  "caniuse",
  "devdocs",
  "wiktionary",
  "wikidata",
  "wikimedia-commons",
  "wikivoyage",
  "photopea",
  "desmos",
  "geogebra",
  "openstreetmap",
];

// The curated site list — frontend/UI design tools and Claude Code
// resources. Re-running this script upserts by slug, so it's safe to run
// again after editing this list.
const SITES = [
  {
    slug: "claude-code-skills",
    name: "Claude Code Skills",
    description: "Official docs for extending Claude Code with Agent Skills.",
    url: "https://code.claude.com/docs/en/skills",
    embedUrl: null,
    image: null,
    category: "Docs",
    tags: ["claude", "skills"],
    featured: true,
    active: true,
  },
  {
    slug: "anthropic-skills-repo",
    name: "Anthropic Skills",
    description: "Anthropic's public repository of open-source Agent Skills.",
    url: "https://github.com/anthropics/skills",
    embedUrl: null,
    image: null,
    category: "Community",
    tags: ["claude", "skills", "open-source"],
    featured: true,
    active: true,
  },
  {
    slug: "aitmpl-skills",
    name: "AI Templates — Claude Skills",
    description: "Pre-built Claude Code skill templates and configurations.",
    url: "https://www.aitmpl.com/skills/",
    embedUrl: null,
    image: null,
    category: "Community",
    tags: ["claude", "skills", "templates"],
    featured: false,
    active: true,
  },
  {
    slug: "framer",
    name: "Framer",
    description: "A no-code website builder with real prototyping and animation.",
    url: "https://www.framer.com",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["design", "no-code"],
    featured: false,
    active: true,
  },
  {
    slug: "vscode",
    name: "Visual Studio Code",
    description: "A free, extensible code editor for web development.",
    url: "https://code.visualstudio.com",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["editor", "development"],
    featured: false,
    active: true,
  },
  {
    slug: "chrome-devtools",
    name: "Chrome DevTools",
    description: "Inspect, debug and profile web pages directly in the browser.",
    url: "https://developer.chrome.com/docs/devtools",
    embedUrl: null,
    image: null,
    category: "Docs",
    tags: ["debugging", "browser"],
    featured: false,
    active: true,
  },
  {
    slug: "lighthouse",
    name: "Lighthouse",
    description: "Automated auditing for performance, accessibility and SEO.",
    url: "https://developer.chrome.com/docs/lighthouse",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["performance", "accessibility"],
    featured: false,
    active: true,
  },
  {
    slug: "codepen",
    name: "CodePen",
    description: "A social playground for front-end code experiments.",
    url: "https://codepen.org",
    embedUrl: null,
    image: null,
    category: "Community",
    tags: ["playground", "css"],
    featured: false,
    active: true,
  },
  {
    slug: "freecodecamp",
    name: "freeCodeCamp",
    description: "Free coding curriculum covering web development from scratch.",
    url: "https://www.freecodecamp.org",
    embedUrl: null,
    image: null,
    category: "Docs",
    tags: ["learning", "curriculum"],
    featured: false,
    active: true,
  },
  {
    slug: "claude-frontend-design-skill",
    name: "Claude Frontend Design Skill",
    description: "Anthropic's Agent Skill for building distinctive, production-grade UI.",
    url: "https://github.com/anthropics/skills/tree/main/skills/frontend-design",
    embedUrl: null,
    image: null,
    category: "Docs",
    tags: ["claude", "skills", "frontend"],
    featured: true,
    active: true,
  },
  {
    slug: "nextjs",
    name: "Next.js",
    description: "The React framework for production, built by Vercel.",
    url: "https://nextjs.org",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["react", "framework"],
    featured: false,
    active: true,
  },
  {
    slug: "tailwindcss",
    name: "Tailwind CSS",
    description: "A utility-first CSS framework for rapid UI development.",
    url: "https://tailwindcss.com",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["css", "styling"],
    featured: false,
    active: true,
  },
  {
    slug: "vite",
    name: "Vite",
    description: "A fast frontend build tool and dev server.",
    url: "https://vite.dev",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["build-tool", "dev-server"],
    featured: false,
    active: true,
  },
  {
    slug: "storybook",
    name: "Storybook",
    description: "A workshop for building and testing UI components in isolation.",
    url: "https://storybook.js.org",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["components", "testing"],
    featured: false,
    active: true,
  },
  {
    slug: "threejs",
    name: "Three.js",
    description: "A JavaScript library for creating 3D graphics in the browser.",
    url: "https://threejs.org",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["3d", "javascript"],
    featured: false,
    active: true,
  },
  {
    slug: "figma",
    name: "Figma",
    description: "Collaborative interface design and prototyping tool.",
    url: "https://www.figma.com",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["design", "prototyping"],
    featured: false,
    active: true,
  },
  {
    slug: "shadcn-ui",
    name: "shadcn/ui",
    description: "Copy-paste React components built on Radix UI and Tailwind.",
    url: "https://ui.shadcn.com",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["components", "react"],
    featured: false,
    active: true,
  },
  {
    slug: "radix-ui",
    name: "Radix UI",
    description: "Unstyled, accessible component primitives for React.",
    url: "https://www.radix-ui.com",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["components", "accessibility"],
    featured: false,
    active: true,
  },
  {
    slug: "chakra-ui",
    name: "Chakra UI",
    description: "Accessibility-first component library with easy theming.",
    url: "https://www.chakra-ui.com",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["components", "react"],
    featured: false,
    active: true,
  },
  {
    slug: "framer-motion",
    name: "Framer Motion",
    description: "A production-ready animation library for React.",
    url: "https://www.framer.com/motion/",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["animation", "react"],
    featured: false,
    active: true,
  },
  {
    slug: "gsap",
    name: "GSAP",
    description: "A fast, robust JavaScript animation library for any framework.",
    url: "https://gsap.com",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["animation", "javascript"],
    featured: false,
    active: true,
  },
  {
    slug: "lucide",
    name: "Lucide",
    description: "A clean, consistent open-source icon set.",
    url: "https://lucide.dev",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: ["icons", "design"],
    featured: false,
    active: true,
  },
  {
    slug: "example-draft",
    name: "Example Draft",
    description: "An unpublished entry, visible to admins only.",
    url: "https://example.com",
    embedUrl: null,
    image: null,
    category: "Tools",
    tags: [],
    featured: false,
    active: false,
  },
];

async function main() {
  for (const slug of REMOVED_SLUGS) {
    await db.delete(schema.sites).where(eq(schema.sites.slug, slug));
    console.log(`removed ${slug} (if it existed)`);
  }

  for (const site of SITES) {
    const [existing] = await db
      .select()
      .from(schema.sites)
      .where(eq(schema.sites.slug, site.slug))
      .limit(1);

    if (existing) {
      // Preserve a real image already on the row (set by
      // generate-thumbnails.mjs, or a manually-uploaded URL) — every entry
      // in SITES above hardcodes image: null, so blindly spreading `site`
      // here would silently wipe out every generated thumbnail any time
      // this script runs again for any reason (e.g. restoring one deleted
      // site brings this whole footgun along with it).
      const image = existing.image || site.image;
      await db
        .update(schema.sites)
        .set({ ...site, image, updatedAt: new Date() })
        .where(eq(schema.sites.slug, site.slug));
      console.log(`updated ${site.slug}`);
    } else {
      await db.insert(schema.sites).values({
        id: randomUUID(),
        ...site,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`inserted ${site.slug}`);
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
