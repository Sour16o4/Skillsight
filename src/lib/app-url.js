// Single source of truth for the app's own origin. In production a missing
// NEXT_PUBLIC_APP_URL must fail loudly at startup, not silently fall back to
// localhost — that fallback would mean auth's baseURL/trustedOrigins and the
// embed-check's own-origin check all quietly point at the wrong place, and
// nothing would error until sign-in mysteriously stopped working. Development
// keeps the localhost default since there's no deploy risk there.
export function getAppUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is not set. Set it to the real production URL " +
        "before building — see DEPLOY.md. Refusing to fall back to " +
        "http://localhost:3000 in production."
    );
  }

  return "http://localhost:3000";
}
