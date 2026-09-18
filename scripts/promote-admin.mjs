import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db/index.js";

// Promotes an EXISTING account to admin — for turning a real signed-up user
// into an admin, as opposed to scripts/create-admin.mjs which only ever
// creates a brand-new one. Never touches the account's password.
async function main() {
  const emailArg = process.argv.find((a) => a.startsWith("--email"));
  const emailIndex = process.argv.indexOf("--email");
  const email =
    (emailArg && emailArg.includes("=") ? emailArg.split("=")[1] : null) ||
    (emailIndex !== -1 ? process.argv[emailIndex + 1] : null);

  if (!email) {
    console.error("Usage: node scripts/promote-admin.mjs --email you@example.com");
    process.exit(1);
  }

  const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);
  if (!user) {
    console.error(`No account with email ${email} exists. Sign up first, then promote it.`);
    process.exit(1);
  }

  if (user.role === "admin") {
    console.error(`${email} is already an admin — nothing to do.`);
    process.exit(1);
  }

  await db
    .update(schema.user)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(schema.user.id, user.id));

  console.log(`\nPromoted to admin: ${email}`);
  console.log("Sign in at /signin or /admin/login with this account's existing password.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
