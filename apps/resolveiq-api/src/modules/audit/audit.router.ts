import { Request, Response, Router } from 'express';
import { AuditEvent } from '../../types';

const auditRouter = Router();

const mockAuditEvents: AuditEvent[] = [
  {
    id: 'aud-991',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    actor: 'sarah.sre@acme.internal (Role: SRE)',
    action: 'REMEDIATION_APPROVAL',
    targetEntity: 'payment-api:v1.8.2',
    entityId: 'inc-1042',
    rationale: 'Confirmed database pool leak in deployment v1.8.2. Rollback to v1.8.1 approved.',
    status: 'SUCCESS',
  },
  {
    id: 'aud-990',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    actor: 'ResolveIQ Autonomous Agent (Agentic Swarm)',
    action: 'RCA_SYNTHESIS',
    targetEntity: 'inc-1042',
    entityId: 'inc-1042',
    rationale: 'Identified 91% confidence correlation between commit 8b7f3a1 and PG connection saturation.',
    status: 'SUCCESS',
  },
  {
    id: 'aud-989',
    timestamp: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
    actor: 'Prometheus Alertmanager Webhook',
    action: 'INCIDENT_TRIGGER',
    targetEntity: 'payment-api',
    entityId: 'inc-1042',
    rationale: 'Threshold breach: P99 latency exceeded 2000ms threshold for 2 minutes.',
    status: 'SUCCESS',
  },
];

// GET /audit/events
auditRouter.get('/events', (req: Request, res: Response) => {
  return res.status(200).json({
    totalEvents: mockAuditEvents.length,
    complianceFramework: 'SOC2 Type II / ISO 27001 Certified',
    events: mockAuditEvents,
  });
});

// POST /audit/events/export
auditRouter.post('/events/export', (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    exportFormat: 'JSON',
    downloadUrl: '/exports/audit-trail-2026-10-06.json',
    totalRecordsExported: mockAuditEvents.length,
    generatedAt: new Date().toISOString(),
  });
});

export default auditRouter;
