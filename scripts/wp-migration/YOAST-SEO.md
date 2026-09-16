# Yoast SEO migration (WordPress → Neon → Next.js)

## Overview

Yoast SEO fields are read from a **WordPress SQL dump** (`wp_yoast_indexable` + `wp_postmeta`) and written **only** to SEO columns on existing `BlogPost` / `SitePage` rows in Neon. Content, title, slug, and images are never changed.

The Next.js app uses `generateMetadata()` via `buildSiteMetadata()` for output.

## 1. Export SQL from WordPress

From phpMyAdmin or CLI, export at least:

- `wp_yoast_indexable` (primary Yoast source)
- `wp_postmeta` (fallback for legacy keys)
- `wp_posts` (optional but helps slug / object_id matching)

Save as:

```
data/wp-export/wordpress.sql
```

Or set `WP_SQL_DUMP` in `apps/backend/.env`.

## 2. Import content (if not done)

```bash
cd apps/backend
node ../../scripts/wp-migration/export-wp.mjs   # optional REST fallback
npm run wp:import
npx prisma migrate deploy
```

## 3. Import Yoast SEO

```bash
cd apps/backend
npm run wp:seo:import
# or: node --env-file=.env scripts/import-yoast-seo.mjs -- path/to/dump.sql
```

## 4. Migration report

After import, reports are written to:

```
data/wp-export/reports/yoast-seo-migration-<timestamp>.json
data/wp-export/reports/yoast-seo-migration-<timestamp>.md
```

The report includes:

- **Total pages updated**
- **Total posts updated**
- **Missing SEO records** (DB rows with no SQL SEO, or SQL SEO with no DB row)
- **Duplicate slugs** (Neon or SQL)

## Fields updated (only these)

| Source | Maps to |
|--------|---------|
| `title` / `_yoast_wpseo_title` | `metaTitle` |
| `description` / `_yoast_wpseo_metadesc` | `metaDescription` |
| `canonical` / `_yoast_wpseo_canonical` | `canonicalUrl` |
| `open_graph_title` / `_yoast_wpseo_opengraph-title` | `ogTitle` |
| `open_graph_description` / `_yoast_wpseo_opengraph-description` | `ogDescription` |
| `twitter_title` / `_yoast_wpseo_twitter-title` | `twitterTitle` |
| `twitter_description` / `_yoast_wpseo_twitter-description` | `twitterDescription` |

`wp_yoast_indexable` wins when both sources have a value. Match order: **object_id** (`wpId`) then **slug**.

## Next.js metadata

- `apps/frontend/lib/buildSiteMetadata.ts` — single builder for Yoast fields
- `app/[slug]/page.tsx` — WP pages & blog posts
- Program hubs (`mbbs-india`, `mbbs-abroad`, `md-ms`, `about`) use the same builder when WP content exists
- `ContentJsonLd` outputs Yoast `schemaJson` when present
