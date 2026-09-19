# AR Group Strapi (Hostinger-ready)

Local/dev can still use SQLite if you `npm i better-sqlite3` yourself. **Hostinger production uses MySQL only** (`mysql2`) — `better-sqlite3` is not in dependencies (Hostinger cannot compile native modules).

- Deploy checklist: [`docs/STRAPI_HOSTINGER.md`](../../docs/STRAPI_HOSTINGER.md)
- Env template: [`.env.hostinger.example`](./.env.hostinger.example)
- Import env file: [`.env.hostinger.import`](./.env.hostinger.import) (gitignored after secrets filled)
- Step 4 live sync: [`docs/STRAPI_STEP4.md`](../../docs/STRAPI_STEP4.md)

**Never** point `DATABASE_NAME` at the marketing Prisma database.
