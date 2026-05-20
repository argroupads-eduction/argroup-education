# Vercel — AR Group monorepo (one setup)

The Next.js site lives in **`apps/frontend`**. Vercel must use that folder as the project root so `.next` and **`public/`** are deployed together. There is **no** root `vercel.json` in this repo; configuration is only **`apps/frontend/vercel.json`**.

---

## Dashboard settings (canonical)

| Setting | Value |
|--------|--------|
| **Root Directory** | `apps/frontend` (no leading slash) |
| **Framework Preset** | Next.js (auto) |
| **Include files outside Root Directory** | **Enabled** (needed so `installCommand` can run `cd ../.. && npm ci`) |
| **Install Command** | *(leave empty — uses repo)* → `cd ../.. && npm ci` |
| **Build Command** | *(leave empty — uses repo)* → `npm run build` (**not** `turbo run build`) |
| **Output Directory** | **Leave empty** (Next default). Never set `.next` or `apps/frontend/.next` here — that drops **`public/`** and breaks images. |
| **Node.js** | **20.x** (matches `engines` in `apps/frontend/package.json`) |

---

## Step 1 — Root Directory

**Settings → General → Root Directory** → `apps/frontend` → **Save**.

If Root Directory is the repo root, Vercel looks for `.next` at `/vercel/path0/.next` while Turbo/Next writes to `apps/frontend/.next` → **“The Next.js output directory `.next` was not found”**. Wrong root also causes **404: NOT_FOUND** or empty marketing routes.

---

## Step 2 — Clear Output Directory override

**Settings → Build & Development Settings → Output Directory** → **empty**. Same for Install/Build if you previously pasted wrong values; empty defers to **`apps/frontend/vercel.json`**.

---

## Step 3 — Redeploy without cache

After changing Root Directory, `vercel.json`, or Output Directory: **Deployments** → **⋯** → **Redeploy** → **uncheck** “Use existing Build Cache”.

---

## `public/` images 404 in production

Static files (e.g. `/ar-group-logo.webp`) come from **`apps/frontend/public`**. They are missing when **Output Directory** is overridden to only `.next`, or when **Root Directory** is wrong. Fix the two steps above, then redeploy without cache.

---

## Optional: repo root on your machine only

`npm run vercel-build` at the **monorepo root** runs `scripts/vercel-build-frontend.mjs` (builds **`apps/frontend`**). Use for **local checks** when you have not `cd`’d into `apps/frontend`. It does **not** replace setting **Root Directory = `apps/frontend`** on Vercel.

Local parity with CI:

```bash
npm ci
cd apps/frontend && npm run build
```

---

## GitHub Actions

`.github/workflows/ci-cd.yml` uses **`working-directory: apps/frontend`** for the Vercel deploy step and does not override build commands. The Vercel project must still use **Root Directory `apps/frontend`** in the dashboard.

---

## Lockfile (`npm ci` / sharp)

Install uses **`cd ../.. && npm ci`**. If `npm ci` fails (e.g. optional `@img/sharp-*`): from repo root run `npm install`, commit the updated **`package-lock.json`**, then redeploy.

---

## Env vars & backend

See **`apps/frontend/.env.example`**. Railway / CORS / Payload notes remain in **`docs/DEPLOYMENT.md`**.
