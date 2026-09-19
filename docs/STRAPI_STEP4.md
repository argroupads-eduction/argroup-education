# Strapi Step 4 — Live cutover

**Approved:** 2026-09-19  
**Live site template:** unchanged (Next.js still renders MySQL `BlogPost` / `SitePage`)

## What Step 4 enables

```
Strapi (local D:\ar-group-strapi) Publish
  → POST https://www.argroupofeducation.com/api/cms/payload-sync
  → Hostinger MySQL upsert by slug
  → same /blog/... and page templates for users
```

**Does not:** wipe blogs/pages, rewrite images, or replace the frontend template.

## Safety switches (D:\ar-group-strapi\.env)

| Var | Value |
|-----|--------|
| `MARKETING_SYNC_URL` | `https://www.argroupofeducation.com` |
| `STRAPI_ALLOW_LIVE_SYNC` | `1` |
| `PAYLOAD_SYNC_SECRET` | same as Hostinger / `.env.local` |

Disable live sync anytime:

```env
STRAPI_ALLOW_LIVE_SYNC=0
# or remove MARKETING_SYNC_URL
```

Then restart Strapi.

## Pre-cutover snapshot (read-only)

See `backups/.../manifests/STEP4-PRE-CUTOVER-COUNTS.json`  
At cutover: **346 posts / 358 pages** (then +1 smoke test).

## Verified smoke

- Slug: `strapi-step4-smoke-test`
- Sync API: **200**
- Live URL: https://www.argroupofeducation.com/blog/strapi-step4-smoke-test (**200**, content visible)
- Other posts: **not deleted** (upsert by slug only; thin-overwrite guards still on)

You can unpublish/delete this smoke post from Strapi (Publish off → sync unpublished) or leave it.

## Editor workflow

1. `cd D:\ar-group-strapi` → `npm run develop`
2. Admin http://localhost:1337/admin
3. Edit **Post** / **Page** → **Save** → **Publish**
4. Hard-refresh live URL (ISR revalidate already triggered by sync)

## Not done in this Step 4 (later)

- Strapi hosted on Hostinger subdomain 24/7 (now: local Strapi must be running to publish)
- Retire Payload Vercel / Amplify files
- Bulk push all 700 Strapi rows to MySQL (unnecessary — MySQL already SoT)

## Rollback

1. Set `STRAPI_ALLOW_LIVE_SYNC=0` in Strapi `.env`, restart  
2. Site keeps serving MySQL as before  
3. Optional: Payload sync can still be used if configured
