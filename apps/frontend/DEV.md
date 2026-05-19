# Frontend local development

## Hero MBBS enquiry forms (India / Abroad)

The home hero forms load field definitions from **Payload CMS** (form builder). The frontend never talks to Payload directly from the browser; it uses:

- Server prefetch on `/` → `loadMbbsHeroFormDefinitionsServer()`
- API routes: `GET /api/cms/forms/mbbs-india`, `GET /api/cms/forms/mbbs-abroad`

### Start the full stack

From the **repo root**:

```bash
npm run dev
```

This runs **Payload CMS on port 8000** and the **Next.js frontend on port 3000** (`dev:website`).

For CMS + Express backend + frontend:

```bash
npm run dev:all
```

Frontend only (forms use offline fallback until CMS is up):

```bash
npm run dev:frontend
```

### Environment

Copy `apps/frontend/.env.example` → `apps/frontend/.env.local`:

- `PAYLOAD_CMS_URL=http://127.0.0.1:8000` (use `127.0.0.1` on Windows for server-side fetch)
- `NEXT_PUBLIC_CMS_URL=http://localhost:8000`
- Optional: `PAYLOAD_MBBS_INDIA_FORM_ID`, `PAYLOAD_MBBS_ABROAD_FORM_ID` from Payload admin → Forms

### Port 8000 must be Payload

If another app (e.g. another API) is bound to port 8000, hero forms cannot load from CMS. Stop that process or change Payload’s port and update `PAYLOAD_CMS_URL`.

### Verify

```bash
curl.exe http://localhost:3000/api/cms/forms/mbbs-india
```

With CMS running and forms seeded, the response includes `docs[0].fields`. If CMS is down, the UI still shows a **static enquiry form** and submits via `POST /api/cms/hero-enquiry`.
