# Vercel deployment (AR Group monorepo)

## **Deploy mode (required)**

This monorepo deploys **only** with **Root Directory = `apps/frontend`**. There is no root `vercel.json` — building from the repo root without Root Directory fails because `.next` is created at `apps/frontend/.next`, not at the repository root.

| Setting | Required value |
|--------|----------------|
| **Root Directory** | `apps/frontend` |
| **Config file** | `apps/frontend/vercel.json` |

**If you see “No Next.js version detected” or “The Next.js output directory `.next` was not found”**, Root Directory is wrong or Output Directory is overridden in the dashboard. Fix both, save, then **Redeploy** the latest `main` commit.

### **Fix now (do these in order)**

1. **Deployments** → open the failed deployment → confirm the commit is the latest on `main`.
2. **Settings** → **General** → **Root Directory** → set exactly **`apps/frontend`** → **Save**.
3. **Settings** → **General** → **Build & Development Settings** → set **Node.js Version** to **20.x** (or leave default if `engines` in `apps/frontend/package.json` applies).
4. **Clear dashboard overrides** that fight `apps/frontend/vercel.json`: leave **Install Command**, **Build Command**, and **Output Directory** **empty** (empty = use repo config). **Never** set Output Directory to `apps/frontend/.next` or `.next` alone — that breaks static files from `public/`.
5. **Deployments** → latest → **⋮** → **Redeploy** (prefer **without** reusing cache after Root Directory or `vercel.json` changes).

---

## Mandatory: Root Directory = `apps/frontend`

If Root Directory is empty (repo root) or an old commit is deployed, builds fail with errors like:

```text
Warning: Could not identify Next.js version, ensure it is defined as a project dependency.
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies".
```

Or after removing a root `outputDirectory` override (commit `3f5b40aa`+):

```text
Error: The Next.js output directory ".next" was not found at "/vercel/path0/.next"
```

That happens because `npm run build` writes `.next` under `apps/frontend/`, while Vercel expects it at the project root when Root Directory is wrong.

### Dashboard steps (project **argroup-education**)

