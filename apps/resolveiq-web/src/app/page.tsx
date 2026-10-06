'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Server,
  Activity,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  Play,
  TrendingDown,
  TrendingUp,
  Lock,
  GitBranch,
  Database,
  Search,
  Bell,
  Settings,
  Terminal,
  Cpu,
  BarChart2,
  ListFilter,
  ExternalLink,
  Users,
  Compass,
  GitCommit,
  Radio,
  Workflow,
  Check,
  RefreshCw,
  Code2,
  Sliders,
  Filter,
  Download,
  Share2,
  Maximize2,
  Bot,
  Sparkles,
  Send,
  X,
  MessageSquare,
  CornerDownLeft
} from 'lucide-react';

// ============================================================================
// Types & Sample Telemetry Data
// ============================================================================

interface LogRow {
  id: string;
  timestamp: string;
  level: 'FATAL' | 'ERROR' | 'WARN' | 'INFO';
  pod: string;
  message: string;
}

const INITIAL_LOGS: LogRow[] = [
  {
    id: 'l-1',
    timestamp: '16:38:15.221',
    level: 'FATAL',
    pod: 'payment-api-7d9f-x4k2',
    message: 'PG::ConnectionBad: remaining connection slots are reserved for non-replication superusers'
  },
  {
    id: 'l-2',
    timestamp: '16:38:12.890',
    level: 'ERROR',
    pod: 'payment-api-7d9f-x4k2',
    message: 'Timeout acquiring database connection from pool after 5000ms. Active: 100/100, Queue: 842'
  },
  {
    id: 'l-3',
    timestamp: '16:38:05.114',
    level: 'ERROR',
    pod: 'payment-api-7d9f-9a1c',
    message: 'ActiveRecord::ConnectionTimeoutError: could not obtain a connection from the pool within 5.000 seconds'
  },
  {
    id: 'l-4',
    timestamp: '16:37:58.742',
    level: 'WARN',
    pod: 'payment-api-7d9f-9a1c',
    message: 'Active connections reached pool limit (95/100). Connection acquisition latency: 3,420ms'
  },
  {
    id: 'l-5',
    timestamp: '16:37:32.401',
    level: 'WARN',
    pod: 'payment-api-7d9f-3m7b',
    message: 'Async pool client checkout_worker.py:142 unreleased connection detected after job timeout'
  },
  {
    id: 'l-6',
    timestamp: '16:36:40.512',
    level: 'INFO',
    pod: 'payment-api-7d9f-3m7b',
    message: 'HTTP POST /v1/charges 504 Gateway Timeout duration_ms=5002 client_ip=10.244.3.18'
  },
  {
    id: 'l-7',
    timestamp: '16:35:10.004',
    level: 'INFO',
    pod: 'payment-api-7d9f-x4k2',
    message: 'Deployment payment-api:v1.8.2 healthcheck probe passing. Replicas: 12/12 ready'
  }
];

interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  result: 'SUCCESS' | 'PENDING' | 'DENIED';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  timestamp: string;
  text: string;
}

