# Hostinger deploy (marketing frontend only)

Payload CMS stays on **Vercel** (Postgres/Cockroach).  
Marketing Next.js + **Hostinger MySQL** = this app.

## Fix: “Build failed” + empty logs / null package.json

That Hostinger analysis usually means **Git clone never finished** (not a Next.js bug).

1. Deployments → reconnect GitHub (Hostinger GitHub App → grant `argroup-education`)
2. **Delete** the broken Web App and create a **new** Node.js Web App from Git
3. Use settings below exactly
4. Do **not** set Root directory to `apps/frontend` alone — monorepo needs **repo root** (`./`)

## Build settings (must use)

| Setting | Value |
|--------|--------|
| Framework | Next.js |
| Branch | `main` |
| Node | **22.x** |
| **Root directory** | **`./`** (repo root — NOT `apps/frontend`) |
| Build command | `npm run build:frontend` |
| Output directory | `apps/frontend/.next` |
| Start / entry | `npm run start --workspace=ar-education-frontend` |

## Environment variables (required)

```env
HOSTINGER=1
SKIP_WP_MEDIA_BUNDLE=1
NODE_ENV=production
DATABASE_URL=mysql://u559193891_Argroup2026:ARgroup%402026%23Db@srv1192.hstgr.io:3306/u559193891_argroup
NEXT_PUBLIC_SITE_URL=https://khaki-mole-176670.hostingersite.com
NEXT_PUBLIC_SITE_NAME=AR Group of Education
REVALIDATE_SECRET=your-secret
PAYLOAD_SYNC_SECRET=your-secret
```

`HOSTINGER=1` skips the huge wp-media copy that OOMs Hostinger builds.

Also set your real secrets (SMTP, GA, VAPID, etc.) from `apps/frontend/.env.hostinger.example`.

## MySQL

Already created: `u559193891_argroup` @ `srv1192.hstgr.io`  
Remote MySQL → Any Host (or app IP) allowed.

## After first successful deploy

Point custom domain later. Update Vercel CMS:

```env
BACKEND_API_URL=https://khaki-mole-176670.hostingersite.com
FRONTEND_APP_URL=https://khaki-mole-176670.hostingersite.com
```

CMS still needs its **own Postgres** (Cockroach revive / Neon) — not this MySQL URL.
