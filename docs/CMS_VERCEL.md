# Payload CMS on Vercel (`argroup-education-cms`)

Separate Vercel project from the marketing site (`argroup-education-frontend`).

## Dashboard settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `ar-group-of-eductions` |
| **Framework** | Next.js |
| **Build** | `node scripts/vercel-build.mjs` (via `vercel.json`) |

## Required environment variables

Set on **argroup-education-cms** → Settings → Environment Variables → **Production**:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon **pooled** URL for database `payloadcms_db` (hostname includes `-pooler`) |
| `PAYLOAD_SECRET` | Long random string (JWT encryption) |
| `NEXT_PUBLIC_SERVER_URL` | `https://argroup-education-cms.vercel.app` (or your CMS custom domain) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store token (media uploads) |

Optional:

| Variable | Value |
|----------|--------|
| `PAYLOAD_DATABASE_PUSH` | `false` (only `true` briefly after schema changes) |
| `CRON_SECRET` | Random string for cron jobs |
| `PREVIEW_SECRET` | Preview drafts |

**Google Sheets vars** (`GOOGLE_SHEETS_*`) belong on **frontend** only — not this CMS project.

## Health check (after deploy)

```
https://argroup-education-cms.vercel.app/api/health
```

| Response | Meaning |
|----------|---------|
| `"ok": true` | DB reachable — CMS should load |
| Missing `DATABASE_URL` / `PAYLOAD_SECRET` | Add env vars on **this** project, redeploy |
| `data transfer quota` | Neon free tier limit — upgrade or wait for reset at [console.neon.tech](https://console.neon.tech) |

## Common 500 error

Build **Ready** but site shows *"This page could not load"* → runtime cannot connect to Neon. Fix `/api/health` first, then redeploy.
