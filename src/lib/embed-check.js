import https from "node:https";
import http from "node:http";
import { getAppUrl } from "./app-url.js";

const MAX_REDIRECTS = 5;
// Kept well inside the route's own `maxDuration` (see route.js) — this is a
// single outbound fetch to a third-party site, not our own infrastructure,
// so it needs a hard ceiling regardless of how slow or unreachable that site
// is, and the whole request needs enough headroom left over for cold start
// and response overhead within maxDuration.
const TIMEOUT_MS = 6000;

// Our own origin, used to decide whether a `frame-ancestors <specific-origin>`
// directive would actually allow us.
export function getAppOrigin() {
  return getAppUrl();
}

/** Pure decision function: given response status + raw header values, decide
 * whether Skillsight is allowed to embed the page in an iframe. No network I/O,
 * so it is fully unit-testable. */
export function checkFrameHeaders({
  status,
  xfoRaw = [],
  cspRawValues = [],
  ourOrigin = getAppOrigin(),
} = {}) {
  if (typeof status !== "number" || status < 200 || status >= 300) {
    return {
      embeddable: false,
      reason: status
        ? `The site responded with HTTP ${status}.`
        : "The site did not respond.",
    };
  }

  // CSP frame-ancestors supersedes X-Frame-Options when present (per the
  // Content Security Policy spec), so check it first.
  const frameAncestorsDirectives = cspRawValues
    .map(parseFrameAncestors)
    .filter((d) => d !== null);

  if (frameAncestorsDirectives.length > 0) {
    // Every present policy must allow us; the strictest one wins.
    for (const sources of frameAncestorsDirectives) {
      const verdict = evaluateFrameAncestors(sources, ourOrigin);
      if (!verdict.allowed) {
        return { embeddable: false, reason: verdict.reason };
      }
    }
    return { embeddable: true, reason: null };
  }

  const xfo = xfoRaw.find(Boolean)?.trim().toLowerCase();
  if (xfo) {
    if (xfo.includes("deny")) {
      return { embeddable: false, reason: "X-Frame-Options: DENY" };
    }
    if (xfo.includes("sameorigin")) {
      return { embeddable: false, reason: "X-Frame-Options: SAMEORIGIN" };
    }
  }

  return { embeddable: true, reason: null };
}

function parseFrameAncestors(cspValue) {
  if (!cspValue) return null;
  const directives = cspValue.split(";").map((d) => d.trim());
  const match = directives.find((d) => /^frame-ancestors(\s|$)/i.test(d));
  if (!match) return null;
  const [, ...sources] = match.split(/\s+/);
  return sources;
}

function evaluateFrameAncestors(sources, ourOrigin) {
  if (sources.length === 0 || sources.includes("'none'")) {
    return {
      allowed: false,
      reason: "Content-Security-Policy: frame-ancestors 'none'",
    };
  }
  if (sources.includes("*")) {
    return { allowed: true, reason: null };
  }
  if (sources.includes("'self'")) {
    return {
      allowed: false,
      reason: "Content-Security-Policy: frame-ancestors 'self'",
    };
  }
  if (sources.some((s) => originMatches(s, ourOrigin))) {
    return { allowed: true, reason: null };
  }
  return {
    allowed: false,
    reason: `Content-Security-Policy: frame-ancestors ${sources.join(" ")}`,
  };
}

function originMatches(source, ourOrigin) {
  try {
    const sourceOrigin = new URL(source).origin;
    return sourceOrigin === new URL(ourOrigin).origin;
  } catch {
    return false;
  }
}

/** Splits a Fetch-API-joined header value back into individual raw header
 * values. Safe because none of the headers we care about (X-Frame-Options,
 * Content-Security-Policy) use literal commas inside a single value. */
function splitJoinedHeader(value) {
  if (!value) return [];
  return value.split(",").map((v) => v.trim());
}

/** Follows redirects manually with node's http/https so we can read the
 * *final* hop's headers (fetch's automatic redirect-following in undici only
 * exposes the last response too, but we do this ourselves to keep full
 * control over timeouts and to collect every raw header value). */
export function fetchFinalHeaders(startUrl) {
  return new Promise((resolve) => {
    let redirects = 0;

    function request(currentUrl) {
      let parsed;
      try {
        parsed = new URL(currentUrl);
      } catch {
        resolve({ status: null, xfoRaw: [], cspRawValues: [], error: "Invalid URL" });
        return;
      }

      const client = parsed.protocol === "http:" ? http : https;
      const req = client.request(
        parsed,
        {
          method: "GET",
          headers: { "User-Agent": "Skillsight-EmbedCheck/1.0" },
          timeout: TIMEOUT_MS,
        },
        (res) => {
          res.resume(); // discard body, we only need headers/status
          const location = res.headers.location;
          if (
            [301, 302, 303, 307, 308].includes(res.statusCode) &&
            location &&
            redirects < MAX_REDIRECTS
          ) {
            redirects += 1;
            const nextUrl = new URL(location, currentUrl).toString();
            request(nextUrl);
            return;
          }

          resolve({
            status: res.statusCode,
            finalUrl: currentUrl,
            xfoRaw: splitJoinedHeader(res.headers["x-frame-options"]),
            cspRawValues: splitJoinedHeader(res.headers["content-security-policy"]),
            error: null,
          });
        }
      );

      req.on("timeout", () => {
        req.destroy();
        resolve({ status: null, xfoRaw: [], cspRawValues: [], error: "Timed out" });
      });
      req.on("error", (err) => {
        resolve({ status: null, xfoRaw: [], cspRawValues: [], error: err.message });
      });
      req.end();
    }

    request(startUrl);
  });
}

export async function checkEmbeddable(url) {
  const result = await fetchFinalHeaders(url);
  if (result.error) {
    return { embeddable: false, reason: `Could not verify: ${result.error}` };
  }
  return checkFrameHeaders(result);
}
