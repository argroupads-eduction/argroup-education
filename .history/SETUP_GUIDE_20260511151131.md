# Complete Project Setup Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites
```bash
# Ensure you have these installed
node --version          # Should be 18+
npm --version          # Should be 9+
docker --version       # Optional but recommended
```

### Installation

```bash
# 1. Navigate to project
cd "c:\Users\akash\OneDrive\Desktop\ARGROUP OF EDUCTION"

# 2. Install dependencies
npm install

# 3. Setup environment files
cd apps/frontend
cp .env.example .env.local
cd ../backend
cp .env.example .env
cd ../..

# 4. Edit environment files with your configuration
# Edit apps/frontend/.env.local
# Edit apps/backend/.env

# 5. Start development
npm run dev
```

### Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database Studio**: `npx prisma studio` (from apps/backend)

---

## 📁 Project Structure

```
ARGROUP OF EDUCATION/
├── apps/
│   ├── frontend/                 # Next.js 15 App
│   │   ├── app/                 # Pages & routes
│   │   │   ├── (marketing)/    # Marketing pages
│   │   │   ├── (legal)/        # Legal pages
│   │   │   └── api/            # API routes
│   │   ├── components/          # Reusable UI
│   │   ├── lib/                # Constants & utils
│   │   ├── services/           # API client
│   │   └── styles/             # Global CSS
│   │
│   └── backend/                 # Express.js API
│       ├── src/
│       │   ├── routes/         # API endpoints
│       │   └── middleware/     # Middleware
│       └── prisma/             # Database schema
│
├── docs/                        # Documentation
├── docker-compose.yml          # Development env
├── turbo.json                  # Monorepo config
└── package.json                # Root package
```

---

## 📑 Available Pages & Routes

### Frontend Pages (15 pages as required)

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Main landing page with all sections |
| About | `/about` | Company information & values |
| Services | `/services` | List of 8 services |
| Blog | `/blog` | Blog post listing |
| Blog Details | `/blog/[slug]` | Individual blog post |
| Countries | `/countries` | List of 9 featured countries |
| Country Details | `/countries/[slug]` | Country-specific details |
| Universities | `/universities` | University listings |
| University Details | `/universities/[slug]` | University-specific info |
| MBBS Abroad | `/countries` | Alias to countries listing |
| MBBS in India | `/services` | Included in services |
| Contact | `/contact` | Contact form & info |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms & conditions |
| Disclaimer | `/disclaimer` | Legal disclaimer |

**Additional Pages:**
- Sitemap: `/sitemap` - XML and HTML sitemap
- Robots: `/api/robots` - robots.txt generation

### Home Page Sections (14 sections as required)

1. **Hero Section** - Hero banner with CTA
2. **Trust Section** - Trust badges & stats
3. **Services Section** - 8 service cards
4. **Countries Section** - 9 featured countries
5. **Counselling Form** - Contact form
6. **Achievements Section** - Statistics & achievements
7. **Universities Section** - Featured universities
8. **States Section** - Indian states (expandable)
9. **Testimonials Section** - Student testimonials
10. **Blog Section** - Recent blogs
11. **Gallery Section** - Photo gallery
12. **FAQ Section** - Frequently asked questions
13. **CTA Section** - Call to action (integrated in hero)
14. **Footer** - Site footer with links

---

## 🔧 Configuration Files

### Frontend Environment (`.env.local`)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Google Analytics
NEXT_PUBLIC_GA_ID=G_XXXXXXXXXX

# CMS Configuration
NEXT_PUBLIC_CMS_URL=http://localhost:3002

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Payment
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Backend Environment (`.env`)
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ar_education

# Cache
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key-min-32-chars
CORS_ORIGIN=http://localhost:3000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🗄️ Database Setup

### With Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual PostgreSQL Setup

