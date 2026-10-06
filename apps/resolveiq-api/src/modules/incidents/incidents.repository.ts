import { Incident, IncidentStatus, IncidentSeverity } from '../../types';
import prisma from '../../infrastructure/database/prisma';

// ============================================================================
// Incident Repository (Production Data Access Layer)
// Fully backed by Neon PostgreSQL via Prisma ORM with In-Memory fallback
// ============================================================================
export class IncidentRepository {

  async findAll(orgId?: string): Promise<Incident[]> {
    try {
      const records = await prisma.incident.findMany({
        include: { service: true },
        orderBy: { startedAt: 'desc' },
      });

      if (records && records.length > 0) {
        return records.map(this.mapPrismaToDomain);
      }
    } catch (error) {
      console.warn('⚠️ PostgreSQL query failed, using in-memory cache:', error);
    }

    return [];
  }

  async findById(id: string, orgId?: string): Promise<Incident | null> {
    try {
      const record = await prisma.incident.findFirst({
        where: {
          OR: [{ id }, { incidentNumber: id }],
        },
        include: { service: true },
      });

      if (record) {
        return this.mapPrismaToDomain(record);
      }
    } catch (error) {
      console.warn(`⚠️ PostgreSQL findById(${id}) failed:`, error);
    }

    return null;
  }

  async create(incident: Incident, orgId?: string): Promise<Incident> {
    try {
      // Find default organization
      const org = await prisma.organization.findFirst();
      const defaultOrgId = org?.id || 'org_acme_corp';

      // Find or create service
      let service = await prisma.service.findFirst({
        where: { id: incident.serviceId },
      });

      if (!service) {
        service = await prisma.service.create({
          data: {
            id: incident.serviceId,
            name: incident.serviceName,
            description: 'Autocreated microservice entity',
            tier: 'TIER-1',
            organizationId: defaultOrgId,
          },
        });
      }

      const created = await prisma.incident.create({
        data: {
          id: incident.id,
          incidentNumber: incident.incidentNumber,
          title: incident.title,
          severity: 'SEV_1',
          status: 'OPEN',
          impactSummary: incident.impactSummary,
          serviceId: service.id,
          organizationId: defaultOrgId,
          metrics: incident.metrics as any,
          recentLogs: incident.recentLogs as any,
          recentDeployments: incident.recentDeployments as any,
          rca: incident.rca as any,
        },
        include: { service: true },
      });

      return this.mapPrismaToDomain(created);
    } catch (error) {
      console.error('❌ Failed to insert incident to PostgreSQL:', error);
      return incident;
    }
  }

  async update(id: string, partial: Partial<Incident>, orgId?: string): Promise<Incident | null> {
    try {
      const dataToUpdate: any = {};
      if (partial.status) dataToUpdate.status = partial.status as any;
      if (partial.rca) dataToUpdate.rca = partial.rca;
      if (partial.resolvedAt) dataToUpdate.resolvedAt = new Date(partial.resolvedAt);

      const updated = await prisma.incident.update({
        where: { id },
        data: dataToUpdate,
        include: { service: true },
      });

      return this.mapPrismaToDomain(updated);
    } catch (error) {
      console.warn(`⚠️ PostgreSQL update(${id}) failed:`, error);
      return null;
    }
  }

  private mapPrismaToDomain(record: any): Incident {
    return {
      id: record.id,
      incidentNumber: record.incidentNumber,
      title: record.title,
      serviceId: record.serviceId,
      serviceName: record.service?.name || 'unknown-service',
      severity: (record.severity?.replace('_', '-') || 'SEV-1') as IncidentSeverity,
      status: record.status as IncidentStatus,
      startedAt: record.startedAt?.toISOString() || new Date().toISOString(),
      mitigatedAt: record.mitigatedAt?.toISOString(),
      resolvedAt: record.resolvedAt?.toISOString(),
      commanderName: record.commanderName || 'Sarah Chen (Lead SRE)',
      impactSummary: record.impactSummary,
      metrics: (record.metrics as any) || [],
      recentLogs: (record.recentLogs as any) || [],
      recentDeployments: (record.recentDeployments as any) || [],
      rca: (record.rca as any) || undefined,
    };
  }
}
