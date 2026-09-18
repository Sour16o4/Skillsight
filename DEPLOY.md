# Deploying Skillsight — step by step

Follow this in order. Each step names the exact command or the exact screen to use.

---

## 1. Create the Neon database (Vercel Marketplace)

1. In the Vercel dashboard, open your project (or create it first by importing this repo — Vercel will run its own build later, so importing now is fine even before env vars are set).
2. Go to **Storage** → **Create Database** → **Neon** (via the Marketplace) → follow the prompts to provision a Postgres database and link it to this project.
3. Once linked, Vercel adds a `DATABASE_URL` (and sometimes `DATABASE_URL_UNPOOLED`) to your project's environment variables automatically. **Use the pooled connection string** (the one with `-pooler` in the hostname) as `DATABASE_URL` — this project opens a database client per serverless invocation, and Neon's connection pooler is what keeps that from exhausting Postgres's connection limit under real traffic. If Vercel only exposes the unpooled one under a different variable name, copy the pooled URL into `DATABASE_URL` yourself.

---

## 2. Set every environment variable

In Vercel: **Project Settings → Environment Variables**. Add these for the **Production** environment (and Preview too, if you want preview deployments to work).

| Variable | Required | Value / where to get it |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | The pooled Neon connection string from step 1 |
| `BETTER_AUTH_SECRET` | **Yes** | Generate locally: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Your real production URL, e.g. `https://skillsight.vercel.app` (or your custom domain) — no trailing slash |
| `GOOGLE_CLIENT_ID` | Optional | Only if you want Google sign-in for users (never grants admin). Both Google vars must be set together or the button stays hidden |
| `GOOGLE_CLIENT_SECRET` | Optional | Paired with the above |
| `BLOB_READ_WRITE_TOKEN` | Optional | Only needed for thumbnail uploads in the admin form. Without it, upload is disabled with a clear message; lettermarks/screenshots still work |

**⚠️ `NEXT_PUBLIC_APP_URL` is baked into the JavaScript bundle at build time, not read at request time.** It must already be set to the real production URL *before you trigger the first build*. If you set it late, or change it after the fact (e.g. after adding a custom domain), the old value is still inside the already-built JS — you must trigger a fresh deployment (Vercel → Deployments → ⋯ → Redeploy, **not** a cached rebuild) for the new value to take effect. This also affects `trustedOrigins` and cookie behavior server-side, so a stale value here can silently break sign-in. If it's missing entirely at build time, the build now fails loudly and immediately rather than silently deploying something broken.

---

## 3. Set the Node.js version

The app's `package.json` pins `engines.node` to `24.x`, matching Vercel's current default (Vercel supports 24.x, 22.x, and 20.x; 24.x is the default for new projects as of this writing). Vercel reads `engines.node` automatically, so no dashboard change is *required* — but confirm it explicitly anyway:

1. Vercel dashboard → your project → **Settings** → **Build and Deployment** → **Node.js Version**.
2. Set it to **24.x** to match `package.json`.

**Note:** local development on this machine runs Node v26.7.0, which is *not* one of Vercel's supported versions (24.x is the newest). That's fine for local dev/test, but don't assume anything that depends on Node 26-specific behavior — the deployed app runs on 24.x. If something behaves differently in production than locally, this version gap is the first thing to check.

---

## 4. Trigger the first deploy

With the env vars in place, push to the branch Vercel is watching (or click **Deploy** in the dashboard if this is the first deploy). Wait for it to finish before continuing — steps 4–5 run against the live production database, and the app's own build doesn't run migrations for you.

---

## 5. Run migrations against production

This project uses `drizzle-kit push` (schema sync), not versioned migration files — there is no `drizzle/` migrations folder to apply. From your own machine, pointed at production:

```bash
DATABASE_URL="<the same pooled Neon URL you put in Vercel>" npx drizzle-kit push
```

Confirm any prompts it shows (there should be none against a brand-new database — it only prompts when it detects an ambiguous change against *existing* data, which won't apply the first time).

---

## 6. Run the seed

```bash
DATABASE_URL="<the same pooled Neon URL>" node scripts/seed.mjs
```

This is safe to re-run any time (it upserts by slug) — re-running it after editing the site list in `scripts/seed.mjs` is the normal way to update the shelf later.

---

## 7. Create your admin account

**⚠️ Admin access is email + password only — there is no second factor.** This was an explicit decision: anyone who obtains the admin password alone has full admin access (add/edit/remove/publish sites). Use a strong, unique password for this account and treat it accordingly.

Generate a production `BETTER_AUTH_SECRET` — never reuse the one from your local `.env`:

```bash
openssl rand -base64 32
```

Put that value in Vercel as `BETTER_AUTH_SECRET` (step 2) if you haven't already, then run:

```bash
DATABASE_URL="<the same pooled Neon URL>" node scripts/create-admin.mjs --email you@example.com
```

- **You choose the email and password** — there is no default admin account. `--email` is required; the script prompts for the password (typed twice, minimum 12 characters).
- Running this again with an email that already exists **refuses and makes no changes** — it exits with `A user with email <email> already exists (role: <role>). Pick a different email.` before ever touching the password. If you need to replace an admin, either pick a new email or remove the old row from the database first.
- To promote an existing signed-up account to admin instead of creating a new one, use `node scripts/promote-admin.mjs --email you@example.com` — it only flips the role, never touches the password.

---

## 8. Check immediately after deploying

Visit your production URL and confirm, in this order:

1. `/` loads and shows all 14 published sites (15 seeded, 1 — `example-draft` — deliberately unpublished and hidden).
2. Open an embeddable site (e.g. `/view/wikipedia`) — it should load inside the viewer.
3. Open a blocked one (e.g. `/view/github`) — it should show the "visit directly" fallback, not an error.
4. `/admin/login` → sign in with the admin account from step 7 → lands on `/admin` with your 15 sites listed. (Signing in via `/signin` with the same account also lands on `/admin`.)
5. Open your browser's dev tools → Application/Storage → Cookies, and confirm the session cookie has `Secure` and `HttpOnly` set (it will, automatically, once you're on `https://`).
6. `curl -sI https://<your-domain>/` and confirm `X-Frame-Options: DENY`, a `Content-Security-Policy` with `frame-ancestors 'none'`, and no `X-Powered-By` header.

If anything here fails, don't treat the deploy as done — see rollback below.

---

## 9. Rolling back

Vercel keeps every previous deployment. If the new deploy is broken:

1. Vercel dashboard → **Deployments** → find the last known-good deployment → **⋯ → Promote to Production**. This is instant and doesn't require a new build.
2. If the problem is *data*, not code (e.g. a bad seed run), the app code rollback above won't fix it — you'll need to fix the data directly against the Neon database (Neon's dashboard has a SQL editor, or connect with `psql "<DATABASE_URL>"`).
3. If the problem is a bad schema push (`drizzle-kit push` applied something destructive), Neon supports point-in-time restore from its dashboard — use that to recover the database to just before the bad push, then redeploy the last-good app code as in step 1.
