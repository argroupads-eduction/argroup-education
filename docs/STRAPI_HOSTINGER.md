# Strapi on Hostinger (MySQL + images)

**Goal:** Run Strapi 24/7 on Hostinger so editors publish without a local PC.  
**Marketing site stays as-is:** Next.js on `hostinger-live` still reads Hostinger MySQL `BlogPost` / `SitePage`. Strapi only upserts via `/api/cms/payload-sync`.

## Architecture (do not mix DBs)

| Store | Purpose |
|-------|---------|
| **Marketing MySQL** (existing Prisma DB) | Live site content — `BlogPost`, `SitePage`, etc. **Never** point Strapi `DATABASE_*` here. |
| **Strapi MySQL** (new empty DB) | Strapi admin content-types, users, Media Library file metadata |
| **`public/uploads/` on Strapi Node disk** | Binary images uploaded in Media Library |
| **`featuredImage` text fields** | Usually URLs pointing at `www…/images/…` (already in seed) — no extra binary copy needed for those |

```
Editor → Strapi (Hostinger subdomain + Strapi MySQL + uploads/)
       → Publish lifecycle → www payload-sync → Marketing MySQL
       → Same /blog/... template
```

## 1) hPanel — create a dedicated MySQL database

Websites → Databases → **MySQL** → Create:

- Database name e.g. `uXXXXXXX_strapi` (new)
- User e.g. `uXXXXXXX_strapi` with full rights on **that DB only**
- Host usually `srv….hstgr.io` (same host as marketing is fine)

**Hard rule:** Do **not** use the database that already has `BlogPost` / `SitePage`. Strapi creates its own tables (`files`, `admin_users`, `posts`, …) and must stay isolated.

## 2) hPanel — second Node.js website (CMS)

Create a **separate** Node app (do not change the marketing site’s build/start):

| Setting | Value |
|--------|--------|
| Branch | Prefer a branch that includes `apps/strapi` (e.g. `strapi-hostinger` / current work branch). **Do not** point this app at marketing-only `hostinger-live` settings. |
| Root directory | `apps/strapi` |
| Node | **20.x** or **22.x** |
| Build command | `npm run hostinger:build` |
| Start command | `npm run hostinger:start` |
| Output directory | **LEAVE EMPTY** |

Attach a subdomain, e.g. `cms.argroupofeducation.com` or the Hostinger temporary `*.hostingersite.com` URL.

## 3) Environment variables

Copy from `apps/strapi/.env.hostinger.example` into the Node app env panel.

Must set:

- `DATABASE_CLIENT=mysql` + host/port/name/user/password for the **new** Strapi DB  
- Fresh `APP_KEYS`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY`  
- `PUBLIC_URL=https://<your-cms-subdomain>` (no trailing slash)  
- `HOST=0.0.0.0`  
- Step 4 sync: `MARKETING_SYNC_URL=https://www.argroupofeducation.com`, `STRAPI_ALLOW_LIVE_SYNC=1`, `PAYLOAD_SYNC_SECRET=<same as frontend>`

Redeploy after saving env.

## 4) First boot

1. Open `https://<cms>/admin` → create the first admin user.  
2. Confirm Runtime logs show MySQL connected (not sqlite).  
3. Settings → API Tokens → create **Full access** token (for seed import only; store privately).  
4. Media Library: upload one test image → file appears under `public/uploads` and row in Strapi MySQL `files`.

## 5) Load content + images into Hostinger Strapi

Local SQLite (`D:\ar-group-strapi`) is **not** auto-copied. After Hostinger Strapi is up:

```bat
cd /d "C:\Users\akash\OneDrive\Desktop\ARGROUP OF EDUCTION"
set STRAPI_URL=https://YOUR-CMS-SUBDOMAIN
set STRAPI_TOKEN=your-full-access-token
set STRAPI_ALLOW_REMOTE_IMPORT=1
node scripts/strapi-import-seed-to-strapi.mjs
```

- Seed JSON already includes `featuredImage` as **URLs** to www images — those stay on the marketing CDN/disk; Strapi MySQL stores the URL strings.  
- New Media Library uploads after cutover live on the CMS Node disk (`uploads/`) + Strapi DB metadata.  
- Import script still **refuses** `www.argroupofeducation.com` as `STRAPI_URL` (that is the marketing site, not Strapi).

Optional: zip `D:\ar-group-strapi\public\uploads` → upload to Hostinger app `public/uploads` if you already uploaded media locally (currently mostly empty).

## 6) Smoke test (after deploy)

1. In Hostinger Strapi: edit a draft → Publish.  
2. Confirm live `www` post/page updates (same Step 4 path).  
3. Upload image in Media Library → open `/uploads/...` on the CMS URL.  
4. Soft-check marketing DB: BlogPost count not wiped (upsert-only).

## 7) Local Strapi after cutover

Once Hostinger CMS is healthy:

- Stop relying on `D:\ar-group-strapi` for daily publish (or set its sync off).  
- Keep local only for offline experiments with `STRAPI_ALLOW_LIVE_SYNC=0`.

## Rollback

1. Set `STRAPI_ALLOW_LIVE_SYNC=0` on Hostinger Strapi env → redeploy/restart.  
2. Marketing site keeps serving existing MySQL.  
3. Optional: delete the Strapi Node app / Strapi DB only — **never** drop marketing MySQL.

## What this does **not** change

- Marketing deploy (`hostinger:build` / `node server.js` on `hostinger-live`)  
- Blog template / Prisma schema on the live site  
- Existing image files already under www `/images/`
