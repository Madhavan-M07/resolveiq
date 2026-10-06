import { PrismaClient, Role, IncidentSeverity, IncidentStatus, ServiceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Neon PostgreSQL Database...');

  // 1. Create or upsert Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'org_acme_corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'org_acme_corp',
    },
  });
  console.log(`✅ Organization created: ${org.name} (${org.id})`);

  // 2. Create or upsert Lead SRE User
  const user = await prisma.user.upsert({
    where: { email: 'sarah.sre@acme.internal' },
    update: {},
    create: {
      email: 'sarah.sre@acme.internal',
      name: 'Sarah Chen (Lead SRE)',
      role: Role.SRE,
      organizationId: org.id,
    },
  });
  console.log(`✅ SRE User created: ${user.name}`);

  // 3. Create or upsert Payment API Service
  const paymentService = await prisma.service.upsert({
    where: { id: 'svc-payment' },
    update: {},
    create: {
      id: 'svc-payment',
      name: 'payment-api',
      description: 'Processes credit card transactions, digital wallets, and payment reconciliations.',
      tier: 'TIER-1',
      status: ServiceStatus.DEGRADED,
      latencyP99Ms: 4820.0,
      errorRatePercent: 18.4,
      activeIncidentsCount: 1,
      currentVersion: 'v1.8.2',
      organizationId: org.id,
    },
  });

  // 4. Create Order and Inventory Services
  await prisma.service.upsert({
    where: { id: 'svc-order' },
    update: {},
    create: {
      id: 'svc-order',
      name: 'order-api',
      description: 'Manages user cart checkout, order state machines, and fulfillment routing.',
      tier: 'TIER-1',
      status: ServiceStatus.HEALTHY,
      latencyP99Ms: 185.0,
      errorRatePercent: 0.02,
      activeIncidentsCount: 0,
      currentVersion: 'v2.1.0',
      organizationId: org.id,
    },
  });

  await prisma.service.upsert({
    where: { id: 'svc-inventory' },
    update: {},
    create: {
      id: 'svc-inventory',
      name: 'inventory-api',
      description: 'Warehouse inventory allocation, stock reservations, and SKU tracking.',
      tier: 'TIER-2',
      status: ServiceStatus.HEALTHY,
      latencyP99Ms: 95.0,
      errorRatePercent: 0.0,
      activeIncidentsCount: 0,
      currentVersion: 'v1.4.0',
      organizationId: org.id,
    },
  });
  console.log('✅ Services catalog seeded.');

  // 5. Create Flagship Incident INC-1042
  const incident = await prisma.incident.upsert({
    where: { incidentNumber: 'INC-1042' },
    update: {},
    create: {
      id: 'inc-1042',
      incidentNumber: 'INC-1042',
      title: 'Payment API Latency Spike & 5xx Outage',
      severity: IncidentSeverity.SEV_1,
      status: IncidentStatus.INVESTIGATING,
      impactSummary: '18.4% of checkout requests failing. P99 latency degraded from 240ms to 4,820ms.',
      serviceId: paymentService.id,
      organizationId: org.id,
      metrics: [
        { timestamp: '10:15', cpuPercent: 32, memoryPercent: 44, latencyMs: 240, activeDbConnections: 45, maxDbConnections: 100, errorRate: 0.01 },
        { timestamp: '10:20', cpuPercent: 35, memoryPercent: 46, latencyMs: 260, activeDbConnections: 52, maxDbConnections: 100, errorRate: 0.02 },
        { timestamp: '10:25', cpuPercent: 58, memoryPercent: 62, latencyMs: 1450, activeDbConnections: 89, maxDbConnections: 100, errorRate: 4.5 },
        { timestamp: '10:30', cpuPercent: 94, memoryPercent: 88, latencyMs: 4820, activeDbConnections: 100, maxDbConnections: 100, errorRate: 18.4 },
      ],
      recentLogs: [
        { id: 'log-1', timestamp: '10:28:12', level: 'ERROR', service: 'payment-api', message: 'PG::ConnectionBad: FATAL: remaining connection slots are reserved for non-replication superuser connections' },
        { id: 'log-2', timestamp: '10:28:44', level: 'FATAL', service: 'payment-api', message: 'Timeout acquiring database connection from pool after 5000ms. Active: 100/100' },
        { id: 'log-3', timestamp: '10:29:01', level: 'ERROR', service: 'payment-api', message: 'HTTP 504 Gateway Timeout on POST /v1/charges' },
      ],
      recentDeployments: [
        { id: 'dep-101', version: 'v1.8.2', service: 'payment-api', deployedAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(), deployedBy: 'alex.dev@acme.internal', commitHash: '8b7f3a1', commitMessage: 'chore(db): migrate to asynchronous connection pool batching', status: 'SUCCESS' },
      ],
      rca: {
        investigationId: 'inv-9921',
        incidentId: 'inc-1042',
        confidenceScore: 91,
        summary: 'Database connection pool exhaustion on payment-api caused by async pooling changes in deployment v1.8.2.',
        rootCause: 'Connection pool leak: v1.8.2 fails to release client sockets on timeout in batch payment reconciliation worker.',
        detailedAnalysis: 'Metrics show a 100% correlation between deployment v1.8.2 at 10:24 AM and the saturation of connection pool from 52 to 100/100 at 10:27 AM.',
      },
    },
  });
  console.log(`✅ Incident seeded: ${incident.incidentNumber} (${incident.id})`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
