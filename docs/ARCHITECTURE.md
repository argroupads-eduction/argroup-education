# Architecture Documentation

## Project Overview

AR Group of Education is a modern, scalable medical education consultancy platform built with a comprehensive tech stack focused on performance, SEO, and user experience.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Vercel)                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Next.js 15 App Router                                   │ │
│  │  - Server-side rendering (SSR)                          │ │
│  │  - Incremental static regeneration (ISR)               │ │
│  │  - Dynamic imports & code splitting                     │ │
│  │  - Image optimization & lazy loading                    │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ API Calls (REST)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend (Railway)                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Express.js Server                                        │ │
│  │  - RESTful API endpoints                                 │ │
│  │  - Request validation & sanitization                    │ │
│  │  - Rate limiting & security headers                     │ │
│  │  - Error handling & logging                             │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Business Logic & Services                               │ │
│  │  - Email notifications                                   │ │
│  │  - Form processing                                       │ │
│  │  - Data transformation                                   │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ Database Queries (Prisma ORM)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (PostgreSQL)                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                                      │ │
│  │  - Normalized schema                                     │ │
│  │  - Indexes for performance                              │ │
│  │  - ACID transactions                                     │ │
│  │  - Backups & replication                                │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Folder Structure
```
apps/frontend/
├── app/                      # Next.js App Router
│   ├── (marketing)/         # Marketing pages group
│   ├── (legal)/             # Legal pages group
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout
├── components/              # Reusable components
│   ├── ui/                 # Base UI components
│   ├── common/             # Shared components (Nav, Footer)
│   └── forms/              # Form components
├── sections/               # Page sections
│   └── home/              # Home page sections
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities & constants
├── services/              # API client
├── types/                 # TypeScript types
├── utils/                 # Helper functions
├── styles/                # Global styles
└── public/                # Static assets
```

### Key Components

1. **Page Layout**
   - Server components for metadata
   - Client components for interactivity
   - Route groups for organization

2. **State Management**
   - Zustand for global state (if needed)
   - React hooks for local state
   - URL parameters for page state

3. **Data Fetching**
   - SWR for client-side caching
   - Axios for API requests
   - ISR for static content

## Backend Architecture

### Folder Structure
```
apps/backend/
├── src/
│   ├── routes/           # API route handlers
│   ├── controllers/      # Business logic
│   ├── services/         # Data operations
│   ├── models/           # Data models
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utility functions
│   ├── config/           # Configuration
│   └── index.ts          # Server entry point
├── prisma/              # Database schema & migrations
└── dist/                # Compiled JavaScript
```

### API Design

RESTful endpoints following standard conventions:

```
GET    /api/blogs              # List blogs
POST   /api/blogs              # Create blog
GET    /api/blogs/:slug        # Get blog
PUT    /api/blogs/:slug        # Update blog
DELETE /api/blogs/:slug        # Delete blog

GET    /api/countries          # List countries
GET    /api/countries/:slug    # Get country

GET    /api/universities       # List universities
GET    /api/universities/:slug # Get university

POST   /api/forms/counselling  # Submit counselling form
POST   /api/forms/contact      # Submit contact form
POST   /api/newsletter/subscribe # Newsletter subscription
```

### Middleware Stack

1. **Helmet** - Security headers
2. **CORS** - Cross-origin requests
3. **Body Parser** - Request parsing
4. **Rate Limiter** - DDoS protection
5. **Error Handler** - Global error handling

## Database Schema

### Key Tables

1. **BlogPost**
   - Content with SEO metadata
   - Full-text search enabled
   - Category and tag support

2. **Country**
   - Medical education information
   - Featured flag for home page
   - Related universities

3. **University**
   - Detailed institution info
   - Country relationship
   - Placement & rating metrics

4. **Lead**
   - Counselling form submissions
   - Status tracking
   - Lead source analytics

5. **Subscriber**
   - Newsletter subscribers
   - Subscription management
   - Unsubscribe tracking

### Relationships

```
Country (1) ──── (N) University
BlogPost    (standalone)
Lead        (standalone)
Subscriber  (standalone)
```

## Performance Optimization

### Frontend
- **Code Splitting**: Dynamic imports for route-based code
- **Image Optimization**: Next.js Image with WebP
- **CSS Optimization**: Tailwind CSS purging
- **Lazy Loading**: Intersection Observer for components
- **ISR**: Static generation with revalidation

### Backend
- **Database Indexing**: On frequently queried fields
- **Caching**: Redis for session & frequently accessed data
- **Query Optimization**: Prisma query selection
- **Compression**: Gzip middleware
- **Connection Pooling**: Database connection management

### Metrics Target
- Lighthouse Score: 90+
- Core Web Vitals: Green
- First Contentful Paint (FCP): < 1.5s
- Cumulative Layout Shift (CLS): < 0.1

## Security

### Frontend Security
- Content Security Policy (CSP)
- XSS Protection
- CSRF Tokens for forms
- Secure headers via Helmet

### Backend Security
- Input validation & sanitization
- SQL injection prevention (Prisma)
- Rate limiting
- CORS restrictions
- JWT for authentication (if needed)
- Password hashing (bcrypt)

### Infrastructure Security
- HTTPS/TLS
- Environment variables for secrets
- Database access control
- API key management
- Regular security updates

## Scalability

### Horizontal Scaling
- Stateless backend servers
- Load balancing via Railway
- CDN for static assets (Vercel)

### Vertical Scaling
- Database indexing
- Query optimization
- Cache layer (Redis)
- Connection pooling

### Future Enhancements
- Microservices architecture
- Message queues (RabbitMQ)
- Search optimization (Elasticsearch)
- Real-time features (WebSockets)

## Deployment Strategy

### Environments
- **Development**: Local with Docker Compose
- **Staging**: Pre-production Railway app
- **Production**: Live Railway/Vercel apps

### CI/CD Pipeline
- GitHub Actions for automation
- Automated testing & linting
- Build verification
- Automated deployment on main branch

### Monitoring
- Application logs
- Error tracking
- Performance metrics
- Database monitoring
- Uptime monitoring
