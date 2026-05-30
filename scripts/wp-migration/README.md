# WordPress → AR Site Migration

Source: **https://argroupofeducation.com** (358 pages + 269 posts, root-level slugs).

## 1. Export from WordPress (no login required)

From repo root:

```bash
npm run wp:export
```

Output: `data/wp-export/pages.json`, `posts.json`, `manifest.json`

## 2. Database setup (Neon)

See **`docs/NEON_DATABASE.md`**. Short version:

```bash
cd apps/backend
cp .env.example .env
# Paste Neon pooled URL → DATABASE_URL
# Paste Neon direct URL  → DATABASE_URL_UNPOOLED
cd ../..
npm run db:deploy
```

## 3. Import into PostgreSQL

```bash
npm run wp:import
```

## 4. Run stack

```bash
npm run dev:stack
```

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Example: http://localhost:3000/medical-colleges-accepting-low-neet-score-2026

## URL rules

| WordPress | New site |
|-----------|----------|
| `/` | `/` (home — not duplicated as slug) |
| `/post-slug/` | `/post-slug` |
| `/college-slug/` | `/college-slug` |
| `/blog/` | `/blog` (listing only) |

Posts keep **root URLs** (same as WordPress) for SEO/backlinks.

## Optional env

| Variable | Default |
|----------|---------|
| `WP_BASE_URL` | `https://argroupofeducation.com` |
| `WP_EXPORT_DELAY_MS` | `200` |
