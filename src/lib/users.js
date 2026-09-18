import { desc } from "drizzle-orm";
import { db, schema } from "@/db";

export async function getAllUsers() {
  return db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      role: schema.user.role,
      isSuperAdmin: schema.user.isSuperAdmin,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .orderBy(desc(schema.user.createdAt));
}
