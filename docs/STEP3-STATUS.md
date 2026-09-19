# STEP 3 — Build status

**Date:** 2026-09-19  
**Branch:** `strapi-step3` (not `hostinger-live`)  
**Live site / MySQL writes:** **NONE**

## Done

| Item | Status |
|------|--------|
| Safety constraint documented | Yes — no live URL sync; dump-only seed |
| Export from SQL dump (read-only) | **346 posts + 358 pages** → `strapi-seed/` |
| Content-types `post` + `page` | `apps/strapi-src/.../schema.json` |
| Lifecycle → payload-sync shape | With **live URL blocklist** |
| Import script | `scripts/strapi-import-seed-to-strapi.mjs` |
| Docs | `docs/STRAPI_STEP3.md` |

## Blocked / in progress

| Item | Notes |
|------|--------|
| Full `npm install` of Strapi on C: | **Disk was full** — app created on **D:** instead |
| Scaffold on D: | **Done** — `D:\ar-group-strapi` (Strapi 5.54) |
| Content-types copied into D app | **Done** — `post` + `page` + lifecycles |
| First `npm run develop` + full import | Operator: create admin + API token, then import |

## Explicit non-actions

- No push to `hostinger-live`
- No `DATABASE_URL` writes
- No deletes of BlogPost / SitePage
- No Amplify / Payload deletion
- No `MARKETING_SYNC_URL` pointing at production