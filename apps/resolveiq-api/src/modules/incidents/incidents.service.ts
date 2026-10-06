import { IncidentRepository } from './incidents.repository';
import { Incident, IncidentStatus, IncidentSeverity, RemediationAction } from '../../types';

export class IncidentService {
  private repository: IncidentRepository;

  constructor() {
    this.repository = new IncidentRepository();
  }

  async getAllIncidents(orgId: string): Promise<Incident[]> {
    return this.repository.findAll(orgId);
  }

  async getIncidentById(id: string, orgId: string): Promise<Incident> {
    const incident = await this.repository.findById(id, orgId);
    if (!incident) {
      throw new Error(`Incident with ID ${id} not found.`);
    }
    return incident;
  }

  async createIncident(
    payload: { title: string; serviceId: string; severity: IncidentSeverity; description?: string },
    orgId: string
  ): Promise<Incident> {
    const count = (await this.repository.findAll(orgId)).length + 1043;
    const newIncident: Incident = {
      id: `inc-${count}`,
      incidentNumber: `INC-${count}`,
      title: payload.title,
      serviceId: payload.serviceId,
      serviceName: payload.serviceId.replace('svc-', '') + '-api',
      severity: payload.severity,
      status: 'OPEN',
      startedAt: new Date().toISOString(),
      impactSummary: payload.description || 'Automated incident triggered by alert threshold breach.',
      metrics: [],
      recentLogs: [],
      recentDeployments: [],
    };

    return this.repository.create(newIncident, orgId);
  }

  async updateIncidentStatus(
    id: string,
    status: IncidentStatus,
    note: string | undefined,
    orgId: string
  ): Promise<Incident> {
    const incident = await this.getIncidentById(id, orgId);
    const updated = await this.repository.update(id, { status }, orgId);
    if (!updated) throw new Error(`Failed to update incident ${id}`);
    return updated;
  }

  async approveRemediation(
    incidentId: string,
    actionId: string,
    approvedBy: string,
    rationale: string,
    orgId: string
  ): Promise<RemediationAction> {
    const incident = await this.getIncidentById(incidentId, orgId);
    if (!incident.rca || !incident.rca.remediationPlan) {
      throw new Error('No remediation plan found for this incident.');
    }

    const action = incident.rca.remediationPlan.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Remediation action ${actionId} not found.`);
    }

    action.isApproved = true;
    action.approvedBy = approvedBy;
    action.approvedAt = new Date().toISOString();

    await this.repository.update(incidentId, { rca: incident.rca }, orgId);
    return action;
  }

  async executeRemediation(
    incidentId: string,
    actionId: string,
    idempotencyKey: string,
    orgId: string
  ): Promise<{ success: boolean; message: string; output: Record<string, unknown> }> {
    const incident = await this.getIncidentById(incidentId, orgId);
    const action = incident.rca?.remediationPlan.find((a) => a.id === actionId);

    if (!action) throw new Error('Action not found.');
    if (action.requiresApproval && !action.isApproved) {
      throw new Error('Action requires human approval before execution.');
    }

    // Execute mock remediation (e.g. Rollback Kubernetes deployment)
    action.executionStatus = 'EXECUTING';

    // Simulate recovery
    action.executionStatus = 'COMPLETED';
    await this.repository.update(
      incidentId,
      {
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString(),
        rca: incident.rca,
      },
      orgId
    );

    return {
      success: true,
      message: `Successfully executed ${action.actionType} for ${action.targetService}. Service telemetry recovering to baseline.`,
      output: {
        targetService: action.targetService,
        revertedToVersion: (action.targetPayload as any)?.targetVersion || 'v1.8.1',
        executionDurationMs: 4120,
        idempotencyKey,
      },
    };
  }
}