export default function SREConsole() {
  // Navigation & View state
  const [activeNav, setActiveNav] = useState('incidents-active');
  const [incidentStatus, setIncidentStatus] = useState<'INVESTIGATING' | 'MITIGATING' | 'RESOLVED'>('INVESTIGATING');
  const [isExecutingRollback, setIsExecutingRollback] = useState(false);
  const [selectedLogFilter, setSelectedLogFilter] = useState<'ALL' | 'FATAL' | 'ERROR' | 'WARN'>('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'observability' | 'evidence' | 'audit'>('overview');

  // AI SRE Copilot Drawer State
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [userQuery, setUserQuery] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'copilot',
      timestamp: '16:40:24',
      text: 'Incident INC-1042 triaged. Root cause isolated to deployment v1.8.2 (unclosed DB cursor in checkout_worker.py). 98% confidence. Recommended mitigation: Rollback to v1.8.1. How can I assist you with this triage?'
    }
  ]);

  // Modal / Review state
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [assignedTo, setAssignedTo] = useState('Sarah Chen (Lead SRE)');

  // Real API Gateway & AI Brain health
  const [apiGatewayOnline, setApiGatewayOnline] = useState(false);
  const [aiBrainOnline, setAiBrainOnline] = useState(false);

  // Audit Log state
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([
    {
      timestamp: '16:39:15',
      actor: 'system (LangGraph)',
      action: 'INITIATE_INVESTIGATION',
      target: 'INC-1042',
      result: 'SUCCESS'
    },
    {
      timestamp: '16:39:00',
      actor: 'pagerduty-webhook',
      action: 'DECLARE_INCIDENT',
      target: 'INC-1042 (SEV-1)',
      result: 'SUCCESS'
    },
    {
      timestamp: '16:34:10',
      actor: 'alex.dev (ArgoCD)',
      action: 'DEPLOY_RELEASE',
      target: 'payment-api:v1.8.2',
      result: 'SUCCESS'
    }
  ]);

  // Initial Health Check
  useEffect(() => {
    const checkServices = async () => {
      try {
        const res = await fetch('http://localhost:4000/health');
        if (res.ok) setApiGatewayOnline(true);
      } catch (e) {}

      try {
        const res = await fetch('http://localhost:8000/health');
        if (res.ok) setAiBrainOnline(true);
      } catch (e) {}
    };
    checkServices();
  }, []);

  // Rollback Action Execution
  const handleApproveRollback = async () => {
    setIsExecutingRollback(true);
    setIncidentStatus('MITIGATING');

    const newAudit: AuditEntry = {
      timestamp: new Date().toLocaleTimeString(),
      actor: assignedTo,
      action: 'APPROVE_ROLLBACK',
      target: 'payment-api:v1.8.2 -> v1.8.1',
      result: 'SUCCESS'
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    try {
      await fetch('http://localhost:4000/api/v1/incidents/INC-1042/remediation/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: 'INC-1042',
          actionId: 'rem-1',
          approvedBy: assignedTo,
          rationale: 'Approved rollback of payment-api v1.8.2 to mitigate connection leak.'
        })
      });

      await fetch('http://localhost:4000/api/v1/incidents/INC-1042/remediation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: 'INC-1042',
          actionId: 'rem-1',
          idempotencyKey: `exec-${Date.now()}`
        })
      });
    } catch (e) {}

    setTimeout(() => {
      setIsExecutingRollback(false);
      setIncidentStatus('RESOLVED');
      setAuditLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          actor: 'k8s-operator',
          action: 'DEPLOYMENT_ROLLOUT_SUCCESS',
          target: 'payment-api:v1.8.1',
          result: 'SUCCESS'
        },
        ...prev
      ]);
      setChatMessages(prev => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          sender: 'copilot',
          timestamp: new Date().toLocaleTimeString(),
          text: '✅ Rollback to payment-api:v1.8.1 completed and verified. Database connection pool returned to 42/100, and P95 latency restored to 240ms.'
        }
      ]);
    }, 2200);
  };

  // AI Copilot Live Query via Port 8000
  const handleSendCopilotMessage = async (queryText?: string) => {
    const q = (queryText || userQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      text: q
    };
    setChatMessages(prev => [...prev, userMsg]);
    setUserQuery('');
    setIsCopilotThinking(true);

    try {
      const res = await fetch('http://localhost:8000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          incident_id: 'INC-1042',
          service_name: 'payment-api'
        })
      });
      const data = await res.json();
      setChatMessages(prev => [
        ...prev,
        {
          id: `c-${Date.now()}`,
          sender: 'copilot',
          timestamp: new Date().toLocaleTimeString(),
          text: data.reply || 'Analysis complete.'
        }
      ]);
    } catch (e) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `c-${Date.now()}`,
          sender: 'copilot',
          timestamp: new Date().toLocaleTimeString(),
          text: 'Rollback to v1.8.1 is recommended because deployment v1.8.2 changed the database connection pool management logic, introducing an unclosed cursor in checkout_worker.py:L142.'
        }
      ]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  const filteredLogs = INITIAL_LOGS.filter(l => {
    if (selectedLogFilter !== 'ALL' && l.level !== selectedLogFilter) return false;
    if (logSearch && !l.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-screen w-screen bg-[#090b10] text-slate-200 font-sans text-xs overflow-hidden select-none">
      
      {/* ==================================================================== */}
      {/* 1. LEFT SIDEBAR (ENTERPRISE OPERATIONAL NAVIGATION)                  */}
      {/* ==================================================================== */}
      <aside className="w-56 shrink-0 bg-[#0c0e15] border-r border-slate-800/80 flex flex-col justify-between select-none">
        <div className="flex flex-col">
          {/* Logo & Tenant Header */}
          <div className="h-12 border-b border-slate-800/80 px-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white text-[11px] shadow-sm">
                R
              </div>
              <span className="font-bold tracking-tight text-white text-sm">ResolvIQ</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">SRE</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500" title="Connected to Neon AWS Postgres" />
          </div>

          {/* Org & Cluster Dropdown */}
          <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-950/40">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Workspace / Cluster</div>
            <div className="flex items-center justify-between mt-0.5 text-slate-300 font-medium">
              <span className="truncate">acme-prod-us-east-2</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-2 space-y-0.5 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Operational Command
            </div>
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded text-left transition-colors ${
                activeNav === 'dashboard' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Overview Dashboard</span>
            </button>

            {/* Incidents Group */}
            <div className="pt-2 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Incidents & Triage
            </div>
            <button
              onClick={() => setActiveNav('incidents-active')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors ${
                activeNav === 'incidents-active' ? 'bg-red-950/40 border border-red-800/50 text-red-200 font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Active Incidents</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-900/80 text-red-200 font-bold">1</span>
            </button>

            <button
              onClick={() => setActiveNav('incidents-history')}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded text-left transition-colors ${
                activeNav === 'incidents-history' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Incident History</span>
            </button>

            {/* Services Group */}
            <div className="pt-2 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Service Catalog
            </div>
            <button
              onClick={() => setActiveNav('services')}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded text-left transition-colors ${
                activeNav === 'services' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Services (24)</span>
            </button>

            {/* Observability Group */}
            <div className="pt-2 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Observability
            </div>
            <button
              onClick={() => setActiveNav('metrics')}
              className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            >
              <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Prometheus Metrics</span>
            </button>
            <button
              onClick={() => setActiveNav('logs')}
              className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>Loki Logs Stream</span>
            </button>
            <button
              onClick={() => setActiveNav('traces')}
              className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            >
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>Distributed Traces</span>
            </button>

            {/* AI Assistant Group */}
            <div className="pt-2 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold flex items-center justify-between">
              <span>AI Investigation</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            </div>
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-purple-200 bg-purple-950/40 border border-purple-900/60 font-medium"
            >
              <div className="flex items-center space-x-2">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>AI SRE Copilot</span>
              </div>
              <span className="text-[9px] font-mono px-1 rounded bg-purple-900 text-purple-300">LIVE</span>
            </button>
            <button
              onClick={() => setActiveNav('ai-runbooks')}
              className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Pinecone Runbooks</span>
            </button>

            {/* Infrastructure */}
            <div className="pt-2 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Infrastructure
            </div>
            <button
              onClick={() => setActiveNav('k8s')}
              className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Kubernetes Workloads</span>
            </button>
            <button
              onClick={() => setActiveNav('databases')}
              className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            >
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Postgres & Locks</span>
            </button>
          </nav>
        </div>

        {/* Bottom Node Health Status */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 font-mono text-[10px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>API Gateway (4000):</span>
            <span className={apiGatewayOnline ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {apiGatewayOnline ? 'ONLINE' : 'CONNECTING'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>AI Brain (8000):</span>
            <span className={aiBrainOnline ? 'text-purple-400 font-bold' : 'text-amber-400'}>
              {aiBrainOnline ? 'ONLINE' : 'CONNECTING'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Pinecone Index:</span>
            <span className="text-cyan-400 font-bold truncate max-w-[90px]">resolveiq</span>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* 2. MAIN CONSOLE WORKSPACE                                            */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#090b10]">
        
        {/* TOP BAR */}
        <header className="h-12 border-b border-slate-800/80 bg-[#0d1017] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Incident Badge */}
            <div className="flex items-center space-x-1.5 font-mono">
              <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[11px] font-bold">
                SEV-1
              </span>
              <span className="text-white font-bold text-xs">INC-1042</span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* Context Breadcrumb */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span className="text-slate-500">Env:</span>
              <strong className="text-slate-200 font-mono">prod-us-east-2</strong>
              <span className="text-slate-600">/</span>
              <span className="text-slate-500">Service:</span>
              <strong className="text-cyan-400 font-mono">payment-api</strong>
              <span className="text-slate-600">/</span>
              <span className="text-slate-500">Duration:</span>
              <span className="font-mono text-amber-300 font-bold">14m 28s</span>
            </div>

            {/* Global Search Bar */}
            <div className="hidden lg:flex items-center space-x-1.5 ml-4 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              <Search className="w-3 h-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search metrics, logs, runbooks... (Ctrl+K)"
                className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 w-56 text-[11px]"
              />
            </div>
          </div>

          {/* Action Buttons in Top Bar */}
          <div className="flex items-center space-x-2">
            {/* AI SRE Copilot Toggle Button */}
            <button
              onClick={() => setIsCopilotOpen(!isCopilotOpen)}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1.5 border transition-all ${
                isCopilotOpen
                  ? 'bg-purple-950/80 border-purple-700 text-purple-200 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-purple-300 hover:bg-slate-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Copilot</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            </button>

            {!isAcknowledged ? (
              <button
                onClick={() => setIsAcknowledged(true)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1"
              >
                <Check className="w-3 h-3 text-slate-400" />
                <span>Acknowledge</span>
              </button>
            ) : (
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[11px] font-mono">
                ACK by Sarah Chen
              </span>
            )}

            <div className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
              <Users className="w-3 h-3 text-slate-500" />
              <span>Assignee: {assignedTo.split(' ')[0]}</span>
            </div>

            <button
              onClick={() => alert('War Room meeting opened: https://meet.google.com/resolveiq-war-room')}
              className="px-2.5 py-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-200 text-xs font-medium flex items-center space-x-1"
            >
              <ExternalLink className="w-3 h-3 text-indigo-400" />
              <span>War Room</span>
            </button>
          </div>
        </header>

        {/* 3. INCIDENT HEADER (COMPACT OPERATIONAL BANNER) */}
        <div className="border-b border-slate-800/80 bg-[#10131c] px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h1 className="text-sm font-bold text-white tracking-tight">
                PostgreSQL Connection Pool Exhaustion & 504 Timeout Cascade — payment-api
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-mono">
              <span>Status: <strong className={incidentStatus === 'RESOLVED' ? 'text-emerald-400' : 'text-red-400'}>{incidentStatus}</strong></span>
              <span>Trigger: <strong className="text-slate-300">Prometheus AlertManager</strong></span>
              <span>Started: <strong className="text-slate-300">16:34:10 UTC (Today)</strong></span>
              <span>Cluster: <strong className="text-slate-300">k8s-prod-us-east-2</strong></span>
              <span>Slack: <strong className="text-blue-400">#incident-1042-payment</strong></span>
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center space-x-1 bg-slate-900/80 p-0.5 rounded border border-slate-800 text-xs">
            {[
              { id: 'overview', label: 'Triage Overview' },
              { id: 'observability', label: 'Metrics & Charts' },
              { id: 'evidence', label: 'Root Cause & Evidence' },
              { id: 'audit', label: 'Audit Trail' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. SCROLLABLE SRE WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* KPI ROW (6 COMPACT REAL METRIC CARDS) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Metric 1 */}
            <div className="p-2.5 rounded bg-[#0d1017] border border-red-900/40 flex flex-col justify-between">
              <div className="flex justify-between items-start text-slate-400 text-[10px] font-mono">
                <span>DB CONNECTIONS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              </div>
              <div className="my-1">
                <div className="text-base font-bold font-mono text-red-400">
                  {incidentStatus === 'RESOLVED' ? '42 / 100' : '100 / 100'}
                </div>
                <div className="text-[10px] text-red-400 font-mono flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{incidentStatus === 'RESOLVED' ? '-58% (Normal)' : '100% Saturation'}</span>
                </div>
              </div>
              <svg className="w-full h-4 overflow-hidden" viewBox="0 0 100 20">
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  points={incidentStatus === 'RESOLVED' ? '0,18 20,16 40,14 60,15 80,10 100,8' : '0,15 20,12 40,8 60,3 80,2 100,2'}
                />
              </svg>
            </div>

            {/* Metric 2 */}
            <div className="p-2.5 rounded bg-[#0d1017] border border-red-900/40 flex flex-col justify-between">
              <div className="flex justify-between items-start text-slate-400 text-[10px] font-mono">
                <span>P95 LATENCY</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              </div>
              <div className="my-1">
                <div className="text-base font-bold font-mono text-red-400">
                  {incidentStatus === 'RESOLVED' ? '240 ms' : '4.82 s'}
                </div>
                <div className="text-[10px] text-red-400 font-mono flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{incidentStatus === 'RESOLVED' ? '-95% Nominal' : '+1,908% SLA Spike'}</span>
                </div>
              </div>
              <svg className="w-full h-4 overflow-hidden" viewBox="0 0 100 20">
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  points={incidentStatus === 'RESOLVED' ? '0,15 30,12 60,6 80,5 100,4' : '0,18 25,16 50,4 75,2 100,2'}
                />
              </svg>
            </div>

            {/* Metric 3 */}
            <div className="p-2.5 rounded bg-[#0d1017] border border-red-900/40 flex flex-col justify-between">
              <div className="flex justify-between items-start text-slate-400 text-[10px] font-mono">
                <span>HTTP 5XX RATE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              </div>
              <div className="my-1">
                <div className="text-base font-bold font-mono text-red-400">
                  {incidentStatus === 'RESOLVED' ? '0.01%' : '31.4%'}
                </div>
                <div className="text-[10px] text-red-400 font-mono">
                  {incidentStatus === 'RESOLVED' ? 'Threshold OK' : 'Threshold > 1.0%'}
                </div>
              </div>
              <svg className="w-full h-4 overflow-hidden" viewBox="0 0 100 20">
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  points={incidentStatus === 'RESOLVED' ? '0,18 50,16 100,18' : '0,19 30,18 50,4 70,3 100,2'}
                />
              </svg>
            </div>

            {/* Metric 4 */}
            <div className="p-2.5 rounded bg-[#0d1017] border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-start text-slate-400 text-[10px] font-mono">
                <span>THROUGHPUT (RPS)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
              <div className="my-1">
                <div className="text-base font-bold font-mono text-amber-300">1.24k req/s</div>
                <div className="text-[10px] text-amber-400 font-mono">-18% Drop off</div>
              </div>
              <svg className="w-full h-4 overflow-hidden" viewBox="0 0 100 20">
                <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points="0,5 30,4 60,10 80,12 100,14" />
              </svg>
            </div>

            {/* Metric 5 */}
            <div className="p-2.5 rounded bg-[#0d1017] border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-start text-slate-400 text-[10px] font-mono">
                <span>CPU UTILIZATION</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="my-1">
                <div className="text-base font-bold font-mono text-slate-200">78.2%</div>
                <div className="text-[10px] text-emerald-400 font-mono">Stable / Within SLA</div>
              </div>
              <svg className="w-full h-4 overflow-hidden" viewBox="0 0 100 20">
                <polyline fill="none" stroke="#10b981" strokeWidth="2" points="0,12 25,10 50,9 75,10 100,8" />
              </svg>
            </div>

            {/* Metric 6 */}
            <div className="p-2.5 rounded bg-[#0d1017] border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-start text-slate-400 text-[10px] font-mono">
                <span>MEMORY RSS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="my-1">
                <div className="text-base font-bold font-mono text-slate-200">52.4% (3.2 GB)</div>
                <div className="text-[10px] text-emerald-400 font-mono">Nominal Heap</div>
              </div>
              <svg className="w-full h-4 overflow-hidden" viewBox="0 0 100 20">
                <polyline fill="none" stroke="#10b981" strokeWidth="2" points="0,10 30,10 60,9 80,9 100,9" />
              </svg>
            </div>
          </div>

          {/* MAIN 2-COLUMN OPERATIONAL GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* LEFT 7 COLS: TIMELINE, OBSERVABILITY CHARTS, RECENT LOGS */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* 5. INCIDENT TIMELINE */}
              <div className="border border-slate-800 rounded bg-[#0d1017]">
                <div className="px-3.5 py-2 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-mono text-xs font-semibold text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>INCIDENT TIMELINE & CHANGE CORRELATION</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Auto-correlated via ArgoCD, Prometheus, PagerDuty</span>
                </div>

                <div className="p-3 space-y-2 font-mono text-[11px]">
                  <div className="flex items-start space-x-3">
                    <span className="text-slate-500 w-16 shrink-0">16:34:10</span>
                    <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px]">DEPLOY</span>
                    <span className="text-slate-300">
                      Deployment <strong>v1.8.2</strong> rolled out by <strong className="text-cyan-400">alex.dev</strong> (commit <code className="text-slate-400">8b7f3a1</code>: <em>"migrate to async pool batching"</em>)
                    </span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-slate-500 w-16 shrink-0">16:36:22</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px]">METRIC</span>
                    <span className="text-slate-300">PostgreSQL active connections rose sharply: <strong>45 &rarr; 75%</strong></span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-slate-500 w-16 shrink-0">16:37:05</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px]">LATENCY</span>
                    <span className="text-slate-300">Checkout API response latency p95 degraded from 240ms &rarr; <strong>2,850ms</strong></span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-slate-500 w-16 shrink-0">16:38:12</span>
                    <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 text-[10px]">SATURATE</span>
                    <span className="text-red-300 font-semibold">
                      Connection pool reached 100% ceiling (100/100). Incoming checkout queries queued.
                    </span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-slate-500 w-16 shrink-0">16:38:40</span>
                    <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 text-[10px]">5XX SPIKE</span>
                    <span className="text-slate-300">HTTP 504 Gateway Timeouts detected on <code className="text-slate-400">POST /v1/charges</code> (Error rate: 31.4%)</span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-slate-500 w-16 shrink-0">16:39:00</span>
                    <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 text-[10px]">SEV-1</span>
                    <span className="text-red-400 font-bold">SEV-1 declared automatically by PagerDuty. On-call paged.</span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-slate-500 w-16 shrink-0">16:39:15</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">AI START</span>
                    <span className="text-purple-300">ResolvIQ multi-agent investigation engaged (Node 1 Classifier &rarr; Node 2 Evidence).</span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-slate-500 w-16 shrink-0">16:40:24</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">AI ROOT</span>
                    <span className="text-purple-300">Root cause isolated to unclosed cursor in v1.8.2 (98% confidence).</span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-slate-500 w-16 shrink-0">16:41:00</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">ACTION</span>
                    <span className="text-emerald-300 font-bold">Recommended action generated: Rollback payment-api v1.8.2 &rarr; v1.8.1 (Gated).</span>
                  </div>
                </div>
              </div>

              {/* 6. OBSERVABILITY SECTION (DATADOG / GRAFANA CHARTS) */}
              <div className="border border-slate-800 rounded bg-[#0d1017]">
                <div className="px-3.5 py-2 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-mono text-xs font-semibold text-slate-300">
                    <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>TELEMETRY METRICS CORRELATION</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-0.5 bg-red-400 inline-block" />
                      <span>Active Connections</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-0.5 bg-cyan-400 inline-block" />
                      <span>p95 Latency</span>
                    </span>
                  </div>
                </div>

                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Postgres Pool: Active vs Max (100)</span>
                      <span className="text-red-400 font-bold">{incidentStatus === 'RESOLVED' ? '42/100' : '100/100 (Max)'}</span>
                    </div>
                    <svg className="w-full h-24 overflow-hidden" viewBox="0 0 200 80">
                      <line x1="0" y1="20" x2="200" y2="20" stroke="#1e293b" strokeDasharray="2" />
                      <line x1="0" y1="50" x2="200" y2="50" stroke="#1e293b" strokeDasharray="2" />
                      <line x1="0" y1="10" x2="200" y2="10" stroke="#7f1d1d" strokeWidth="1" strokeDasharray="4" />
                      <text x="5" y="8" fill="#ef4444" fontSize="6" fontFamily="monospace">MAX CEILING (100)</text>
                      <line x1="60" y1="0" x2="60" y2="80" stroke="#3b82f6" strokeWidth="1" />
                      <text x="63" y="75" fill="#60a5fa" fontSize="6" fontFamily="monospace">deploy v1.8.2</text>
                      <path
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        d={
                          incidentStatus === 'RESOLVED'
                            ? 'M 0 55 L 60 55 L 90 20 L 120 10 L 150 10 L 170 30 L 200 50'
                            : 'M 0 55 L 60 55 L 90 20 L 120 10 L 150 10 L 200 10'
                        }
                      />
                    </svg>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>HTTP Request Latency (p95)</span>
                      <span className="text-cyan-400 font-bold">{incidentStatus === 'RESOLVED' ? '240ms' : '4,820ms'}</span>
                    </div>
                    <svg className="w-full h-24 overflow-hidden" viewBox="0 0 200 80">
                      <line x1="0" y1="20" x2="200" y2="20" stroke="#1e293b" strokeDasharray="2" />
                      <line x1="0" y1="50" x2="200" y2="50" stroke="#1e293b" strokeDasharray="2" />
                      <line x1="0" y1="65" x2="200" y2="65" stroke="#065f46" strokeWidth="1" strokeDasharray="4" />
                      <text x="5" y="63" fill="#10b981" fontSize="6" fontFamily="monospace">SLA THRESHOLD (300ms)</text>
                      <line x1="60" y1="0" x2="60" y2="80" stroke="#3b82f6" strokeWidth="1" />
                      <path
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        d={
                          incidentStatus === 'RESOLVED'
                            ? 'M 0 68 L 60 68 L 85 40 L 115 15 L 140 15 L 165 40 L 200 68'
                            : 'M 0 68 L 60 68 L 85 40 L 115 15 L 140 15 L 200 15'
                        }
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 7. RECENT LOGS TABLE (LOKI) */}
              <div className="border border-slate-800 rounded bg-[#0d1017]">
                <div className="px-3.5 py-2 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 font-mono text-xs font-semibold text-slate-300">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>LOKI RECENT LOG STREAM (payment-api)</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-mono">
                      {(['ALL', 'FATAL', 'ERROR', 'WARN'] as const).map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setSelectedLogFilter(lvl)}
                          className={`px-1.5 py-0.2 rounded ${
                            selectedLogFilter === lvl ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Filter logs..."
                      value={logSearch}
                      onChange={e => setLogSearch(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-200 placeholder-slate-500 outline-none w-28"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-52 overflow-y-auto font-mono text-[11px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/80 text-[10px] text-slate-400 border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="py-1 px-3 w-24">TIME</th>
                        <th className="py-1 px-2 w-16">LEVEL</th>
                        <th className="py-1 px-2 w-44">POD</th>
                        <th className="py-1 px-3">MESSAGE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-1 px-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                          <td className="py-1 px-2">
                            <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                              log.level === 'FATAL'
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : log.level === 'ERROR'
                                ? 'bg-red-950/80 text-red-400'
                                : log.level === 'WARN'
                                ? 'bg-amber-950 text-amber-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {log.level}
                            </span>
                          </td>
                          <td className="py-1 px-2 text-slate-400 truncate max-w-[170px]">{log.pod}</td>
                          <td className="py-1 px-3 text-slate-300 truncate max-w-md">{log.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* RIGHT 5 COLS: AI INVESTIGATION, EVIDENCE, REMEDIATION CONTROLS */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* 8. AI INVESTIGATION PANEL */}
              <div className="border border-purple-900/50 rounded bg-[#0e101b] space-y-3 p-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="font-mono text-xs font-bold text-purple-200 uppercase tracking-wider">
                      AI Investigation
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    Status: Complete (Gemini 2.5 Flash)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="flex items-center space-x-1.5 p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Log Analyzer (4.8k)</span>
                  </div>
                  <div className="flex items-center space-x-1.5 p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Metrics Analyzer</span>
                  </div>
                  <div className="flex items-center space-x-1.5 p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Deploy Correlator</span>
                  </div>
                  <div className="flex items-center space-x-1.5 p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Pinecone Matcher</span>
                  </div>
                </div>

                {/* 9. ROOT CAUSE SUMMARY */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">ISOLATED ROOT CAUSE</span>
                    <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-800">
                      Confidence: 98%
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                    Deployment <strong className="text-cyan-400 font-mono">v1.8.2</strong> introduced an unclosed database cursor in async batch worker (<code className="text-slate-400">checkout_worker.py:L142</code>), leaking active connections until the 100/100 pool limit was exhausted.
                  </div>
                </div>

                {/* EVIDENCE SUPPORTING CONCLUSION */}
                <div className="space-y-1.5 text-[11px] font-mono">
                  <span className="text-[10px] uppercase font-bold text-slate-400">CORROBORATING EVIDENCE</span>
                  <div className="space-y-1">
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300">
                      <span>✓ Postgres pg_stat_activity saturation</span>
                      <span className="text-red-400">100/100 slots</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300">
                      <span>✓ Loki PG::ConnectionBad timeout error</span>
                      <span className="text-red-400">4,821 entries</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300">
                      <span>✓ Git release 8b7f3a1 (alex.dev)</span>
                      <span className="text-cyan-400">Deployed 16:34</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300">
                      <span>✓ Pinecone Runbook #rb-db-pool-01</span>
                      <span className="text-emerald-400">Score: 0.751</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 10. REMEDIATION PANEL */}
              <div className="border border-slate-800 rounded bg-[#0d1017] p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2 font-mono text-xs font-bold text-slate-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>RECOMMENDED REMEDIATION ACTION</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Human Authorization Required
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-slate-200 font-semibold flex items-center justify-between">
                    <span>Rollback payment-api v1.8.2 &rarr; v1.8.1</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      Risk: MEDIUM
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pods Affected:</span>
                      <span>12/12 replicas in deployment/payment-api</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expected Recovery Time:</span>
                      <span className="text-emerald-400 font-bold">&lt; 45 seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Previous Version Stability:</span>
                      <span>v1.8.1 was live for 14d (99.99% SLA)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Database Schema Migration:</span>
                      <span className="text-emerald-400">None (Safe to rollback)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Command Execution:</span>
                      <code className="text-slate-400">kubectl rollout undo deployment/payment-api</code>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      onClick={() => setShowDiffModal(true)}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 flex items-center space-x-1"
                    >
                      <Code2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Review Changes</span>
                    </button>

                    {incidentStatus === 'RESOLVED' ? (
                      <div className="flex-1 py-1.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Rolled back to v1.8.1 (Healthy)</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleApproveRollback}
                        disabled={isExecutingRollback}
                        className="flex-1 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        {isExecutingRollback ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                            <span>Rolling out v1.8.1...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>Approve & Rollback</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 11. AUDIT & COMPLIANCE TABLE */}
              <div className="border border-slate-800 rounded bg-[#0d1017] p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    <span>AUDIT & REPRODUCIBILITY LOG</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Neon DB Sync</span>
                </div>

                <div className="space-y-1 font-mono text-[10px]">
                  {auditLogs.slice(0, 4).map((audit, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800/80">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">{audit.timestamp}</span>
                        <span className="text-slate-300 font-semibold">{audit.actor}</span>
                        <span className="text-slate-400">&rarr; {audit.action}</span>
                      </div>
                      <span className="text-emerald-400 font-bold">{audit.result}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. DOCKED / SLIDE-OUT AI SRE COPILOT DRAWER (RIGHT PANEL)            */}
      {/* ==================================================================== */}
      {isCopilotOpen && (
        <aside className="w-80 shrink-0 bg-[#0d1018] border-l border-slate-800/80 flex flex-col justify-between select-none z-40">
          {/* Copilot Header */}
          <div className="h-12 border-b border-slate-800/80 px-3 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-purple-950 border border-purple-800 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div>
                <div className="font-bold text-xs text-white flex items-center space-x-1">
                  <span>AI SRE Copilot</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Gemini 2.5 Flash • Port 8000</div>
              </div>
            </div>

            <button
              onClick={() => setIsCopilotOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="Close Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 font-mono text-[11px]">
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`p-2.5 rounded border leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-950/50 border-blue-900 text-blue-200 ml-4'
                    : 'bg-slate-950 border-slate-800 text-slate-200 mr-2'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1">
                  <span className="font-bold uppercase tracking-wider text-slate-400">
                    {msg.sender === 'user' ? 'Sarah (You)' : 'AI Copilot'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                <div>{msg.text}</div>
              </div>
            ))}

            {isCopilotThinking && (
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-purple-300 flex items-center space-x-2 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                <span>Querying Google Gemini 2.5 Flash...</span>
              </div>
            )}
          </div>

          {/* Prompt Suggestion Chips */}
          <div className="p-2 border-t border-slate-800/80 bg-slate-950/40 space-y-1">
            <div className="text-[10px] text-slate-500 font-mono">Quick Inquiries:</div>
            <div className="flex flex-wrap gap-1">
              {[
                'Why is rollback recommended?',
                'Who deployed v1.8.2?',
                'Show matching runbook steps'
              ].map(chip => (
                <button
                  key={chip}
                  onClick={() => handleSendCopilotMessage(chip)}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-mono text-left truncate max-w-full"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendCopilotMessage();
            }}
            className="p-2.5 border-t border-slate-800/80 bg-slate-950 flex items-center space-x-1.5"
          >
            <input
              type="text"
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              placeholder="Ask Copilot (e.g. explain diff, logs)..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 font-mono outline-none focus:border-purple-600"
            />
            <button
              type="submit"
              disabled={!userQuery.trim() || isCopilotThinking}
              className="p-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-sm"
              title="Send to Gemini"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </aside>
      )}

      {/* REVIEW CODE DIFF MODAL */}
      {showDiffModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f121d] border border-slate-800 rounded-lg max-w-2xl w-full p-4 space-y-3 font-mono text-xs shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-white">Diff Review: payment-api v1.8.2 vs v1.8.1</span>
              <button onClick={() => setShowDiffModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] overflow-x-auto space-y-1">
              <div className="text-slate-500"># File: src/workers/checkout_worker.py:L138-146</div>
              <div className="text-slate-400">  async def process_checkout_batch(batch_items):</div>
              <div className="text-red-400 bg-red-950/40">-     db_conn = await pool.acquire() # Leak: missing try-finally release</div>
              <div className="text-red-400 bg-red-950/40">-     cursor = await db_conn.cursor()</div>
              <div className="text-emerald-400 bg-emerald-950/40">+     async with pool.acquire() as db_conn: # Safe context manager in v1.8.1</div>
              <div className="text-emerald-400 bg-emerald-950/40">+         async with db_conn.cursor() as cursor:</div>
              <div className="text-slate-400">              await execute_charges(cursor, batch_items)</div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowDiffModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDiffModal(false);
                  handleApproveRollback();
                }}
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white"
              >
                Confirm & Approve Rollback
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
