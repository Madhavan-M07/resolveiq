import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  Incident,
  IncidentStatus,
  IncidentSeverity,
  RootCauseAnalysis,
  RemediationAction,
  ServiceEntity,
  MetricDataPoint,
  LogEntry,
  DeploymentHistory,
  SimulationScenario,
  AuditEvent,
} from '../types';

// ============================================================================
// Dynamic Base URL Resolution
// ============================================================================
const resolveApiBaseUrl = (): string => {
  // 1. Environment variable if explicitly set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // 2. Client-side browser execution fallback
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If running locally, route to backend port 4000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000/api/v1';
    }
    // In production (e.g. Vercel), route to live Render API Gateway
    return 'https://resolveiq-1-zqj0.onrender.com/api/v1';
  }

  // 3. Server-side rendering (SSR) fallback
  return 'https://resolveiq-1-zqj0.onrender.com/api/v1';
};

// ============================================================================
// Axios Client Instance with Interceptors
// ============================================================================
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor (Inject Auth Token & Org ID dynamically)
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('resolveiq_auth_token');
      const orgId = localStorage.getItem('resolveiq_org_id') || 'org_acme_corp';

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (orgId && config.headers) {
        config.headers['X-Organization-Id'] = orgId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (Global Error Normalization)
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const customError = {
      message: (error.response?.data as { message?: string })?.message || error.message || 'An unexpected API error occurred',
      statusCode: error.response?.status || 500,
      details: error.response?.data,
    };
    return Promise.reject(customError);
  }
);

