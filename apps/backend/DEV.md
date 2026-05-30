# Backend (Express + Prisma + Neon)

## Environment

Copy `.env.example` → `.env` and set from [Neon Console](https://console.neon.tech) → **Connect**:

| Variable | Use |
|----------|-----|
| `DATABASE_URL` | **Pooled** host (`…-pooler.…`) — app runtime |
| `DATABASE_URL_UNPOOLED` | **Direct** host (no `-pooler`) — `prisma migrate` only |

`src/lib/prisma.ts` adds `pgbouncer=true` on pooled URLs automatically (required for Prisma + Neon).

## Commands

```bash
npm run db:ping      # test Neon connection
npm run db:deploy    # apply migrations
npm run wp:import    # import data/wp-export into Neon
```

## `prisma:error … Connection … Closed`

**Cause:** Neon pooler closes idle connections; Prisma kept stale sockets (common after `ts-node-dev` hot reload or long idle).

**Fix (already in code):** `pgbouncer=true`, reconnect on API errors, `$disconnect` on server shutdown.

**You do:** restart dev after big config changes:

```bash
# Ctrl+C, then from repo root:
npm run dev
```

If errors persist: `npm run db:ping` — should print `OK — site pages: …`.
