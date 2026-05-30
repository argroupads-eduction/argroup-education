import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import blogsRouter from './routes/blogs';
import contentRouter from './routes/content';
import countriesRouter from './routes/countries';
import universitiesRouter from './routes/universities';
import formsRouter from './routes/forms';
import newsletterRouter from './routes/newsletter';
import { connectPrisma, prisma, reconnectPrisma } from './lib/prisma';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests, please try again later',
});
app.use('/api/', limiter);

// Health Check (includes Neon / Prisma connectivity)
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    try {
      await reconnectPrisma();
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ok',
        database: 'reconnected',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[health] database unreachable:', err);
      res.status(503).json({
        status: 'degraded',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  }
});

// Routes
app.use('/api/blogs', blogsRouter);
app.use('/api/content', contentRouter);
app.use('/api/countries', countriesRouter);
app.use('/api/universities', universitiesRouter);
app.use('/api/forms', formsRouter);
app.use('/api/newsletter', newsletterRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error Handler
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

async function start() {
  try {
    await connectPrisma();
    console.log('🗄️  Database: Neon connected');
  } catch (err) {
    console.error('⚠️  Database: could not connect (API will retry on requests):', err);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} — closing server and database connections…`);
    server.close();
    await prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void start();
