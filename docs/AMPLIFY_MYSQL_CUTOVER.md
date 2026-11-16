# Amplify live cutover (blogs + MySQL)

## Why blogs are down

Amplify `DATABASE_URL` still points at **dead Cockroach**. Marketing DB is now **Hostinger MySQL** (269 blogs already imported).

## One ENV change (required)

AWS Amplify Console → your app → **Hosting** → **Environment variables** → edit / add:

```env
DATABASE_URL=mysql://u559193891_Argroup2026:ARgroup%402026%23Db@srv1192.hstgr.io:3306/u559193891_argroup
WP_MEDIA_ORIGIN=https://www.argroupofeducation.com
NEXT_PUBLIC_SITE_URL=https://www.argroupofeducation.com
```

Password note: `@` → `%40`, `#` → `%23` (already encoded above).

Then **Save** → **Redeploy this version** (or push to `main`).

Do **not** put Hostinger MySQL on the Vercel Payload CMS app.

## After deploy

- `/blog` and homepage blogs should load from MySQL
- Airport Diaries images ship from `/images/airport-diaries/*` (bundled in repo)
