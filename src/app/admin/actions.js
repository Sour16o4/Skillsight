"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin, requireSuperAdmin } from "@/lib/require-admin";
import { writeAuditLog } from "@/lib/audit-log";
import { validateSite } from "@/lib/validation";
import { getAllSites, getSiteByIdForAdmin } from "@/lib/sites";
import { getAllUsers } from "@/lib/users";

const MAX_UPLOAD_BYTES = 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function uploadThumbnailAction(formData) {
  await requireAdmin();

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return { error: "No file provided." };
  }
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    return { error: "Use a PNG, JPG or WebP file." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Keep the file under 1 MB." };
  }

  const { put } = await import("@vercel/blob");
  const ext = file.type.split("/")[1];

  // Don't force a `token` option here — @vercel/blob resolves credentials
  // itself, in order: an explicit token option, then BLOB_READ_WRITE_TOKEN,
  // then automatic OIDC auth via VERCEL_OIDC_TOKEN + BLOB_STORE_ID (which
  // Vercel injects into every deployed function automatically once a Blob
  // store is connected to the project — no manual token needed there at
  // all). Passing `token: undefined` explicitly would skip that fallback,
  // so the option is only set when a real value exists.
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    const blob = await put(`thumbnails/${randomUUID()}.${ext}`, file, {
      access: "public",
      ...(token ? { token } : {}),
    });
    return { url: blob.url };
  } catch {
    return {
      error:
        "Thumbnail uploads aren't configured here — set BLOB_READ_WRITE_TOKEN, or connect a Blob store on Vercel. Use a screenshot path or lettermark instead.",
    };
  }
}

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

export async function listSitesAction() {
  await requireAdmin();
  return getAllSites();
}

export async function createSiteAction(payload) {
  const session = await requireAdmin();

  const existingSlugs = (await getAllSites()).map((s) => s.slug);
  const errors = validateSite(payload, { existingSlugs });
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const id = randomUUID();
  const now = new Date();
  const record = {
    id,
    slug: payload.slug,
    name: payload.name,
    description: payload.description ?? "",
    url: payload.url,
    embedUrl: payload.embedUrl || null,
    image: payload.image || null,
    category: payload.category,
    tags: payload.tags ?? [],
    featured: Boolean(payload.featured),
    active: Boolean(payload.active),
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.sites).values(record);
  await writeAuditLog({
    adminId: session.user.id,
    action: "create",
    siteId: id,
    before: null,
    after: record,
    ip: await clientIp(),
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { site: record };
}

export async function updateSiteAction(id, payload) {
  const session = await requireAdmin();

  const before = await getSiteByIdForAdmin(id);
  if (!before) {
    return { errors: { form: "Site not found." } };
  }

  const existingSlugs = (await getAllSites())
    .filter((s) => s.id !== id)
    .map((s) => s.slug);
  const errors = validateSite(payload, { existingSlugs });
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const after = {
    ...before,
    slug: payload.slug,
    name: payload.name,
    description: payload.description ?? "",
    url: payload.url,
    embedUrl: payload.embedUrl || null,
    image: payload.image || null,
    category: payload.category,
    tags: payload.tags ?? [],
    featured: Boolean(payload.featured),
    active: Boolean(payload.active),
    updatedAt: new Date(),
  };

  await db.update(schema.sites).set(after).where(eq(schema.sites.id, id));
  await writeAuditLog({
    adminId: session.user.id,
    action: "update",
    siteId: id,
    before,
    after,
    ip: await clientIp(),
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { site: after };
}

export async function deleteSiteAction(id) {
  const session = await requireAdmin();

  const before = await getSiteByIdForAdmin(id);
  if (!before) return { errors: { form: "Site not found." } };

  await db.delete(schema.sites).where(eq(schema.sites.id, id));
  await writeAuditLog({
    adminId: session.user.id,
    action: "delete",
    siteId: id,
    before,
    after: null,
    ip: await clientIp(),
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleSiteFieldAction(id, field) {
  const session = await requireAdmin();
  if (field !== "active" && field !== "featured") {
    throw new Error("Invalid field");
  }

  const before = await getSiteByIdForAdmin(id);
  if (!before) return { errors: { form: "Site not found." } };

  const after = { ...before, [field]: !before[field], updatedAt: new Date() };
  await db.update(schema.sites).set(after).where(eq(schema.sites.id, id));

  const action =
    field === "active"
      ? after.active
        ? "publish"
        : "unpublish"
      : after.featured
        ? "feature"
        : "unfeature";

  await writeAuditLog({
    adminId: session.user.id,
    action,
    siteId: id,
    before,
    after,
    ip: await clientIp(),
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { site: after };
}

export async function listUsersAction() {
  await requireAdmin();
  return getAllUsers();
}

// Any admin can promote a regular user to admin.
export async function promoteUserAction(userId) {
  const session = await requireAdmin();

  const [target] = await db.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1);
  if (!target) return { errors: { form: "User not found." } };
  if (target.role === "admin") return { errors: { form: "Already an admin." } };

  await db
    .update(schema.user)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(schema.user.id, userId));

  await writeAuditLog({
    adminId: session.user.id,
    action: "promote-admin",
    siteId: null,
    before: { id: target.id, email: target.email, role: target.role },
    after: { id: target.id, email: target.email, role: "admin" },
    ip: await clientIp(),
  });

  revalidatePath("/admin");
  return { ok: true };
}

// Only the original admin (isSuperAdmin) can demote another admin back to a
// regular user. requireSuperAdmin() enforces this on the server — the UI
// hiding the button for everyone else is convenience, never the real gate.
export async function demoteAdminAction(userId) {
  const session = await requireSuperAdmin();

  const [target] = await db.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1);
  if (!target) return { errors: { form: "User not found." } };
  if (target.role !== "admin") return { errors: { form: "Not an admin." } };
  if (target.isSuperAdmin) {
    return { errors: { form: "The original admin can't be demoted." } };
  }

  await db
    .update(schema.user)
    .set({ role: "user", updatedAt: new Date() })
    .where(eq(schema.user.id, userId));

  await writeAuditLog({
    adminId: session.user.id,
    action: "demote-admin",
    siteId: null,
    before: { id: target.id, email: target.email, role: target.role },
    after: { id: target.id, email: target.email, role: "user" },
    ip: await clientIp(),
  });

  revalidatePath("/admin");
  return { ok: true };
}
