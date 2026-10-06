import { Request, Response, Router } from 'express';
import { ServiceEntity, MetricDataPoint, DeploymentHistory } from '../../types';

// ============================================================================
// Service Catalog & Telemetry Data Store
// ============================================================================
const mockServices: ServiceEntity[] = [
  {
    id: 'svc-payment',
    name: 'payment-api',
    description: 'Processes credit card transactions, digital wallets, and payment reconciliations.',
    tier: 'TIER-1',
    status: 'DEGRADED',
    latencyP99Ms: 4820,
    errorRatePercent: 18.4,
    activeIncidentsCount: 1,
    lastDeployedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    currentVersion: 'v1.8.2',
    upstreamServices: ['order-service', 'checkout-web'],
    downstreamServices: ['postgres-payment-db', 'stripe-external-gateway', 'redis-idempotency'],
  },
  {
    id: 'svc-order',
    name: 'order-api',
    description: 'Manages user cart checkout, order state machines, and fulfillment routing.',
    tier: 'TIER-1',
    status: 'HEALTHY',
    latencyP99Ms: 185,
    errorRatePercent: 0.02,
    activeIncidentsCount: 0,
    lastDeployedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    currentVersion: 'v2.1.0',
    upstreamServices: ['checkout-web'],
    downstreamServices: ['payment-api', 'inventory-api', 'postgres-order-db'],
  },
  {
    id: 'svc-inventory',
    name: 'inventory-api',
    description: 'Warehouse inventory allocation, stock reservations, and SKU tracking.',
    tier: 'TIER-2',
    status: 'HEALTHY',
    latencyP99Ms: 95,
    errorRatePercent: 0.0,
    activeIncidentsCount: 0,
    lastDeployedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    currentVersion: 'v1.4.0',
    upstreamServices: ['order-api'],
    downstreamServices: ['postgres-inventory-db'],
  },
];

const mockDeployments: Record<string, DeploymentHistory[]> = {
  'svc-payment': [
    {
      id: 'dep-101',
      version: 'v1.8.2',
      service: 'payment-api',
      deployedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      deployedBy: 'alex.dev@acme.internal',
      commitHash: '8b7f3a1',
      commitMessage: 'chore(db): migrate to asynchronous connection pool batching',
      status: 'SUCCESS',
    },
    {
      id: 'dep-100',
      version: 'v1.8.1',
      service: 'payment-api',
      deployedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      deployedBy: 'sarah.sre@acme.internal',
      commitHash: '2c9e110',
      commitMessage: 'fix(idempotency): add redis key ttl for charge retries',
      status: 'SUCCESS',
    },
  ],
};

const servicesRouter = Router();

// GET /services
servicesRouter.get('/', (req: Request, res: Response) => {
  return res.status(200).json(mockServices);
});

// GET /services/:id
servicesRouter.get('/:id', (req: Request, res: Response) => {
  const service = mockServices.find((s) => s.id === req.params.id || s.name === req.params.id);
  if (!service) {
    return res.status(404).json({ message: `Service ${req.params.id} not found.` });
  }
  return res.status(200).json(service);
});

// GET /services/:id/health
servicesRouter.get('/:id/health', (req: Request, res: Response) => {
  const service = mockServices.find((s) => s.id === req.params.id || s.name === req.params.id);
  if (!service) {
    return res.status(404).json({ message: `Service ${req.params.id} not found.` });
  }

  const liveMetrics: MetricDataPoint[] = [
    { timestamp: '10:15', cpuPercent: 32, memoryPercent: 44, latencyMs: 240, activeDbConnections: 45, maxDbConnections: 100, errorRate: 0.01 },
    { timestamp: '10:20', cpuPercent: 35, memoryPercent: 46, latencyMs: 260, activeDbConnections: 52, maxDbConnections: 100, errorRate: 0.02 },
    { timestamp: '10:25', cpuPercent: 58, memoryPercent: 62, latencyMs: 1450, activeDbConnections: 89, maxDbConnections: 100, errorRate: 4.5 },
    { timestamp: '10:30', cpuPercent: 94, memoryPercent: 88, latencyMs: 4820, activeDbConnections: 100, maxDbConnections: 100, errorRate: 18.4 },
  ];

  return res.status(200).json({
    service,
    metrics: liveMetrics,
    systemLoadAverage: [2.4, 3.1, 4.8],
    podStatus: { running: 4, restarting: 1, failed: 0 },
  });
});

// GET /services/:id/deployments
servicesRouter.get('/:id/deployments', (req: Request, res: Response) => {
  const deployments = mockDeployments[req.params.id] || mockDeployments['svc-payment'] || [];
  return res.status(200).json(deployments);
});

export default servicesRouter;
