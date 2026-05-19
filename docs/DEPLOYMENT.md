# Deployment Guide

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git
- Vercel CLI (for frontend)
- Railway CLI (for backend)

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ar-education.git
cd ar-education
```

### 2. Setup Environment Variables

#### Frontend
```bash
cd apps/frontend
cp .env.example .env.local
# Edit .env.local with your values
```

#### Backend
```bash
cd apps/backend
cp .env.example .env
# Edit .env with your values
```

## Local Development

### Option 1: Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# Backend runs on http://localhost:3001
# Frontend runs on http://localhost:3000
# PostgreSQL runs on localhost:5432
# Redis runs on localhost:6379

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Manual Setup

#### Setup Database
```bash
# Install PostgreSQL and create database
createdb ar_education

# Run migrations
cd apps/backend
npx prisma migrate dev
```

#### Install Dependencies
```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install -w apps/frontend
npm install -w apps/backend
```

#### Start Development Servers
```bash
# Terminal 1: Backend
cd apps/backend
npm run dev

# Terminal 2: Frontend
cd apps/frontend
npm run dev
```

## Production Deployment

### Frontend (Vercel)

**Monorepo:** the Next.js app is in `apps/frontend`. See **[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)** for Root Directory, env vars, and fixing `404: NOT_FOUND`.

1. **Connect Repository** and set **Root Directory** to `apps/frontend`.
2. **Build:** `npm run build` (install from repo root: `cd ../.. && npm ci` — see `apps/frontend/vercel.json`).
3. **Set Environment Variables** (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, CMS URLs, etc.).
4. **Deploy:** push to `main` or `vercel --prod` from `apps/frontend`.

### Backend (Railway)

1. **Connect Repository**
```bash
railway login
railway init
```

2. **Add Services**
- PostgreSQL Database
- Redis Cache
- Node.js Application

3. **Configure Environment Variables**
```bash
railway variables set DATABASE_URL <your-postgres-url>
railway variables set CORS_ORIGIN <your-frontend-url>
# ... other variables
```

4. **Deploy**
```bash
railway up
```

## Database Migrations

### Create Migration
```bash
cd apps/backend
npx prisma migrate dev --name <migration-name>
```

### Run Migrations
```bash
npx prisma migrate deploy
```

### Seed Database
```bash
npx prisma db seed
```

## CI/CD Pipeline

### GitHub Actions

The project includes automatic:
- Linting on push/PR
- Type checking
- Build verification
- Automated deployment to Vercel (main branch)
- Automated deployment to Railway (main branch)
- Security scanning with Trivy

Configure secrets in GitHub:
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID
- RAILWAY_TOKEN

## Monitoring & Maintenance

### Frontend (Vercel)
- Analytics Dashboard: https://vercel.com/dashboard
- Performance Insights: Built-in Web Vitals
- Error Tracking: Automatically captured

### Backend (Railway)
- Logs: Available in Railway dashboard
- Metrics: CPU, Memory, Disk usage
- Database: Managed PostgreSQL backups

## Scaling Considerations

### Frontend
- CDN Distribution: Handled by Vercel
- Image Optimization: Next.js Image component
- Cache Strategy: ISR for static pages

### Backend
- Database Optimization: Add indexes as needed
- Rate Limiting: Configured in middleware
- Caching: Redis for session/data caching
- Load Balancing: Railway manages automatically

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Troubleshooting

### Common Issues

1. **Database Connection Error**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin < <(echo "SELECT 1")
```

2. **Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

3. **Node Modules Issues**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm ci
```

## Support

For issues and questions:
- GitHub Issues: [link]
- Email: support@argroup.edu
- WhatsApp: [phone number]
