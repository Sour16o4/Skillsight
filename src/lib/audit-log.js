import { randomUUID } from "node:crypto";
import { db, schema } from "@/db";

export async function writeAuditLog({ adminId, action, siteId, before, after, ip }) {
  await db.insert(schema.auditLog).values({
    id: randomUUID(),
    adminId,
    action,
    siteId: siteId ?? null,
    before: before ?? null,
    after: after ?? null,
    ip: ip ?? null,
  });
}
