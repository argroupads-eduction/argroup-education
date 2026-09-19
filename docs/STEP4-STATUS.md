# Step 4 status

- Live sync: **ON** (local Strapi → www payload-sync) — smoke OK
- Hostinger Strapi package: **ready in repo** — see `docs/STRAPI_HOSTINGER.md`
- Next operator steps (hPanel): create **separate** MySQL DB → second Node app `apps/strapi` → set env → redeploy → seed import with `STRAPI_ALLOW_REMOTE_IMPORT=1`
- Marketing site branch/deploy: unchanged (`hostinger-live`)
