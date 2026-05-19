# Vercel deployment (AR Group monorepo)

## Mandatory: Root Directory = `apps/frontend`

**This is required.** Without it, Vercel builds from the repository root, where `package.json` has no `next` dependency (only Turbo workspaces). You will see a failed build like:

```text
Warning: Could not identify Next.js version, ensure it is defined as a project dependency.
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies".
```

### Dashboard steps (project **argroup-education**)

1. Open [Vercel Dashboard](https://vercel.com) → **argroup-education** → **Settings** → **General**.
2. Find **Root Directory** → click **Edit**.
3. Enter exactly: `apps/frontend` (no leading slash).
4. Confirm **Include source files outside of the Root Directory in the Build Step** is **enabled** (recommended for npm workspaces so `cd ../.. && npm ci` can see the monorepo root).
5. Click **Save**.
6. Go to **Deployments** → latest deployment → **⋮** → **Redeploy** (use “Redeploy with existing Build Cache” only if the build already succeeded once with the new root).

After this, Vercel reads `apps/frontend/package.json` (which includes `next`) and `apps/frontend/vercel.json`. The repo root `vercel.json` is **ignored** when Root Directory is set correctly — that is expected.

| Setting | Required value |
|--------|----------------|
| **Root Directory** | `apps/frontend` |
| **Framework Preset** | Next.js |
| **Install Command** | *(empty — uses `apps/frontend/vercel.json`)* → `cd ../.. && npm ci` |
| **Build Command** | *(empty — uses `apps/frontend/vercel.json`)* → `npm run build` |
| **Output Directory** | *(default — leave empty)* |
| **Node.js Version** | 20.x |

---

## Fallback: Root Directory left empty (not recommended)

If Root Directory cannot be changed yet, the repository root includes `vercel.json` and `next` in root `devDependencies` so Vercel can detect the framework and run `npm run build --workspace=ar-education-frontend`. Prefer setting **Root Directory** to `apps/frontend` instead — it matches how Next.js and this monorepo are meant to deploy.

---

## Why you see `404: NOT_FOUND`

Vercel returns **404: NOT_FOUND** when the deployment has **no Next.js app** at the configured root. This repo is a **monorepo**: the site lives in `apps/frontend`, not the repository root.

If the Vercel project was created from an early commit with **Root Directory** left empty (default = repo root), builds can show **Ready** while `argroup-education.vercel.app` serves Vercel’s platform 404 — not your Next.js app.

The marketing home is already wired:

- `/` → `apps/frontend/app/page.tsx` (re-exports `app/(marketing)/home/page.tsx`)
- `/home` → same home page

No extra redirect from `/` to `/home` is required.

---

## Quick checklist before every production deploy

- [ ] **Root Directory** = `apps/frontend`
- [ ] Latest commit on `main` includes `apps/frontend/package.json` with `"next"` in `dependencies`
- [ ] **Redeploy** triggered after any Root Directory change
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
# From monorepo root (recommended — matches Vercel install)
npm ci
cd apps/frontend
npm run build
```

Or from `apps/frontend` only (after root `npm ci`):

```bash
cd apps/frontend
npm run build
npm run start
# Open http://localhost:3000 — should show the marketing home
```
