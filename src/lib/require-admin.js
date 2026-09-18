import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Server-side admin gate. Must be called at the top of every admin page,
 * every admin server action, and every admin route handler — proxy.js may
 * redirect for convenience but is never the only check (it can't be, since
 * it can't see server actions called directly).
 *
 * Returns the session. Redirects guests to /admin/login and rejects
 * non-admins with a 403-equivalent redirect to the homepage.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/admin/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return session;
}

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Server-side super-admin gate — for actions only the original admin may
 * take (currently: demoting another admin back to a regular user). Calls
 * requireAdmin() first, so the ordinary admin checks (session exists, role
 * is admin) still apply; this adds the isSuperAdmin check on top.
 */
export async function requireSuperAdmin() {
  const session = await requireAdmin();

  if (!session.user.isSuperAdmin) {
    redirect("/admin");
  }

  return session;
}
