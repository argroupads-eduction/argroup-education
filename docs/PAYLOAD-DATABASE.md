# Payload CMS — database kahan hai?

## Short answer

Payload ka data **local file me nahi** hai. **Neon** par cloud **PostgreSQL** database hai.

| Item | Value |
|------|--------|
| **Provider** | [Neon](https://neon.tech) (serverless Postgres) |
| **Database name** | `payloadcms_db` |
| **Config file** | `ar-group-of-eductions/.env` → variable `DATABASE_URL` |
| **Backend (AR site) DB** | Alag — `apps/backend/.env` → usually `neondb` (Prisma). Payload **alag** DB use karta hai. |

## Neon console se dekhna

1. Login: https://console.neon.tech  
2. Apna project select karo (same host as `DATABASE_URL` me `ep-....neon.tech`).  
3. **Databases** → `payloadcms_db`  
4. **Tables** → `posts`, `pages`, `media`, `users`, `_posts_v`, etc.  
5. **SQL Editor** → `SELECT slug, title FROM posts LIMIT 10;`

Connection string **kabhi git me commit mat karo** — sirf `ar-group-of-eductions/.env` me rakho.

## URLs (local dev)

| Service | URL |
|---------|-----|
| Payload Admin | http://localhost:8000/admin |
| Payload API | http://localhost:8000/api/posts |
| Marketing site | http://localhost:3000 (yahan visitors content dekhte hain) |

## Agar Payload “chal nahi raha” / kuch dikhai nahi de raha

### 1. CMS process

```bash
npm run dev:cms
```

Agar **port 8000 already in use** aaye:

```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
npm run dev:cms
```

### 2. Schema sync (API 500 fix)

Naye fields (`htmlContent`, …) ke liye ek baar:

1. `ar-group-of-eductions/.env` → `PAYLOAD_DATABASE_PUSH=true`  
2. `npm run dev:cms` restart  
3. Terminal me schema warnings accept karo (agar aaye)  
4. Phir `PAYLOAD_DATABASE_PUSH=false` kar do (fast boot ke liye)

Test:

```bash
curl http://127.0.0.1:8000/api/posts?limit=1
```

`docs` array aani chahiye, `500` nahi.

### 3. Admin login

Pehli baar: http://localhost:8000/admin → **Create first user** (email + password).

### 4. Admin me posts khali?

Import chalao:

```bash
npm run wp:import:payload -- --posts-only --limit=10
```

### 5. Website (localhost:3000) par content

```bash
npm run dev:frontend
# ya
npm run dev:all
```

`apps/frontend/.env.local`:

```env
PAYLOAD_CMS_ENABLED=true
PAYLOAD_CMS_URL=http://127.0.0.1:8000
```

Agar Payload band ho, temporarily `PAYLOAD_CMS_ENABLED=false` — site **wp-export bundle** se chalegi.

## Rollback

- Payload band: CMS terminal stop karo.  
- Site without Payload: `PAYLOAD_CMS_ENABLED=false` in frontend `.env.local`.
