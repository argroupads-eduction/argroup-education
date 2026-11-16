# Hostinger deploy — temporary live: https://khaki-mole-176670.hostingersite.com

## Why you see 503

Hostinger proxy reaches the Node process only if it listens on **`0.0.0.0:$PORT`**.

Common mistakes that cause **503 Service Unavailable**:

1. **Output directory** set to `apps/frontend/.next` → runtime loses `server.js` / monorepo → process never starts
2. **Start** using `next start` without `-H 0.0.0.0` while `HOSTNAME` is the container name
3. Branch still `main` with huge history (clone dies) — use **`hostinger-live`**

## Panel settings (copy exactly)

| Setting | Value |
|--------|--------|
| **Branch** | **`hostinger-live`** |
| Framework | Next.js or Other |
| Node | 20.x or 22.x |
| Root directory | `./` (blank / repo root) |
| **Build command** | **`npm run hostinger:build`** |
| **Output directory** | **LEAVE EMPTY** (delete `apps/frontend/.next` if set) |
| **Start command** | **`node server.js`** |

### ENV (minimum)

```env
HOSTINGER=1
SKIP_WP_MEDIA_BUNDLE=1
NODE_ENV=production
HOSTNAME=0.0.0.0
HTML_CACHE_TTL_MS=120000
DATABASE_URL=mysql://USER:PASSWORD@HOSTNAME:3306/DBNAME
NEXT_PUBLIC_SITE_URL=https://www.argroupofeducation.com
NEXT_PUBLIC_SITE_NAME=AR Group of Education
# Do NOT set WP_MEDIA_ORIGIN to www — that self-proxies and makes missing images take 20–30s.
# Only set it to a *separate* legacy WordPress/media host if files are not on disk.
# WP_MEDIA_ORIGIN=
```

Full file: `apps/frontend/.env.hostinger.example` → Import .env

After changing Output/Start → **Redeploy**.

## Speed (images + pages)

Live Node on shared Hostinger has high origin TTFB. After deploying the perf fixes:

1. **hPanel env:** remove `WP_MEDIA_ORIGIN` if it is `https://www.argroupofeducation.com` (or any self URL). Add `HTML_CACHE_TTL_MS=120000`.
2. **Cloudflare (recommended):** point DNS through Cloudflare → Caching → Cache Rules:
   - Cache everything under `/_next/static/*`, `/wp-content/*`, and common image extensions (`*.webp`, `*.jpg`, `*.png`, …) with long edge TTL.
   - Bypass or short TTL for `/api/*` and HTML if you need instant CMS updates; otherwise cache HTML briefly (1–5 min).
3. **Media on disk:** marketing images already ship in `public/`. Most legacy `wp-content/uploads` are gitignored — upload/sync needed files into the app `public/wp-content/` on the server (same URL paths) so `X-AR-Static: 1` serves them from disk. Do not delete existing files.

## Check Runtime logs

If still 503: Websites → Runtime logs. Look for `hostinger-server` or Prisma/MySQL errors.

## Domain later

Point `www.argroupofeducation.com` here, then update `NEXT_PUBLIC_SITE_URL`.