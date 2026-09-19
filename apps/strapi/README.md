# AR Group Strapi (Hostinger-ready)

Local/dev can still use SQLite. Production on Hostinger uses **MySQL** via `DATABASE_CLIENT=mysql`.

- Deploy checklist: [`docs/STRAPI_HOSTINGER.md`](../../docs/STRAPI_HOSTINGER.md)
- Env template: [`.env.hostinger.example`](./.env.hostinger.example)
- Step 4 live sync: [`docs/STRAPI_STEP4.md`](../../docs/STRAPI_STEP4.md)

**Never** point `DATABASE_NAME` at the marketing Prisma database.