// ============================================================================
// Single Unified API Client Object for the Entire Frontend
// ============================================================================
export const api = {
  // --------------------------------------------------------------------------
  // 1. Incidents Domain
  // --------------------------------------------------------------------------
  incidents: {
    list: async (params?: {
      status?: IncidentStatus;
      severity?: IncidentSeverity;
      serviceId?: string;
      page?: number;
      limit?: number;
    }): Promise<{ data: Incident[]; total: number }> => {
      const response = await axiosInstance.get('/incidents', { params });
      return response.data;
    },

    getById: async (id: string): Promise<Incident> => {
      const response = await axiosInstance.get(`/incidents/${id}`);
      return response.data;
    },

    create: async (payload: {
      title: string;
      serviceId: string;
      severity: IncidentSeverity;
      description?: string;
    }): Promise<Incident> => {
      const response = await axiosInstance.post('/incidents', payload);
      return response.data;
    },

    updateStatus: async (
      id: string,
      status: IncidentStatus,
      resolutionNote?: string
    ): Promise<Incident> => {
      const response = await axiosInstance.patch(`/incidents/${id}/status`, {
        status,
        resolutionNote,
      });
      return response.data;
    },

    assignCommander: async (id: string, userId: string): Promise<Incident> => {
      const response = await axiosInstance.post(`/incidents/${id}/assign`, {
        userId,
      });
      return response.data;
    },
  },

  // --------------------------------------------------------------------------
  // 2. AI & LangGraph Multi-Agent Investigation
  // --------------------------------------------------------------------------
  ai: {
    triggerInvestigation: async (
      incidentId: string
    ): Promise<{ investigationId: string; status: string }> => {
      const response = await axiosInstance.post('/ai/investigate', {
        incidentId,
      });
      return response.data;
    },

    getInvestigationStatus: async (
      investigationId: string
    ): Promise<{
      status: 'IDLE' | 'ANALYZING_METRICS' | 'SCANNING_LOGS' | 'QUERYING_PINECONE' | 'SYNTHESIZING_RCA' | 'COMPLETED';
      currentNode: string;
      rca?: RootCauseAnalysis;
    }> => {
      const response = await axiosInstance.get(`/ai/investigate/${investigationId}/status`);
      return response.data;
    },

    getStreamUrl: (incidentId: string): string => {
      const baseUrl = resolveApiBaseUrl();
      return `${baseUrl}/ai/investigate/${incidentId}/stream`;
    },

    chat: async (
      incidentId: string,
      question: string
    ): Promise<{ answer: string; citations: string[] }> => {
      const response = await axiosInstance.post(`/ai/investigate/${incidentId}/chat`, {
        question,
      });
      return response.data;
    },

    generateRemediationPlan: async (
      incidentId: string
    ): Promise<{ rca: RootCauseAnalysis; remediationPlan: RemediationAction[] }> => {
      const response = await axiosInstance.post('/ai/remediation/generate', {
        incidentId,
      });
      return response.data;
    },
  },

  // --------------------------------------------------------------------------
  // 3. Human-in-the-Loop & Remediation Controls
  // --------------------------------------------------------------------------
  remediation: {
    getPlan: async (incidentId: string): Promise<RemediationAction[]> => {
      const response = await axiosInstance.get(`/incidents/${incidentId}/remediation`);
      return response.data;
    },

    approve: async (payload: {
      incidentId: string;
      actionId: string;
      approvedBy: string;
      rationale: string;
    }): Promise<{ success: boolean; action: RemediationAction }> => {
      const response = await axiosInstance.post(
        `/incidents/${payload.incidentId}/remediation/approve`,
        payload
      );
      return response.data;
    },

    execute: async (payload: {
      incidentId: string;
      actionId: string;
      idempotencyKey: string;
    }): Promise<{ success: boolean; message: string; output: Record<string, unknown> }> => {
      const response = await axiosInstance.post(
        `/incidents/${payload.incidentId}/remediation/execute`,
        payload,
        {
          headers: {
            'Idempotency-Key': payload.idempotencyKey,
          },
        }
      );
      return response.data;
    },
  },

  // --------------------------------------------------------------------------
  // 4. Services Catalog & Telemetry
  // --------------------------------------------------------------------------
  services: {
    list: async (): Promise<ServiceEntity[]> => {
      const response = await axiosInstance.get('/services');
      return response.data;
    },

    getById: async (id: string): Promise<ServiceEntity> => {
      const response = await axiosInstance.get(`/services/${id}`);
      return response.data;
    },

    getHealth: async (
      id: string
    ): Promise<{
      service: ServiceEntity;
      metrics: MetricDataPoint[];
      recentLogs: LogEntry[];
    }> => {
      const response = await axiosInstance.get(`/services/${id}/health`);
      return response.data;
    },

    getDeployments: async (id: string): Promise<DeploymentHistory[]> => {
      const response = await axiosInstance.get(`/services/${id}/deployments`);
      return response.data;
    },

    getTopology: async (): Promise<{
      nodes: Array<{ id: string; label: string; status: string }>;
      edges: Array<{ from: string; to: string }>;
    }> => {
      const response = await axiosInstance.get('/services/topology');
      return response.data;
    },
  },

  // --------------------------------------------------------------------------
  // 5. Pinecone Knowledge Base & RAG
  // --------------------------------------------------------------------------
  knowledge: {
    query: async (payload: {
      query: string;
      serviceId?: string;
      topK?: number;
      documentType?: 'runbook' | 'postmortem' | 'architecture';
    }): Promise<{
      results: Array<{
        id: string;
        title: string;
        content: string;
        score: number;
        source: string;
      }>;
    }> => {
      const response = await axiosInstance.post('/knowledge/query', payload);
      return response.data;
    },

    listDocuments: async (): Promise<
      Array<{
        id: string;
        title: string;
        type: string;
        service: string;
        vectorCount: number;
        updatedAt: string;
      }>
    > => {
      const response = await axiosInstance.get('/knowledge/documents');
      return response.data;
    },
  },

  // --------------------------------------------------------------------------
  // 6. Chaos Simulation Sandbox (The Live Demo Trigger)
  // --------------------------------------------------------------------------
  sandbox: {
    listScenarios: async (): Promise<SimulationScenario[]> => {
      const response = await axiosInstance.get('/sandbox/scenarios');
      return response.data;
    },

    triggerScenario: async (scenarioId: string): Promise<{
      success: boolean;
      incidentId: string;
      message: string;
      affectedService: string;
    }> => {
      const response = await axiosInstance.post('/sandbox/scenarios/trigger', {
        scenarioId,
      });
      return response.data;
    },

    resetEnvironment: async (): Promise<{ success: boolean; message: string }> => {
      const response = await axiosInstance.post('/sandbox/scenarios/reset');
      return response.data;
    },
  },

  // --------------------------------------------------------------------------
  // 7. Audit & Compliance Trail
  // --------------------------------------------------------------------------
  audit: {
    listEvents: async (params?: {
      entityId?: string;
      limit?: number;
    }): Promise<{ events: AuditEvent[] }> => {
      const response = await axiosInstance.get('/audit/events', { params });
      return response.data;
    },
  },

  // --------------------------------------------------------------------------
  // 8. Enterprise Integrations & Autonomous OpsHub
  // --------------------------------------------------------------------------
  integrations: {
    sendEmail: async (payload: {
      recipients: string[];
      subject: string;
      executiveSummary: string;
      incidentId: string;
    }): Promise<{ success: boolean; messageId: string }> => {
      const response = await axiosInstance.post('/integrations/email/send', payload);
      return response.data;
    },

    scheduleWarRoom: async (payload: {
      title: string;
      attendees: string[];
      startTime?: string;
      durationMinutes?: number;
      incidentId: string;
    }): Promise<{ success: boolean; meetingUrl: string; calendarEventId: string }> => {
      const response = await axiosInstance.post('/integrations/calendar/war-room', payload);
      return response.data;
    },

    notifyTeams: async (payload: {
      channel: string;
      incidentId: string;
      cardData: Record<string, unknown>;
    }): Promise<{ success: boolean }> => {
      const response = await axiosInstance.post('/integrations/teams/notify', payload);
      return response.data;
    },

    createJiraTicket: async (payload: {
      projectKey: string;
      summary: string;
      description: string;
      priority: 'Highest' | 'High' | 'Medium' | 'Low';
      incidentId: string;
    }): Promise<{ success: boolean; jiraKey: string; jiraUrl: string }> => {
      const response = await axiosInstance.post('/integrations/jira/ticket', payload);
      return response.data;
    },
  },

  // --------------------------------------------------------------------------
  // 9. Database Schema & Lock Inspector (Database MCP)
  // --------------------------------------------------------------------------
  database: {
    getSchemas: async (dbName?: string): Promise<{
      databases: Array<{
        name: string;
        sizeMb: number;
        tables: Array<{ name: string; rowCount: number; indexSizeMb: number }>;
      }>;
    }> => {
      const response = await axiosInstance.get('/database/schemas', { params: { dbName } });
      return response.data;
    },

    getActiveLocks: async (): Promise<{
      locks: Array<{
        pid: number;
        query: string;
        blockedDurationSec: number;
        clientAddress: string;
        state: string;
      }>;
    }> => {
      const response = await axiosInstance.get('/database/locks');
      return response.data;
    },

    killBlockingQuery: async (pid: number): Promise<{ success: boolean; message: string }> => {
      const response = await axiosInstance.post(`/database/locks/${pid}/kill`);
      return response.data;
    },
  },
};

export default api;

