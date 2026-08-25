# AGENTS.md

## Cursor Cloud specific instructions

This is an npm-workspaces + Turborepo monorepo ("AR Group of Education"). The core
development stack is **PostgreSQL + Express backend (`apps/backend`, port 3001) +
Next.js frontend (`apps/frontend`, port 3000)**. A standalone Payload CMS lives in
`ar-group-of-eductions/` (pnpm, port 8000) and is **optional** — the frontend uses
built-in fallback content/forms when the CMS is off (`PAYLOAD_CMS_ENABLED=false`).

Standard commands live in `SETUP_GUIDE.md`, `apps/*/DEV.md`, and the root/app
`package.json` scripts. Below are only the non-obvious, environment-specific caveats.

### Starting the environment (each fresh session)
The update script (`npm install`) only refreshes dependencies. Before running the
app you must start Postgres and ensure the DB schema exists (these are not in the
update script by design):

```bash
sudo pg_ctlcluster 16 main start       # start local PostgreSQL 16 (not auto-started on boot)
npm run dev                            # backend (3001) + frontend (3000) via concurrently
```

- Local DB connection (already set in `apps/backend/.env`, gitignored):
  `postgresql://postgres:password@localhost:5432/ar_education`
- The backend appends `sslmode=require` to `DATABASE_URL` at runtime (Neon assumption).
  Ubuntu's PostgreSQL ships with SSL enabled by default, so the local connection works
  as-is. Do not disable SSL on the local cluster.

### Database schema — use `prisma db push`, NOT migrate deploy
The Prisma migrations in `apps/backend/prisma/migrations` have **no baseline** — the
first migration `ALTER`s tables (`BlogPost`, etc.) that were originally created via
`prisma db push` in production, so `prisma migrate deploy` fails on a fresh DB with
`relation "BlogPost" does not exist` (P3018). For a fresh local dev DB, create the
schema directly from `schema.prisma`:

```bash
cd apps/backend && npx prisma db push
```

`db:fix-migrations` / `resolve-stuck-migrations.mjs` only repair an existing
production DB; they do not create base tables.

### No seed data locally
There is no `src/seed.ts` and `data/wp-export/` is gitignored/empty, so content
endpoints (e.g. `/api/countries`, `/api/blogs`) return empty arrays until a WordPress
import is run. This is expected — the frontend degrades gracefully and lead-capture
forms still work.

### Email is optional
SMTP is unset locally, so lead submissions save to Postgres with `emailSent:false`
(no failure). Leads land in the `WebsiteFormLead` table. This is the core end-to-end
flow to verify (submit a Quick Enquiry / counselling form → row in `WebsiteFormLead`).

### `concurrently` is required for `npm run dev`
`scripts/dev-stack.mjs` runs `npx concurrently`; it is now a root devDependency so
`npm install` provides it (previously `npx` prompted interactively). If it ever
prompts, run `npm install` at the repo root.

### Don't run a production build against the running dev server
`npm run build -w apps/frontend` overwrites `apps/frontend/.next`, which breaks a
running `next dev` (500s). If you build, stop `npm run dev` first, then `rm -rf
apps/frontend/.next` and restart. (The frontend build also regenerates
`apps/frontend/data/wp-media-manifest.json` — revert that side-effect before committing.)

### Lint / type-check / build
- Backend: `npm run lint -w apps/backend`, `npm run type-check -w apps/backend`, `npm run build -w apps/backend`
- Frontend: `npm run lint -w apps/frontend`, `npm run type-check -w apps/frontend`, `npm run build -w apps/frontend`
- Whole repo (Turbo): `npm run lint`, `npm run type-check`, `npm run build`
