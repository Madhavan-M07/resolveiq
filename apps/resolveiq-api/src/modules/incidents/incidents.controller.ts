import { Request, Response } from 'express';
import { IncidentService } from './incidents.service';

export class IncidentController {
  private service: IncidentService;

  constructor() {
    this.service = new IncidentService();
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const orgId = (req.headers['x-organization-id'] as string) || 'org_acme_corp';
      const incidents = await this.service.getAllIncidents(orgId);
      return res.status(200).json({ data: incidents, total: incidents.length });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const orgId = (req.headers['x-organization-id'] as string) || 'org_acme_corp';
      const incident = await this.service.getIncidentById(req.params.id, orgId);
      return res.status(200).json(incident);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const orgId = (req.headers['x-organization-id'] as string) || 'org_acme_corp';
      const { title, serviceId, severity, description } = req.body;
      if (!title || !serviceId || !severity) {
        return res.status(400).json({ message: 'Missing required incident fields: title, serviceId, severity.' });
      }
      const created = await this.service.createIncident({ title, serviceId, severity, description }, orgId);
      return res.status(201).json(created);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    try {
      const orgId = (req.headers['x-organization-id'] as string) || 'org_acme_corp';
      const { status, resolutionNote } = req.body;
      const updated = await this.service.updateIncidentStatus(req.params.id, status, resolutionNote, orgId);
      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };

  approveRemediation = async (req: Request, res: Response) => {
    try {
      const orgId = (req.headers['x-organization-id'] as string) || 'org_acme_corp';
      const { incidentId, actionId, approvedBy, rationale } = req.body;
      const action = await this.service.approveRemediation(incidentId, actionId, approvedBy, rationale, orgId);
      return res.status(200).json({ success: true, action });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };

  executeRemediation = async (req: Request, res: Response) => {
    try {
      const orgId = (req.headers['x-organization-id'] as string) || 'org_acme_corp';
      const idempotencyKey = (req.headers['idempotency-key'] as string) || `idemp-${Date.now()}`;
      const { incidentId, actionId } = req.body;
      const result = await this.service.executeRemediation(incidentId, actionId, idempotencyKey, orgId);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };
}
