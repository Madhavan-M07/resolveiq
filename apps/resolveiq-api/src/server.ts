import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import incidentsRouter from './modules/incidents/incidents.router';
import sandboxRouter from './modules/sandbox/sandbox.router';
import servicesRouter from './modules/services/services.router';
import databaseRouter from './modules/database/database.router';
import integrationsRouter from './modules/integrations/integrations.router';
import auditRouter from './modules/audit/audit.router';

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================================================
// Global Middlewares
// ============================================================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'Idempotency-Key'],
}));

app.use(express.json());

// Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// ============================================================================
// Health & Liveness
// ============================================================================
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'resolveiq-api',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// API Version 1 Routers Mount
// ============================================================================
app.use('/api/v1/incidents', incidentsRouter);
app.use('/api/v1/sandbox', sandboxRouter);
app.use('/api/v1/services', servicesRouter);
app.use('/api/v1/database', databaseRouter);
app.use('/api/v1/integrations', integrationsRouter);
app.use('/api/v1/audit', auditRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[GlobalErrorHandler]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

export default app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 ResolveIQ API Gateway running on http://localhost:${PORT}/api/v1`);
  });
}
