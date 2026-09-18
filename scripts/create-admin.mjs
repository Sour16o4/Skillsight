import "dotenv/config";
import { randomUUID } from "node:crypto";
import readline from "node:readline";
import { eq } from "drizzle-orm";
import { hash, Algorithm } from "@node-rs/argon2";
import { db, schema } from "../src/db/index.js";

// On piped (non-TTY) stdin — e.g. a non-interactive test run — both answers
// can arrive in a single underlying chunk, so two sequential rl.question()
// calls race: the second 'line' event fires before anything is listening
// for it. Read every line up front instead and hand them out in order.
async function readAllLines() {
  const rl = readline.createInterface({ input: process.stdin });
  const lines = [];
  for await (const line of rl) lines.push(line);
  return lines;
}

function readHidden(rl, promptText) {
  return new Promise((resolve) => {
    const onData = (char) => {
      char = char.toString();
      if (char === "\n" || char === "\r" || char === "") return;
      process.stdout.write("\x1b[2K\x1b[200D" + promptText + "*".repeat(rl.line.length));
    };
    process.stdout.write(promptText);
    process.stdin.on("data", onData);
    rl.question("", (answer) => {
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const emailArg = process.argv.find((a) => a.startsWith("--email"));
  const emailIndex = process.argv.indexOf("--email");
  const email =
    (emailArg && emailArg.includes("=") ? emailArg.split("=")[1] : null) ||
    (emailIndex !== -1 ? process.argv[emailIndex + 1] : null);

  if (!email) {
    console.error("Usage: npm run create-admin -- --email you@example.com");
    process.exit(1);
  }

  const [existing] = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);
  if (existing) {
    console.error(`A user with email ${email} already exists (role: ${existing.role}). Pick a different email.`);
    process.exit(1);
  }

  let password;
  let confirm;
  if (!process.stdin.isTTY) {
    const lines = await readAllLines();
    [password, confirm] = lines;
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    password = await readHidden(rl, "Password (min 12 characters): ");
    confirm = await readHidden(rl, "Confirm password: ");
    rl.close();
  }

  if (!password || password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  if (confirm !== password) {
    console.error("Passwords didn't match.");
    process.exit(1);
  }

  const userId = randomUUID();
  const passwordHash = await hash(password, { algorithm: Algorithm.Argon2id });
  const now = new Date();

  await db.insert(schema.user).values({
    id: userId,
    name: email.split("@")[0],
    email,
    emailVerified: true,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  console.log("\nAdmin created:", email);
  console.log("Sign in at /admin/login with this email and password.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
