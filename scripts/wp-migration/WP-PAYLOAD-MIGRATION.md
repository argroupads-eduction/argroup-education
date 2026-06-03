# WordPress export → Payload CMS → Marketing frontend

This imports `apps/frontend/data/wp-export-bundle` into Payload while **keeping the live site layout** (FAQ accordion, tables, TOC, etc.).

## How it works

| Layer | Role |
|--------|------|
| **WP export bundle** | `posts.json` + `pages.json` (from `npm run wp:export` + `npm run build:wp-bundle`) |
| **Payload** | Stores full HTML in `htmlContent` + SEO fields; Lexical `content` is a short placeholder |
| **Frontend (`localhost:3000`)** | Reads Payload first → `prepareWpHtml()` → same template as today |

Nothing changes on the public URL structure: posts use `/blog/[slug]`, pages use `/[slug]`.

## One-time setup

1. **Payload DB schema** (new fields `htmlContent`, `featuredImageUrl`):

   ```bash
   cd ar-group-of-eductions
   # In .env set PAYLOAD_DATABASE_PUSH=true, then:
   npm run dev:8000
   # Wait for schema push, then set PAYLOAD_DATABASE_PUSH=false
   ```

2. **Frontend env** (`apps/frontend/.env.local`):

   ```env
   PAYLOAD_CMS_ENABLED=true
   PAYLOAD_CMS_URL=http://127.0.0.1:8000
   NEXT_PUBLIC_CMS_URL=http://localhost:8000
   ```

## Import commands

```bash
# Dry run (3 posts, no writes)
npm run wp:import:payload:dry

# All posts (~269)
npm run wp:import:payload -- --posts-only

# All pages (~358) — slower
npm run wp:import:payload -- --pages-only

# Everything
npm run wp:import:payload

# First 10 only
npm run wp:import:payload -- --limit=10

# Skip slugs that already exist in Payload
npm run wp:import:payload -- --skip-existing
```

Reports are written to:

`apps/frontend/data/wp-export-bundle/reports/payload-import-<timestamp>.json`

## After import

1. Open **http://localhost:8000/admin** — Posts/Pages show `htmlContent` filled.
2. Open **http://localhost:3000/blog** — listing merges Payload + legacy sources; newest = featured.
3. Open any slug, e.g. **http://localhost:3000/blog/medical-colleges-accepting-low-neet-score-2026** — should match pre-migration layout if that slug was imported.

## Editing new content in Payload

- For **same layout as migrated posts**, paste HTML-style content or use Q1/A1 / numbered FAQs in the editor (see blog FAQ docs).
- Or fill **WordPress HTML** field with raw HTML from a WP export block.

## Live site without Payload (publish → backend sync)

When you **publish** a post or page in Payload, it is copied to the marketing backend (`neondb` via `POST /api/cms/payload-sync`). The frontend at `localhost:3000` can then show that content even if Payload on port 8000 is off.

**Env (same secret in both files):**

```env
# ar-group-of-eductions/.env (when you Publish from Payload admin)
BACKEND_API_URL=https://YOUR-RAILWAY-BACKEND.up.railway.app
PAYLOAD_SYNC_SECRET=<long-random-string>

# apps/backend/.env (Railway)
PAYLOAD_SYNC_SECRET=<same-string>
FRONTEND_REVALIDATE_URL=https://argroup-education-frontend.vercel.app
REVALIDATE_SECRET=<long-random-string>

# Vercel → apps/frontend
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-BACKEND.up.railway.app
PAYLOAD_CMS_ENABLED=false
REVALIDATE_SECRET=<same-as-railway>
```

Vercel **does not** call Payload at runtime; it only reads the API DB. Payload can be on your laptop—only **Publish** must reach Railway.

**Backfill existing Payload docs:**

```bash
npm run payload:sync:backend
```

WP bundle import disables per-row sync (`disableBackendSync`); run the backfill command after a large import.

## Not in this step

- **Media files** — `featuredImageUrl` keeps external WP URLs; upload to Payload Media later if needed.
- **Header/footer nav** — still from the React site; map into Payload `header` global in a follow-up.
- **Always-on Payload in production** — optional; sync to backend is enough for the public site.

## Rollback

Set `PAYLOAD_CMS_ENABLED=false` in `apps/frontend/.env.local`. The site falls back to wp-export bundle + backend API with no code changes.
