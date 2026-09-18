import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db/index.js";

// Grants isSuperAdmin — the one admin who can demote other admins, and who
// can never be demoted by anyone else (see AdminUsers.jsx: the "Remove
// admin" button only ever shows for non-super-admin admins). By design
// there is no UI or API path that can grant this to anyone, including
// other admins — it's set once, directly in the database, deliberately.
async function main() {
  const emailArg = process.argv.find((a) => a.startsWith("--email"));
  const emailIndex = process.argv.indexOf("--email");
  const email =
    (emailArg && emailArg.includes("=") ? emailArg.split("=")[1] : null) ||
    (emailIndex !== -1 ? process.argv[emailIndex + 1] : null);

  if (!email) {
    console.error("Usage: node scripts/set-super-admin.mjs --email you@example.com");
    process.exit(1);
  }

  const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);
  if (!user) {
    console.error(`No account with email ${email} exists.`);
    process.exit(1);
  }

  if (user.role !== "admin") {
    console.error(
      `${email} has role "${user.role}", not "admin" — run promote-admin.mjs or create-admin.mjs first.`
    );
    process.exit(1);
  }

  if (user.isSuperAdmin) {
    console.error(`${email} is already the super admin — nothing to do.`);
    process.exit(1);
  }

  const [otherSuperAdmin] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.isSuperAdmin, true))
    .limit(1);
  if (otherSuperAdmin) {
    console.log(
      `Note: ${otherSuperAdmin.email} is currently the super admin. Proceeding will give ` +
        `${email} the same power too — both accounts will be able to demote other admins ` +
        `and neither will be demotable.`
    );
  }

  await db
    .update(schema.user)
    .set({ isSuperAdmin: true, updatedAt: new Date() })
    .where(eq(schema.user.id, user.id));

  console.log(`\n${email} is now the super admin.`);
  console.log("They can promote users to admin, demote other admins, and can't be demoted themselves.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
