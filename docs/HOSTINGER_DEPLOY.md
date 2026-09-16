# Hostinger deploy (marketing frontend only)

## Why builds failed (base cause)

Hostinger clones the **whole GitHub repo**. This monorepo includes:

- `apps/frontend/public/wp-content` (~700MB+, 8k+ files)
- `ar-group-of-eductions` (Payload CMS, not needed on Hostinger)

That often dies at **Preparing build environment** with **Lines: 0** (5 min timeout). Not a Next.js compile error.

## Fix: deploy the slim branch

| Setting | Value |
|--------|--------|
| **Branch** | **`hostinger-deploy`** (not `main`) |
| Framework | Next.js **or** Other |
| Node | 22.x |
| Root directory | `./` |
| Build command | `npm run build:frontend` |
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
REVALIDATE_SECRET=<same as before>
PAYLOAD_SYNC_SECRET=<same as before>
```

## Amplify live site (www) — fastest blog fix

Amplify still shows `database: disconnected` because ENV points at **dead Cockroach**.

AWS Amplify → Environment variables → set the **same** `DATABASE_URL` MySQL line above → **Redeploy**.

Code on `main` already uses Prisma MySQL. Hostinger MySQL already has **269 blogs**.

## Vercel CMS admin — separate problem

`/admin` fails because Payload uses **Cockroach Postgres** (port 26257) and the cluster hit **RU / trial limit**.

- Hostinger MySQL **cannot** power Payload CMS.
- Fix CMS: Cockroach → Edit cluster → Capacity → **Finalize** (paid), **or** move CMS `DATABASE_URL` to Neon Postgres later.

## Architecture (base)

| App | Host | Database |
|-----|------|----------|
| Marketing www | Amplify (now) / Hostinger (next) | Hostinger MySQL |
| Payload CMS | Vercel | Cockroach/Neon Postgres (not MySQL) |
