# Google Sheets lead integration

All website forms save to **programme-specific tabs** in one spreadsheet:

https://docs.google.com/spreadsheets/d/1S0ORdP8VXbcAov1naf-ak7J5HsqSQp-qJLGLSDn-Bfg

## Sheet tabs

| Tab | When leads go here |
|-----|-------------------|
| **MBBS INDIA** | India programme forms, MBBS India hero, counselling interest `mbbs-india`, popup “MBBS India” |
| **MBBS ABROAD** | Abroad forms, hero abroad, popup country (Russia, Nepal, …) or “MBBS Abroad” |
| **MD/MS** | MD/MS forms and popup selection |
| **BAMS** | BAMS forms and popup selection |
| **Rank Predictor Leads** | NEET Rank Predictor only |

**MBBS ABROAD** includes a **Country** column — filled from the form dropdown (Russia, Nepal, Kazakhstan, etc.).

## Email behaviour

- **Normal:** Leads go to Google Sheet only — **no email**.
- **Fallback:** If the Sheet webhook fails, the lead is emailed to `LEADS_NOTIFY_EMAIL` so nothing is lost.

## Setup (Apps Script)

1. Open the spreadsheet → **Extensions → Apps Script**.
2. Paste `scripts/google-sheets/lead-webhook.gs` (replace old code if you deployed v1).
3. **Script properties** → `WEBHOOK_SECRET` = long random string.
4. Run **`setupSheets()`** once (creates all 5 tabs + headers).
5. **Deploy → New deployment → Web app** (Execute as: Me, Access: **Anyone**).
6. Copy the `/exec` URL.

## Vercel environment variables

| Variable | Value |
|----------|--------|
| `GOOGLE_SHEETS_WEBHOOK_URL` | Web app URL |
| `GOOGLE_SHEETS_WEBHOOK_SECRET` | Same as `WEBHOOK_SECRET` |

Optional (email fallback only when Sheets fails):

| Variable | Value |
|----------|--------|
| `LEADS_NOTIFY_EMAIL` | argroupads@gmail.com |
| `SMTP_*` or `RESEND_API_KEY` | For fallback email |

Redeploy after changing env vars.

## After updating the script

If you already deployed v1 with “Website Leads” tab:

1. Paste the **new** `lead-webhook.gs`.
2. Run **`setupSheets()`** again — new tabs will be created.
3. **Deploy → Manage deployments → Edit → New version → Deploy** (important: redeploy so live URL uses new code).

## Test routing

```powershell
# MBBS India
$body = '{"secret":"YOUR_SECRET","type":"website","payload":{"name":"Test","phone":"9876543210","email":"test@example.com","sheetKey":"MBBS INDIA","course":"MBBS India"}}'
Invoke-RestMethod -Uri "YOUR_WEB_APP_URL" -Method POST -Body $body -ContentType "application/json"

# MBBS Abroad + country
$body = '{"secret":"YOUR_SECRET","type":"website","payload":{"name":"Test","phone":"9876543211","email":"test2@example.com","sheetKey":"MBBS ABROAD","country":"Russia","course":"MBBS Abroad - Russia"}}'
Invoke-RestMethod -Uri "YOUR_WEB_APP_URL" -Method POST -Body $body -ContentType "application/json"
```

## Repo files

| File | Role |
|------|------|
| `scripts/google-sheets/lead-webhook.gs` | Apps Script (deploy manually) |
| `apps/backend/src/lib/leadCourseRouting.ts` | Maps form → sheet tab |
| `apps/backend/src/lib/googleSheetsLead.ts` | Webhook client |
| `apps/backend/src/handlers/websiteLead.ts` | Sheets primary, email fallback |
