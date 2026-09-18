import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Convenience only: a fast cookie-presence check so a signed-out visitor is
// redirected before the page even renders. It never confirms the admin role
// or 2FA status (that needs a DB read) and is never the real gate — every
// admin page, server action and route handler calls requireAdmin() itself
// (see src/lib/require-admin.js), which is what actually enforces this. A
// request that skips or spoofs this proxy (e.g. a spoofed
// x-middleware-subrequest header) still hits requireAdmin() and is rejected.
export async function proxy(request) {
  if (request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
