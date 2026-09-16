# Hostinger deploy (marketing frontend only)

Payload CMS stays on **Vercel**. This app (Next.js in `apps/frontend`) runs on Hostinger Node.js Web App and uses **Hostinger MySQL** for blogs, leads, and sync data.

## Where to set ENV on Hostinger

1. Open **hPanel** → **Websites** → your **Node.js Web App**
2. Left sidebar → **Environment variables**  
   (First deploy: use “Set environment variables” / **Import .env**)
3. Add the keys below → **Save** (Hostinger redeploys so build + runtime both see them)

Official docs: https://docs.hostinger.com/node.js/environment-variables

## Build settings

**Deployments → Deployment settings**

| Setting | Value |
|--------|--------|
| Node.js | **22.x** |
| Install | `npm ci` |
| Build | `npm run build --workspace=ar-education-frontend` |
| Start | `npm run start --workspace=ar-education-frontend` |

Use the **monorepo root** as the app root (needs both `apps/frontend` and `apps/backend` for Prisma `@backend/*` imports).

## MySQL database

1. hPanel → **Databases** → create MySQL database + user  
2. **Databases → Remote MySQL** → allow your hosting IP (Node apps need the MySQL **hostname**, not `localhost`)  
3. Set:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOSTNAME:3306/DBNAME
```

Example hostname: `srvXXXX.hstgr.io`

### One-time: copy blogs + image URLs

```bash
# From a machine with network access to the current live site:
node apps/backend/scripts/export-marketing-from-live-api.mjs

# Point DATABASE_URL at Hostinger MySQL, then:
cd apps/backend
npx prisma db push
node scripts/migrate-to-hostinger-mysql.mjs import
```

- Blog `content` + `featuredImage` URLs are preserved (Vercel Blob / CDN).  
- Local WP files under `apps/frontend/public/wp-content` deploy with the frontend.

## Required ENV (Hostinger)

```env
DATABASE_URL=mysql://USER:PASSWORD@HOSTNAME:3306/DBNAME
NEXT_PUBLIC_SITE_URL=https://www.your-domain.com
NEXT_PUBLIC_SITE_NAME=AR Group of Education
REVALIDATE_SECRET=long-random-shared-with-vercel-cms
PAYLOAD_SYNC_SECRET=long-random-string
NODE_ENV=production
```

## Recommended ENV

```env
WP_MEDIA_ORIGIN=https://www.your-domain.com
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GTAG_ID=
GOOGLE_SHEETS_WEBHOOK_URL=
GOOGLE_SHEETS_WEBHOOK_SECRET=
LEADS_NOTIFY_EMAIL=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
EMAIL_OTP_FROM=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
YOUTUBE_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_PLACE_ID=
GOOGLE_PLACE_QUERY=
CRON_SECRET=
PAYLOAD_CMS_URL=https://your-payload-cms.vercel.app
PAYLOAD_CMS_ENABLED=false
CONTENT_SOURCE=api
```

## Do NOT set on Hostinger

- `AWS_*` / `AMPLIFY_*` — Amplify-only  
- `VERCEL` / `VERCEL_URL` — Vercel runtime  
- `NEXT_PUBLIC_API_URL` — leave empty so the app uses same-origin `/api/*`

## After Hostinger is live — update Vercel CMS

On the Payload project (`ar-group-of-eductions`):

```env
BACKEND_API_URL=https://www.your-domain.com
FRONTEND_APP_URL=https://www.your-domain.com
REVALIDATE_SECRET=<same as Hostinger>
```

Publish in Payload → `POST /api/cms/payload-sync` on Hostinger → MySQL updated. CMS database stays on Vercel.