1. Open [Vercel Dashboard](https://vercel.com) → **argroup-education** → **Settings** → **General**.
2. Find **Root Directory** → click **Edit**.
3. Enter exactly: `apps/frontend` (no leading slash).
4. Confirm **Include source files outside of the Root Directory in the Build Step** is **enabled** (recommended for npm workspaces so `cd ../.. && npm ci` can see the monorepo root).
5. Click **Save**.
6. Go to **Deployments** → latest deployment → **⋮** → **Redeploy** (use “Redeploy with existing Build Cache” only if the build already succeeded once with the new root).

After this, Vercel reads `apps/frontend/package.json` (which includes `next`) and `apps/frontend/vercel.json`. There is **no** root `vercel.json` in this repo.

| Setting | Required value |
|--------|----------------|
| **Root Directory** | `apps/frontend` |
| **Framework Preset** | Next.js |
| **Install Command** | *(empty — uses `apps/frontend/vercel.json`)* → `cd ../.. && npm ci` |
| **Build Command** | *(empty — uses `apps/frontend/vercel.json`)* → `npm run build` |
| **Output Directory** | *(default — leave empty)* |
| **Node.js Version** | 20.x |

---

## Why repo-root builds are not supported

Building from the repository root without Root Directory requires either:

- **`outputDirectory`: `apps/frontend/.next`** — deploys the build cache **without** `public/` (broken logo, hero, and about images), or
- **No `outputDirectory`** — Vercel looks for `.next` at the repo root and fails with “output directory `.next` was not found”.

**Always use Root Directory `apps/frontend`.** This matches GitHub Actions (`working-directory: apps/frontend`).

---

## Why you see `404: NOT_FOUND`

Vercel returns **404: NOT_FOUND** when the deployment has **no Next.js app** at the configured root. This repo is a **monorepo**: the site lives in `apps/frontend`, not the repository root.

If the Vercel project was created from an early commit with **Root Directory** left empty (default = repo root), builds can show **Ready** while `argroup-education.vercel.app` serves Vercel’s platform 404 — not your Next.js app.

The marketing home is already wired:

- `/` → `apps/frontend/app/page.tsx` (re-exports `app/(marketing)/home/page.tsx`)
- `/home` → same home page

No extra redirect from `/` to `/home` is required.

---

## Broken images on Vercel (logo, hero, about)

If images work on `localhost:3000` but return **404** on production (e.g. `argroup-education-beta.vercel.app/ar-group-logo.webp`), the **`apps/frontend/public` folder is not in the deployment** — not a `next/image` issue.

### Root causes (this repo)

1. **Wrong Output Directory** — Dashboard must **not** set Output Directory to `apps/frontend/.next` or `.next` only. That deploys the build cache without `public/`. Leave Output Directory **empty** (Next.js default).
2. **Wrong Root Directory** — Without `apps/frontend`, Vercel may build from repo root and miss `public/`.
3. **Stale deploy** — Beta project still on an old commit before assets were added to git.

### Fix (beta + production)

1. **Settings** → **General** → **Root Directory** = `apps/frontend` → **Save**.
2. **Include source files outside of the Root Directory** = **enabled** (monorepo `npm ci` from `cd ../..`).
3. **Build & Development Settings** → **Output Directory** = **empty** (clear any override to `.next`).
4. **Deployments** → latest on `main` → **Redeploy** → **uncheck** “Use existing Build Cache”.
5. After deploy, verify (should be **200**, not HTML 404):

   ```bash
   curl.exe -sI https://argroup-education-beta.vercel.app/ar-group-logo.webp
   curl.exe -sI https://argroup-education-beta.vercel.app/india-homepage.jpg
   curl.exe -sI https://argroup-education-beta.vercel.app/about-counsellor.png
   ```

Critical paths are served as plain static files (`<img>` / CSS `background-image`), with `images.unoptimized: true` in `next.config.js` for any remaining `next/image` usage.

---

## Quick checklist before every production deploy

- [ ] **Root Directory** = `apps/frontend`
- [ ] **Output Directory** = empty (never `apps/frontend/.next` alone)
- [ ] Latest commit on `main` includes `apps/frontend/public/*` (`git ls-files apps/frontend/public`)
- [ ] **Redeploy** triggered after any Root Directory or Output Directory change (**without** build cache)
- [ ] `NEXT_PUBLIC_API_URL` and CMS URLs set under **Environment Variables**

### Linking the repo

1. **Settings** → **Git** → connect `ARGROUP OF EDUCTION` (or your GitHub repo).
2. Production branch: `main`.
3. Confirm the latest commit includes `apps/frontend` (not only an “Initial commit” at root).

### Environment variables (Vercel → Settings → Environment Variables)

Set for **Production** (and Preview if you use preview URLs):

| Variable | Example / notes |
|----------|-----------------|
| `NEXT_PUBLIC_API_URL` | `https://<your-railway-backend>.up.railway.app` |
| `NEXT_PUBLIC_SITE_URL` | `https://argroup-education.vercel.app` (or custom domain) |
| `NEXT_PUBLIC_SITE_NAME` | `AR Group of Education` |
| `NEXT_PUBLIC_CMS_URL` | Public Payload URL (browser / client) |
| `PAYLOAD_CMS_URL` | Same Payload URL for **server** routes (API routes, RSC). Use the public HTTPS URL in production (not `127.0.0.1`). |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `true` or `false` |
| `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTAG_ID` | Optional analytics |
| `PAYLOAD_CMS_API_KEY` | If Payload forms/pages require an API key |
| `PREVIEW_SECRET` / `REVALIDATE_SECRET` | Match Payload if using draft preview / revalidation |

See `apps/frontend/.env.example` for the full list and comments.

---

## Railway backend (for frontend env)

On **Railway** → your **backend** service → **Variables**, ensure at least:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL (Railway plugin provides this) |
| `PORT` | Railway sets this; app should listen on `process.env.PORT` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://argroup-education.vercel.app` (and custom domain if any) |
| `JWT_SECRET` | Strong secret for production |
| `JWT_EXPIRE` | e.g. `7d` |

Optional (see `apps/backend/.env.example`): SMTP, Cloudinary, Stripe, WhatsApp, Google Maps.

Copy the Railway **public URL** of the backend service into Vercel as `NEXT_PUBLIC_API_URL`.

If Payload CMS runs on Railway (or another host), set:

- `NEXT_PUBLIC_CMS_URL` → public CMS URL  
- `PAYLOAD_CMS_URL` → same URL for server-side fetches  

---

## Deploy from CLI (optional)

```bash
# From repo root, after npm install
cd apps/frontend
npx vercel link   # select org + project argroup-education
npx vercel --prod
```

Ensure the linked project’s **Root Directory** in the dashboard is still `apps/frontend`.

---

## GitHub Actions

`.github/workflows/ci-cd.yml` deploys with:

```yaml
working-directory: apps/frontend
```

Secrets required: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

The Vercel **project** must use Root Directory `apps/frontend` in the dashboard; the action does not override that setting.

---

## `npm ci` / lockfile out of sync (sharp optional deps)

Vercel runs `cd ../.. && npm ci` from `apps/frontend`. If the build fails with **Missing: @img/sharp-…** or similar, the root `package-lock.json` is out of sync with `package.json` (often after a Next.js upgrade that pulls in `sharp` with platform-specific optional packages).

**Fix at repo root:**

```bash
npm install          # regenerates package-lock.json
npm ci --dry-run     # should exit 0 when lockfile is in sync
cd apps/frontend && npm run build
```

Commit the updated `package-lock.json` on `main`. No `.npmrc` override is required unless you use non-default install flags locally.

---

## Verify locally

```bash
# From monorepo root
npm ci
npm run build:frontend
```

Or from `apps/frontend` (matches Vercel Root Directory):

```bash
cd apps/frontend
npm run build
npm run start
# Open http://localhost:3000 — should show the marketing home
```
