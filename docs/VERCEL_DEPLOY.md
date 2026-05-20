# Vercel — AR Group monorepo (images + deploy)

The Next.js site lives in **`apps/frontend`**. Static images (`/ar-group-logo.webp`, `/india-homepage.jpg`, etc.) come from **`apps/frontend/public/`** and must ship with every production deploy.

---

## Production curl check (after deploy)

Run from any terminal:

```bash
curl -sI https://YOUR-PROJECT.vercel.app/ar-group-logo.webp
curl -sI https://YOUR-PROJECT.vercel.app/india-homepage.jpg
curl -sI https://YOUR-PROJECT.vercel.app/about-counsellor.png
```

**Expect:** `HTTP/2 200` and `content-type: image/...`  
**If 404:** follow the checklist below, then **Redeploy** without build cache.

Known projects:

| URL | Notes |
|-----|--------|
| `https://argroup-education-beta.vercel.app` | Beta — use for smoke tests |
| `https://argroup-education.vercel.app` | Production alias (may differ per team) |

---

## Dashboard settings (canonical — do this first)

Open **Vercel → Project → Settings**.

### General → Root Directory

| Field | Value |
|--------|--------|
| **Root Directory** | `apps/frontend` |
| Leading slash | **No** — use `apps/frontend`, not `/apps/frontend` |
| **Include files outside the Root Directory in the Build Step** | **Enabled** |

Click **Save**.

### Build & Development Settings

| Field | Value |
|--------|--------|
| **Framework Preset** | Next.js |
| **Node.js Version** | **20.x** |
| **Install Command** | **Empty** (uses `apps/frontend/vercel.json` → `cd ../.. && npm ci`) |
| **Build Command** | **Empty** (uses `npm run build`) |
| **Output Directory** | **Empty** — never `.next` or `apps/frontend/.next` |
| **Development Command** | Default |

If **Output Directory** is set to `.next`, Vercel deploys only the build folder and **`public/` is not served** → all `/logo.webp`-style URLs return **404**.

### Environment variables

Copy from **`apps/frontend/.env.example`**. Set at least:

- `NEXT_PUBLIC_SITE_URL` — your production URL  
- `NEXT_PUBLIC_API_URL` — backend API (Railway, etc.)

---

## Which `vercel.json` applies?

| Vercel Root Directory | Config file used | Build |
|----------------------|------------------|--------|
| **`apps/frontend`** (recommended) | `apps/frontend/vercel.json` | `cd ../.. && npm ci` then `npm run build` in `apps/frontend` |
| **Empty** (repo root) | Root `vercel.json` | `npm ci` then `npm run vercel-build` (builds frontend + syncs `public/` + `.next` to repo root) |

**Recommendation:** set Root Directory to **`apps/frontend`** and ignore root `vercel.json` for day-to-day deploys.

Root `vercel.json` exists only for projects that cannot set Root Directory yet.

---

## Redeploy without cache

1. **Deployments** → latest deployment → **⋯** → **Redeploy**
2. **Uncheck** “Use existing Build Cache”
3. Confirm

Do this after changing Root Directory, Output Directory, or `vercel.json`.

---

## Git — `public/` must be tracked

```bash
git ls-files apps/frontend/public
```

Required files:

- `ar-group-logo.webp`
- `india-homepage.jpg`
- `abroad-homepage.jpg`
- `about-counsellor.png`

Build runs `scripts/verify-public-assets.mjs` and **fails** if any are missing.

---

## Code safeguards (already in repo)

1. **Plain `<img>` / CSS `url('/…')`** for logo, hero, about — no `next/image` for those assets (`images.unoptimized: true` globally).
2. **Fallback API** — `app/api/public-asset/[...path]` + `next.config.js` `fallback` rewrites serve marketing images from bundled `public/` when the static layer is missing.
3. **`npm run vercel-build`** — builds `apps/frontend` and syncs `public/` + `.next` to repo root for empty Root Directory.

---

## Local build parity

From repo root:

```bash
npm ci
cd apps/frontend && npm run build
```

Or monorepo root build (same as root `vercel.json`):

```bash
npm ci
npm run vercel-build
```

List assets after build:

```bash
ls apps/frontend/public
# optional: ls apps/frontend/.next/static
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|--------|-----|
| `/ar-group-logo.webp` → 404, HTML pages work | Output Directory = `.next` or wrong root | Clear Output Directory; set Root Directory = `apps/frontend`; redeploy without cache |
| Build: “`.next` was not found” | Root Directory = repo root but build only in subfolder | Set Root Directory = `apps/frontend` **or** use root `vercel.json` + `npm run vercel-build` |
| `npm ci` fails on Vercel | Lockfile out of sync | `npm install` at repo root, commit `package-lock.json`, redeploy |
| Images work locally, 404 on Vercel | `public/` not in git | `git add apps/frontend/public/*` and push |
| `/_next/image` 400 | `next/image` with wrong sizes | Use `<img src="/…">` or keep `images.unoptimized: true` |

---

## GitHub Actions

`.github/workflows/ci-cd.yml` deploys with **`working-directory: apps/frontend`**. The Vercel project must still use **Root Directory `apps/frontend`** in the dashboard so dashboard deploys and Action deploys match.

---

## Backend / CMS

Railway, CORS, Payload: **`docs/DEPLOYMENT.md`**.
