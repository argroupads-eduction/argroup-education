# Vercel deployment (AR Group monorepo)

## Why you see `404: NOT_FOUND`

Vercel returns **404: NOT_FOUND** when the deployment has **no Next.js app** at the configured root. This repo is a **monorepo**: the site lives in `apps/frontend`, not the repository root.

If the Vercel project was created from an early commit with **Root Directory** left empty (default = repo root), builds can show **Ready** while `argroup-education.vercel.app` serves Vercel’s platform 404 — not your Next.js app.

The marketing home is already wired:

- `/` → `apps/frontend/app/page.tsx` (re-exports `app/(marketing)/home/page.tsx`)
- `/home` → same home page

No extra redirect from `/` to `/home` is required.

---

## Required Vercel project settings

In [Vercel Dashboard](https://vercel.com) → project **argroup-education** → **Settings** → **General**:

| Setting | Value |
|--------|--------|
| **Root Directory** | `apps/frontend` |
| **Framework Preset** | Next.js |
| **Install Command** | `cd ../.. && npm ci` (or leave empty to use `apps/frontend/vercel.json`) |
| **Build Command** | `npm run build` |
| **Output Directory** | *(leave default — Next.js on Vercel uses `.next` automatically)* |
| **Node.js Version** | 20.x (recommended) |

After changing **Root Directory**, trigger **Redeploy** on the latest production deployment (Deployments → ⋮ → Redeploy).

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

## Verify locally

```bash
cd apps/frontend
npm run build
npm run start
# Open http://localhost:3000 — should show the marketing home
```
