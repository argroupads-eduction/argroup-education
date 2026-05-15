# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Docker & Docker Compose (optional but recommended)
- Git

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/ar-education.git
cd ar-education

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env

# 4. Edit the .env files with your configuration
nano apps/frontend/.env.local
nano apps/backend/.env

# 5. Start development servers
npm run dev
```

The applications should now be running:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Project Structure

### Monorepo Layout

```
ar-education/
├── apps/
│   ├── frontend/          # Next.js 15 frontend
│   ├── backend/           # Express.js backend
│   └── cms/               # CMS setup (future)
├── docs/                  # Documentation
├── .github/               # GitHub Actions
├── docker-compose.yml     # Development environment
├── package.json           # Root package
├── tsconfig.json          # TypeScript config
└── .gitignore
```

## Development Workflow

### Frontend Development

```bash
# Start development server
cd apps/frontend
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Backend Development

```bash
# Start development server
cd apps/backend
npm run dev

# Build TypeScript
npm run build

# Run migrations
npx prisma migrate dev --name <migration-name>

# Seed database
npx prisma db seed

# Type checking
npm run type-check

# Linting
npm run lint
```

## Coding Standards

### TypeScript

- Always use TypeScript for new files
- Use strict mode
- Define proper types for functions and components
- Use interfaces for data models

Example:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const fetchUser = async (id: string): Promise<User> => {
  // Implementation
};
```

### React Components

- Use functional components with hooks
- Use TypeScript for props and state
- Separate concerns into smaller components
- Use proper naming conventions

Example:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  disabled = false,
  children,
}) => {
  // Implementation
};
```

### File Naming

- Components: PascalCase (`Button.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (`SITE_NAME`)
- Folders: camelCase (`components`, `services`)

### Code Organization

1. Imports (external, then internal)
2. Types/Interfaces
3. Constants
4. Component/Function definition
5. Styles/CSS
6. Exports

## Database

### Prisma ORM

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name <description>

# Run migration
npx prisma migrate deploy

# Reset database (dev only)
npx prisma db push --skip-generate

# Open Prisma Studio
npx prisma studio
```

### Database Queries

```typescript
// Create
const blog = await prisma.blogPost.create({
  data: {
    title: 'New Blog',
    slug: 'new-blog',
    content: 'Content here',
  },
});

// Read
const blog = await prisma.blogPost.findUnique({
  where: { slug: 'new-blog' },
});

// Update
const blog = await prisma.blogPost.update({
  where: { id: '123' },
  data: { title: 'Updated Title' },
});

// Delete
await prisma.blogPost.delete({
  where: { id: '123' },
});
```

## API Development

### Creating Endpoints

```typescript
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Logic here
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
});

export default router;
```

### Error Handling

Use consistent error responses:

```typescript
// Success
res.json({
  success: true,
  data: { /* data */ },
});

// Error
res.status(400).json({
  success: false,
  message: 'Descriptive error message',
});
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Git Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Development branch
- `feature/something`: Feature branches
- `bugfix/something`: Bug fix branches

### Commit Convention

```
feat: Add new feature
fix: Fix bug
docs: Documentation changes
style: Code style changes
refactor: Code refactoring
perf: Performance improvements
test: Add tests
chore: Maintenance tasks
```

Example:
```bash
git commit -m "feat: Add counselling form validation"
```

## Debugging

### Frontend Debugging

```typescript
// Browser console
console.log('value:', value);
console.error('error:', error);

// React DevTools
- Install React DevTools browser extension
- Inspect component hierarchy and props

// Next.js Debugging
- Use VS Code debugger with launch configuration
```

### Backend Debugging

```typescript
// Console logging
console.log('Debug:', variable);
console.error('Error:', error);

// Node.js Debugger
node --inspect dist/index.js

// VS Code Debug Configuration
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/apps/backend/dist/index.js"
}
```

## Performance Tips

### Frontend

1. Use Next.js Image for images
2. Lazy load components with dynamic imports
3. Optimize bundle size
4. Cache API responses with SWR
5. Use ISR for static content

### Backend

1. Add database indexes
2. Use connection pooling
3. Implement caching
4. Optimize queries
5. Use pagination for large datasets

## Common Tasks

### Adding a New Page

1. Create folder in `app/(marketing)/new-page`
2. Create `page.tsx` with metadata
3. Add route to navigation
4. Implement SEO metadata

### Adding a New API Endpoint

1. Create route file in `routes/`
2. Add validation middleware
3. Implement controller logic
4. Update API documentation

### Updating Database Schema

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Test migrations
4. Deploy to production

## Troubleshooting

### Issues & Solutions

**Port already in use**
```bash
lsof -ti:3000 | xargs kill -9
```

**Node modules issues**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Database connection error**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin
```

**Build errors**
```bash
# Clean build
npm run clean
npm install
npm run build
```

## Getting Help

- Documentation: Check `/docs` folder
- Issues: GitHub Issues
- Discussion: GitHub Discussions
- Email: support@argroup.edu