```bash
# Create database
createdb ar_education

# Run migrations
cd apps/backend
npx prisma migrate dev --name init

# Seed data (optional)
npx prisma db seed
```

### Prisma Studio (Visual Database)

```bash
cd apps/backend
npx prisma studio
# Opens http://localhost:5555
```

---

## 💻 Common Development Commands

### All Services

```bash
# Install all dependencies
npm install

# Development (all packages)
npm run dev

# Build all packages
npm run build

# Lint code
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

### Frontend Only

```bash
cd apps/frontend

# Development
npm run dev

# Build
npm run build

# Start production build
npm run start

# Lint
npm run lint

# Type check
npm run type-check
```

### Backend Only

```bash
cd apps/backend

# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Database
npx prisma migrate dev           # Create migration
npx prisma migrate deploy        # Run migrations
npx prisma db seed              # Seed database
npx prisma studio               # Visual DB
```

---

## 🚢 Production Deployment

### Deploy Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy
vercel deploy --prod
```

### Deploy Backend (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Init & deploy
railway init
railway up

# Configure environment
railway variables set DATABASE_URL <url>
railway variables set CORS_ORIGIN <url>
```

### Docker Deployment

```bash
# Build images
docker build -f apps/frontend/Dockerfile -t ar-frontend .
docker build -f apps/backend/Dockerfile -t ar-backend .

# Push to registry
docker tag ar-frontend your-registry/ar-frontend:latest
docker push your-registry/ar-frontend:latest

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up
```

---

## 📊 API Endpoints

### Blogs

```
GET    /api/blogs?page=1&limit=10&category=education
GET    /api/blogs/:slug
GET    /api/blogs/related?slug=post-slug&limit=3
GET    /api/blogs/search?q=query
```

### Countries

```
GET    /api/countries
GET    /api/countries/:slug
```

### Universities

```
GET    /api/universities?page=1&limit=10&country=russia
GET    /api/universities/featured?limit=6
GET    /api/universities/:slug
```

### Forms

```
POST   /api/forms/counselling
POST   /api/forms/contact
```

### Newsletter

```
POST   /api/newsletter/subscribe
```

---

## 🔐 Security Features

✅ **Implemented:**
- Content Security Policy headers via Helmet
- CORS protection
- Rate limiting (100 requests per 15 minutes)
- Input validation & sanitization
- XSS protection
- SQL injection prevention (Prisma ORM)
- Secure password hashing (bcrypt ready)
- JWT ready for authentication
- Environment variables for secrets

⚠️ **To Configure:**
- Enable HTTPS in production
- Set proper CORS origins
- Configure email SMTP
- Setup database backups
- Enable monitoring/logging

---

## 📈 Performance Metrics

**Frontend Targets:**
- Lighthouse Score: 90+
- First Contentful Paint: < 1.5s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3.5s

**Backend Targets:**
- API Response Time: < 200ms
- Database Query Time: < 100ms
- Concurrent Requests: 1000+

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:5432 | xargs kill -9
```

### Database Connection Error

```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Dependencies Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading

```bash
# Verify files exist
ls apps/frontend/.env.local
ls apps/backend/.env

# Make sure variables are loaded
source apps/backend/.env
```

---

## 📚 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

---

## 🎯 Next Steps

1. ✅ Clone repository
2. ✅ Install dependencies
3. ✅ Setup environment variables
4. ✅ Start development servers
5. ✅ Create user account (future)
6. ✅ Setup CMS integration (future)
7. ✅ Configure payment gateway (future)
8. ✅ Setup email notifications (future)
9. ✅ Deploy to production

---

## 📞 Support

For issues and questions:
- **Email**: support@argroup.edu
- **WhatsApp**: [Your number]
- **GitHub Issues**: [Your repo]
- **Docs**: See `/docs` folder

---

## 📄 License

This project is proprietary software. All rights reserved.

---

**Last Updated**: {new Date().toLocaleDateString()}
**Version**: 1.0.0
