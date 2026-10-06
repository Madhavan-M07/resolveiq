import { Request, Response, Router } from 'express';
import { SimulationScenario } from '../../types';
import { IncidentService } from '../incidents/incidents.service';

export class SandboxService {
  private static scenarios: SimulationScenario[] = [
    {
      id: 'payment-db-pool',
      name: 'PostgreSQL Connection Pool Exhaustion',
      description: 'Simulates a leak in checkout async batching, maxing active connections from 45 to 100/100 and inducing 4.8s P99 latency.',
      targetService: 'payment-api',
      failureType: 'DB_POOL_EXHAUSTION',
      durationSeconds: 300,
      expectedSeverity: 'SEV-1',
      isActive: false,
    },
    {
      id: 'order-memory-leak',
      name: 'Order Service Heap Memory Leak',
      description: 'Simulates uncollected buffer references in order validation loop leading to OOM container kill and 502 Bad Gateway.',
      targetService: 'order-api',
      failureType: 'MEMORY_LEAK',
      durationSeconds: 180,
      expectedSeverity: 'SEV-2',
      isActive: false,
    },
    {
      id: 'bad-deployment-v2',
      name: 'Faulty Deployment Rollout',
      description: 'Simulates rolling out v2.0.1 with an unhandled null pointer exception on user profile verification.',
      targetService: 'user-service',
      failureType: 'BAD_DEPLOYMENT',
      durationSeconds: 240,
      expectedSeverity: 'SEV-2',
      isActive: false,
    },
  ];

  private incidentService: IncidentService;

  constructor() {
    this.incidentService = new IncidentService();
  }

  getScenarios(): SimulationScenario[] {
    return SandboxService.scenarios;
  }

  async triggerScenario(scenarioId: string, orgId: string) {
    const scenario = SandboxService.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) throw new Error(`Scenario ${scenarioId} not found.`);

    scenario.isActive = true;

    // Trigger incident creation in the system
    const incident = await this.incidentService.createIncident(
      {
        title: `[SIMULATED] ${scenario.name} on ${scenario.targetService}`,
        serviceId: `svc-${scenario.targetService.replace('-api', '')}`,
        severity: scenario.expectedSeverity,
        description: scenario.description,
      },
      orgId
    );

    return {
      success: true,
      message: `Scenario '${scenario.name}' triggered successfully. Incident ${incident.incidentNumber} created.`,
      incidentId: incident.id,
      affectedService: scenario.targetService,
    };
  }

  resetEnvironment() {
    SandboxService.scenarios.forEach((s) => (s.isActive = false));
    return {
      success: true,
      message: 'Sandbox environment reset to baseline. All services healthy.',
    };
  }
}

export class SandboxController {
  private service: SandboxService;

  constructor() {
    this.service = new SandboxService();
  }

  list = (req: Request, res: Response) => {
    return res.status(200).json(this.service.getScenarios());
  };

  trigger = async (req: Request, res: Response) => {
    try {
      const orgId = (req.headers['x-organization-id'] as string) || 'org_acme_corp';
      const { scenarioId } = req.body;
      const result = await this.service.triggerScenario(scenarioId, orgId);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };

  reset = (req: Request, res: Response) => {
    const result = this.service.resetEnvironment();
    return res.status(200).json(result);
  };
}

const sandboxRouter = Router();
const sandboxController = new SandboxController();

sandboxRouter.get('/scenarios', sandboxController.list);
sandboxRouter.post('/scenarios/trigger', sandboxController.trigger);
sandboxRouter.post('/scenarios/reset', sandboxController.reset);

export default sandboxRouter;
