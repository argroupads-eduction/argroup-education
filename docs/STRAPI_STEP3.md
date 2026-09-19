# Strapi Step 3 — local / staging only

**LIVE website and Hostinger MySQL are NOT modified by Step 3.**

## Safety rules

1. Do **not** set `MARKETING_SYNC_URL` to `https://www.argroupofeducation.com` (lifecycles refuse it).
2. Do **not** run import scripts against production `DATABASE_URL`.
3. Seed comes from the **offline SQL dump** only:
   - `backups/pre-strapi-migration-2026-09-18/mysql/hostinger-argroup-full.sql`
   - Exported JSON: `backups/.../strapi-seed/` → **346 posts, 358 pages**
4. Hostinger deploy branch for the live site is **`hostinger-live`**. Step 3 work is on **`strapi-step3`** (or local `D:\ar-group-strapi`). Do not merge/push Strapi to `hostinger-live` until Step 4.

## Why Strapi is on D:

C: (OneDrive Desktop) ran out of disk during `create-strapi`. Runtime app:

```text
D:\ar-group-strapi
```

Custom schemas / lifecycles live in the monorepo and are copied in:

```text
apps/strapi-src/   → copy into D:\ar-group-strapi\src\
```

## Setup (local)

```bash
# 1) Ensure seed JSON exists (read-only from dump)
node scripts/strapi-export-from-mysql-dump.mjs

# 2) Copy content-types into the Strapi app on D:
#    (PowerShell)
robocopy apps\strapi-src\src D:\ar-group-strapi\src /E

# 3) Env for Strapi (D:\ar-group-strapi\.env) — example:
#    HOST=0.0.0.0
#    PORT=1337
#    APP_KEYS=...
#    # Leave MARKETING_SYNC_URL unset in Step 3
#    # Or: MARKETING_SYNC_URL=http://127.0.0.1:3000
#    # PAYLOAD_SYNC_SECRET=dev-only-secret

# 4) Start Strapi
cd /d D:\ar-group-strapi
npm run develop

# 5) Create admin user in browser → Settings → API Tokens → Full access

# 6) Import seed (writes SQLite only)
set STRAPI_URL=http://127.0.0.1:1337
set STRAPI_TOKEN=your_token
node scripts/strapi-import-seed-to-strapi.mjs --limit=3
node scripts/strapi-import-seed-to-strapi.mjs
```

## Smoke checklist (Step 3)

- [ ] Strapi admin opens on localhost:1337
- [ ] After import: post count ≈ 346, page count ≈ 358
- [ ] Spot-check 3 blogs + 3 pages (title, slug, featuredImage URL unchanged)
- [ ] Publish a **draft test** post with slug `strapi-step3-smoke-test` while `MARKETING_SYNC_URL` unset → no live change
- [ ] Confirm live https://www.argroupofeducation.com/blog still shows existing posts (unchanged)

## Step 4 (not now)

Only after explicit **Approve Step 4**: point webhook at production sync URL and switch editors.

## Rollback

Delete `D:\ar-group-strapi` or stop the process. Live site keeps using Hostinger MySQL as today.
