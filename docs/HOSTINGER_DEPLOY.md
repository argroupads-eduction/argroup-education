# Hostinger deploy (marketing frontend → temporary *.hostingersite.com)

## Why every build failed (base cause)

Hostinger clones GitHub **`main`**. That tree used to include **`apps/frontend/public/wp-content` (~700MB+, 8k files)**.

Clone/prepare dies around **5 minutes** with **Build logs Lines: 0** and analysis “logs null / no files in `apps/frontend/.next`”. Not a Next.js compile error.

## What we changed on `main`

- Dropped bulk WP uploads from git (CDN via `WP_MEDIA_ORIGIN`)
- Kept `public/wp-content/uploads/colleges` (~48MB card images)
- `npm run hostinger:build` forces `HOSTINGER=1` + skips media bundling
- Live DB = **Hostinger MySQL** (269 blogs already imported)

Amplify is **paused for live traffic** — use Hostinger temp URL until you point the domain.

## Hostinger panel settings (use `main`)

| Setting | Value |
|--------|--------|
| **Branch** | **`main`** |
| Framework | Next.js or Other |
| Node | 22.x |
| Root directory | `./` |
| **Build command** | **`npm run hostinger:build`** |
| Output directory | `apps/frontend/.next` |
| Start command | `npm run start --workspace=ar-education-frontend` |

### Required ENV

```env
HOSTINGER=1
SKIP_WP_MEDIA_BUNDLE=1
NODE_ENV=production
DATABASE_URL=mysql://u559193891_Argroup2026:ARgroup%402026%23Db@srv1192.hstgr.io:3306/u559193891_argroup
NEXT_PUBLIC_SITE_URL=https://khaki-mole-176670.hostingersite.com
NEXT_PUBLIC_SITE_NAME=AR Group of Education
WP_MEDIA_ORIGIN=https://www.argroupofeducation.com
REVALIDATE_SECRET=<same as before>
PAYLOAD_SYNC_SECRET=<same as before>
```

After ENV + build command update → **Deploy** (or push to `main`).

## Domain later

When ready: Hostinger → Domains → point `www.argroupofeducation.com` → this app, then set `NEXT_PUBLIC_SITE_URL` to the real domain.

## Vercel CMS `/admin` (separate)

Payload still needs **Postgres** (Cockroach Finalize or Neon). Hostinger MySQL does **not** power `/admin`.
