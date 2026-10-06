// ============================================================================
// ResolveIQ Core Type Definitions
// ============================================================================

export type IncidentSeverity = 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';

export type IncidentStatus = 
  | 'OPEN' 
  | 'INVESTIGATING' 
  | 'ROOT_CAUSE_IDENTIFIED' 
  | 'REMEDIATION_PENDING_APPROVAL' 
  | 'MITIGATING' 
  | 'RESOLVED' 
  | 'CLOSED';

export type ServiceHealthStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export interface ServiceEntity {
  id: string;
  name: string;
  description: string;
  tier: 'TIER-1' | 'TIER-2' | 'TIER-3';
  status: ServiceHealthStatus;
  latencyP99Ms: number;
  errorRatePercent: number;
  activeIncidentsCount: number;
  lastDeployedAt: string;
  currentVersion: string;
  upstreamServices: string[];
  downstreamServices: string[];
}

export interface MetricDataPoint {
  timestamp: string;
  cpuPercent: number;
  memoryPercent: number;
  latencyMs: number;
  activeDbConnections: number;
  maxDbConnections: number;
  errorRate: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  service: string;
  message: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
}

export interface DeploymentHistory {
  id: string;
  version: string;
  service: string;
  deployedAt: string;
  deployedBy: string;
  commitHash: string;
  commitMessage: string;
  status: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
}

export interface IncidentEvidenceItem {
  id: string;
  type: 'METRIC' | 'LOG' | 'DEPLOYMENT' | 'RUNBOOK' | 'PAST_INCIDENT';
  title: string;
  description: string;
  confidence: number;
  source: string;
  timestamp: string;
  badge?: string;
}

export interface RemediationAction {
  id: string;
  title: string;
  description: string;
  actionType: 'ROLLBACK' | 'SCALE_CONNECTION_POOL' | 'RESTART_POD' | 'KILL_QUERIES' | 'CIRCUIT_BREAKER';
  targetService: string;
  targetPayload: Record<string, unknown>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresApproval: boolean;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  executionStatus: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
}

export interface RootCauseAnalysis {
  investigationId: string;
  incidentId: string;
  confidenceScore: number; // e.g. 87%
  summary: string;
  rootCause: string;
  detailedAnalysis: string;
  evidence: IncidentEvidenceItem[];
  remediationPlan: RemediationAction[];
  similarPastIncidents: Array<{
    id: string;
    title: string;
    similarityScore: number;
    resolutionSummary: string;
  }>;
  relevantRunbooks: Array<{
    title: string;
    url: string;
    pineconeScore: number;
    recommendedSection: string;
  }>;
}

export interface Incident {
  id: string;
  incidentNumber: string; // e.g. "INC-1042"
  title: string;
  serviceId: string;
  serviceName: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  startedAt: string;
  mitigatedAt?: string;
  resolvedAt?: string;
  commanderName?: string;
  impactSummary: string;
  rca?: RootCauseAnalysis;
  metrics: MetricDataPoint[];
  recentLogs: LogEntry[];
  recentDeployments: DeploymentHistory[];
}

export interface LangGraphStepStream {
  stepIndex: number;
  nodeName: string;
  nodeDescription: string;
  status: 'STARTING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  toolCall?: {
    toolName: string;
    arguments: Record<string, unknown>;
    resultSummary?: string;
  };
  thoughtSnippet?: string;
  timestamp: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  targetService: string;
  failureType: 'DB_POOL_EXHAUSTION' | 'MEMORY_LEAK' | 'BAD_DEPLOYMENT' | 'KAFKA_LAG';
  durationSeconds: number;
  expectedSeverity: IncidentSeverity;
  isActive: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetEntity: string;
  entityId: string;
  rationale: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
}
