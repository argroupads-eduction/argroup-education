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

## Setup (local) — PowerShell

Cursor/VS Code terminal **PowerShell** hai. `cd /d` aur `set` **CMD** commands hain — unse error aata hai.

```powershell
# 1) Strapi folder pe jao (D: drive)
cd D:\ar-group-strapi

# 2) Start Strapi admin
npm run develop
```

Browser: http://127.0.0.1:1337 → pehli baar admin user banao → **Settings → API Tokens → Create** (Full access) → token copy.

**Nayi PowerShell window** me (repo OneDrive pe):

```powershell
cd "C:\Users\akash\OneDrive\Desktop\ARGROUP OF EDUCTION"

# seed JSON (agar pehle se nahi)
node scripts/strapi-export-from-mysql-dump.mjs

# env (PowerShell syntax — `set` mat use karo)
$env:STRAPI_URL = "http://127.0.0.1:1337"
$env:STRAPI_TOKEN = "PASTE_YOUR_TOKEN_HERE"

# pehle chhota test
node scripts/strapi-import-seed-to-strapi.mjs --limit=3

# full import (SQLite only — live MySQL nahi)
node scripts/strapi-import-seed-to-strapi.mjs
```

**CMD** use karte ho to alag syntax:

```bat
cd /d D:\ar-group-strapi
npm run develop
```

## Content Manager: newest blogs on top

Posts **are** in Strapi (including Aug 2026 live blogs like `mbbs-in-russia-vs-india`).  
Default list was sorting by **title A→Z**, so new posts looked “missing”.

Fix (already scripted):

```powershell
node scripts/strapi-set-admin-newest-first.cjs
```

Then hard-refresh admin (`Ctrl+Shift+R`). List sorts by **legacyPublishedAt DESC** (original MySQL publish date).

Or manually: **Content Manager → Post → ⚙️ Configure the view → Default sort attribute = legacyPublishedAt, order = DESC → Save**.

## Will Strapi publish use the same live blog template?

**Yes — after Step 4.** The live site does **not** read Strapi directly. It reads Hostinger MySQL (`BlogPost`) and renders the existing Next.js blog template (`BlogPostLayout` / blog pages).

Flow after Step 4 approval:

`Strapi Publish` → `POST /api/cms/payload-sync` → MySQL `BlogPost` → same live `/blog/...` UI.

**Step 3 now:** Strapi publish only updates **local SQLite**. Live www is unchanged (by design / your safety rule).

- [ ] Strapi admin opens on localhost:1337
- [ ] After import: post count ≈ 346, page count ≈ 358
- [ ] Spot-check 3 blogs + 3 pages (title, slug, featuredImage URL unchanged)
- [ ] Publish a **draft test** post with slug `strapi-step3-smoke-test` while `MARKETING_SYNC_URL` unset → no live change
- [ ] Confirm live https://www.argroupofeducation.com/blog still shows existing posts (unchanged)

## Step 4 (not now)

Only after explicit **Approve Step 4**: point webhook at production sync URL and switch editors.

## Rollback

Delete `D:\ar-group-strapi` or stop the process. Live site keeps using Hostinger MySQL as today.
