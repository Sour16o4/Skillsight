import { NextResponse } from "next/server";
import { getSiteBySlug } from "@/lib/sites";
import { checkEmbeddable } from "@/lib/embed-check";

// The header check's own fetch times out at 6s (see TIMEOUT_MS in
// embed-check.js). 10s here leaves ~4s of headroom for cold start, DNS,
// and response overhead, while still bounding the function far tighter
// than Vercel's own default/max (300s on every plan with Fluid compute) —
// there's no reason a single outbound HEAD-equivalent check should ever
// be allowed to run anywhere near that long.
export const maxDuration = 10;

// The API only ever accepts a known site slug, never an arbitrary URL, so it
// can't be used to make our server fetch attacker-controlled addresses.
// getSiteBySlug only ever returns *published* sites, so an unpublished site
// 404s here for guests and users alike, same as the homepage and /view/<slug>.
export async function GET(_request, { params }) {
  const { id } = await params;
  const site = await getSiteBySlug(id);

  if (!site) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const target = site.embedUrl || site.url;
  const result = await checkEmbeddable(target);

  return NextResponse.json(result);
}
