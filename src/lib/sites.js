import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "@/db";

export async function getPublicSites() {
  return db
    .select()
    .from(schema.sites)
    .where(eq(schema.sites.active, true))
    .orderBy(desc(schema.sites.featured), desc(schema.sites.createdAt));
}

export async function getAllSites() {
  return db.select().from(schema.sites).orderBy(desc(schema.sites.createdAt));
}

// Unpublished sites 404 for everyone except admins (who use getSiteBySlugForAdmin).
export async function getSiteBySlug(slug) {
  const [site] = await db
    .select()
    .from(schema.sites)
    .where(and(eq(schema.sites.slug, slug), eq(schema.sites.active, true)))
    .limit(1);
  return site ?? null;
}

export async function getSiteBySlugForAdmin(slug) {
  const [site] = await db
    .select()
    .from(schema.sites)
    .where(eq(schema.sites.slug, slug))
    .limit(1);
  return site ?? null;
}

export async function getSiteByIdForAdmin(id) {
  const [site] = await db.select().from(schema.sites).where(eq(schema.sites.id, id)).limit(1);
  return site ?? null;
}
