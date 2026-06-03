# Google Reviews (Home Page)

The **Success Stories** section loads real Google reviews in the same card marquee layout.

## Setup

1. In [Google Cloud Console](https://console.cloud.google.com/), enable **Places API (New)**.
2. Create an API key and restrict it to Places API.
3. Add to `apps/frontend/.env.local` (and Vercel):

```env
GOOGLE_MAPS_API_KEY=your_key
GOOGLE_PLACE_QUERY=A R Group of Education Get MBBS Admission Counselling Sector 18 Noida
# optional if you know it:
GOOGLE_PLACE_ID=places/ChIJ...
```

## Sync reviews to the site

```bash
cd apps/frontend
npm run google-reviews:sync
```

- **Places API** returns up to **5** recent reviews plus live rating (e.g. 4.2) and total count (e.g. 115).
- For **all reviews**, set `OUTSCRAPER_API_KEY` (optional) and run the same command — it writes `data/google-reviews.json`.

Commit `data/google-reviews.json` after sync so production serves all reviews without calling Outscraper on every deploy.

## API

`GET /api/google-reviews` — returns cached JSON merged with live summary from Google when `GOOGLE_MAPS_API_KEY` is set.
