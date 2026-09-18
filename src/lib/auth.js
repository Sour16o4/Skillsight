import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware, getIP, isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { hash, verify, Algorithm } from "@node-rs/argon2";
import { db, schema } from "../db/index.js";
import { recordLoginAttempt, isLockedOut } from "./login-lockout.js";
import { getAppUrl } from "./app-url.js";

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const auth = betterAuth({
  baseURL: getAppUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [getAppUrl()],

  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    // Argon2id — replaces Better Auth's scrypt default.
    password: {
      hash: (password) => hash(password, { algorithm: Algorithm.Argon2id }),
      verify: ({ hash: storedHash, password }) => verify(storedHash, password),
    },
  },

  // role and isSuperAdmin are both server-only: `input: false` means a
  // sign-up (or any other client-supplied) body that includes either field
  // is silently dropped. role can still be changed server-side by an admin
  // (see promoteUserAction/demoteAdminAction); isSuperAdmin can't be set by
  // any code path at all — only ever directly in the database.
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
      isSuperAdmin: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },

  socialProviders: googleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          // Google sign-in only ever touches the `user` role default above —
          // there is no path from an OAuth profile to role=admin.
        },
      }
    : {},

  plugins: [nextCookies()],

  rateLimit: {
    enabled: true,
    // Database storage: an in-memory limiter wouldn't survive Vercel's
    // separate serverless instances.
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = ctx.body?.email;
      if (!email) return;
      const locked = await isLockedOut(email);
      if (locked) {
        // Same message regardless of whether the account exists, so this
        // never confirms or denies an email is registered.
        throw new APIError("FORBIDDEN", {
          message: "Too many attempts. Try again in 15 minutes.",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = ctx.body?.email;
      if (!email) return;
      const success = !isAPIError(ctx.context.returned);
      const ip = getIP(ctx.headers ?? ctx.request, ctx.context.options) ?? "unknown";
      await recordLoginAttempt(email, ip, success);
    }),
  },
});
