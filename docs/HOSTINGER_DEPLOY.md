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
DATABASE_URL=mysql://u559193891_Argroup2026:ARgroup%402026%23Db@srv1192.hstgr.io:3306/u559193891_argroup
NEXT_PUBLIC_SITE_URL=https://khaki-mole-176670.hostingersite.com
NEXT_PUBLIC_SITE_NAME=AR Group of Education
WP_MEDIA_ORIGIN=https://www.argroupofeducation.com
```

Full file: `apps/frontend/.env.hostinger` → Import .env

After changing Output/Start → **Redeploy**.

## Check Runtime logs

If still 503: Websites → Runtime logs. Look for `hostinger-server` or Prisma/MySQL errors.

## Domain later

Point `www.argroupofeducation.com` here, then update `NEXT_PUBLIC_SITE_URL`.
