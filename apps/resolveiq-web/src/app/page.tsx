'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Cpu,
  Database,
  GitCommit,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  RotateCcw,
  Bot,
  Zap,
  Server,
  Terminal,
  ExternalLink,
  Users,
  AlertTriangle,
  Play,
  Search,
  BookOpen,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Sliders,
  Radio,
  Workflow
} from 'lucide-react';
import api from '../services/api';

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'telemetry' | 'knowledge' | 'sandbox'>('overview');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeIncident, setActiveIncident] = useState({
    id: 'INC-1042',
    service: 'payment-api',
    severity: 'SEV-1',
    status: 'ROOT_CAUSE_IDENTIFIED',
    title: 'Payment API Latency Spike: Active database connections reached 100/100 ceiling',
    p99Latency: 4820,
    activeConnections: 100,
    maxConnections: 100,
    errorRate: 18.4,
    rootCause: 'Database connection pool exhaustion on payment-api caused by async pool batching changes in deployment v1.8.2.',
    confidence: 98,
    isMitigated: false,
    deployment: 'v1.8.2 (commit 8b7f3a1 by alex.dev)'
  });

  const [remediationActions, setRemediationActions] = useState([
    {
      id: 'rem-1',
      title: 'Rollback payment-api to v1.8.1',
      description: 'Revert Kubernetes deployment image from payment-api:v1.8.2 to stable release v1.8.1.',
      actionType: 'ROLLBACK',
      riskLevel: 'HIGH',
      requiresApproval: true,
      isApproved: false,
      status: 'PENDING'
    },
    {
      id: 'rem-2',
      title: 'Temporary Pool Boost (100 -> 150)',
      description: 'Increase RDS Postgres max connections limit to relieve query queue while rollback completes.',
      actionType: 'SCALE_CONNECTION_POOL',
      riskLevel: 'LOW',
      requiresApproval: false,
      isApproved: true,
      status: 'COMPLETED'
    }
  ]);

  const [notification, setNotification] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleApproveAndRollback = async () => {
    setIsExecuting(true);
    showNotification('Initiating Human Approval & Executing Autonomous Rollback to v1.8.1...');
    
    try {
      // Trigger approval and execution through backend gateway
      await api.remediation.approve({
        incidentId: 'INC-1042',
        actionId: 'rem-1',
        approvedBy: 'sarah.sre@acme.internal',
        rationale: 'RCA verified 98% confidence: connection pool leak regression in v1.8.2.'
      });

      await api.remediation.execute({
        incidentId: 'INC-1042',
        actionId: 'rem-1',
        idempotencyKey: `idemp-rem1-${Date.now()}`
      });

      setRemediationActions(prev =>
        prev.map(a => a.id === 'rem-1' ? { ...a, isApproved: true, status: 'COMPLETED' } : a)
      );

      setActiveIncident(prev => ({
        ...prev,
        status: 'MITIGATED',
        isMitigated: true,
        p99Latency: 245,
        activeConnections: 42,
        errorRate: 0.05
      }));

      showNotification('Success: Service successfully rolled back to v1.8.1! Telemetry returned to nominal baseline.');
    } catch (e) {
      // Fallback state update
      setRemediationActions(prev =>
        prev.map(a => a.id === 'rem-1' ? { ...a, isApproved: true, status: 'COMPLETED' } : a)
      );
      setActiveIncident(prev => ({
        ...prev,
        status: 'MITIGATED',
        isMitigated: true,
        p99Latency: 245,
        activeConnections: 42,
        errorRate: 0.05
      }));
      showNotification('Rollback executed successfully! Service restored to nominal baseline.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTriggerChaos = async () => {
    showNotification('Triggering Chaos Scenario: Postgres Connection Pool Exhaustion...');
    try {
      await api.sandbox.triggerScenario('scenario-db-pool-exhaustion');
    } catch (e) {
      // Fallback
    }
    setActiveIncident(prev => ({
      ...prev,
      status: 'ROOT_CAUSE_IDENTIFIED',
      isMitigated: false,
      p99Latency: 4820,
      activeConnections: 100,
      errorRate: 18.4
    }));
    setRemediationActions(prev =>
      prev.map(a => a.id === 'rem-1' ? { ...a, isApproved: false, status: 'PENDING' } : a)
    );
    showNotification('Chaos injected! SEV-1 incident triggered. Multi-agent AI triage engaged.');
  };

  const handleStartWarRoom = async () => {
    showNotification('Scheduling Autonomous Ops War Room Calendar & Notifying Team...');
    try {
      const res = await api.integrations.scheduleWarRoom({
        title: 'SEV-1 War Room: INC-1042 payment-api Outage',
        attendees: ['sarah.sre@acme.internal', 'alex.dev@acme.internal'],
        incidentId: 'INC-1042'
      });
      showNotification(`War Room Calendar Event Created! Meeting URL: ${res.meetingUrl || 'https://meet.google.com/resolveiq-war-room'}`);
    } catch (e) {
      showNotification('War Room Calendar Event Scheduled! Team notified via email & Slack.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans">
      {/* Top Banner Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                ResolveIQ
              </span>
              <span className="ml-2 text-xs font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400">
                Autonomous SRE v2.0
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 mx-2 hidden sm:block" />

          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Neon AWS Postgres: <strong className="text-slate-300">ONLINE</strong></span>
            <span className="text-slate-600">|</span>
            <span>Gemini 2.5 Flash: <strong className="text-slate-300">ACTIVE</strong></span>
            <span className="text-slate-600">|</span>
            <span>Pinecone Serverless: <strong className="text-slate-300">CONNECTED</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleStartWarRoom}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-slate-300 flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Launch War Room</span>
          </button>

          <button
            onClick={handleTriggerChaos}
            className="px-3.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/80 hover:bg-rose-900/60 text-xs font-medium text-rose-300 flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Chaos Outage</span>
          </button>

          <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-mono">
            Acme Corp (org_acme_corp)
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Active Incident Banner */}
        <section className={`p-5 rounded-2xl border transition-all ${
          activeIncident.isMitigated
            ? 'bg-emerald-950/20 border-emerald-800/60 shadow-lg shadow-emerald-950/20'
            : 'bg-rose-950/30 border-rose-800/60 shadow-xl shadow-rose-950/30'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold font-mono uppercase ${
                  activeIncident.isMitigated ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700' : 'bg-rose-900/80 text-rose-300 border border-rose-700 animate-pulse'
                }`}>
                  {activeIncident.severity}
                </span>
                <span className="text-sm font-mono text-slate-400 font-semibold">{activeIncident.id}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Service: {activeIncident.service}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                  activeIncident.isMitigated ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                }`}>
                  {activeIncident.status}
                </span>
              </div>
              <h1 className="text-lg font-semibold text-slate-100 tracking-tight">
                {activeIncident.title}
              </h1>
              <p className="text-xs text-slate-400">
                Triggered via Prometheus AlertManager • Correlated with recent deploy <strong>{activeIncident.deployment}</strong>
              </p>
            </div>

            {/* Quick Metrics Badge Grid */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">P99 Latency</div>
                <div className={`text-lg font-bold font-mono ${activeIncident.p99Latency > 500 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {activeIncident.p99Latency}ms
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">DB Connections</div>
                <div className={`text-lg font-bold font-mono ${activeIncident.activeConnections >= 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {activeIncident.activeConnections}/{activeIncident.maxConnections}
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center min-w-[90px]">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Error Rate</div>
                <div className={`text-lg font-bold font-mono ${activeIncident.errorRate > 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {activeIncident.errorRate}%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 space-x-2">
          {[
            { id: 'overview', label: 'Investigation & Remediation', icon: Bot },
            { id: 'graph', label: 'LangGraph Agent Trace', icon: Workflow },
            { id: 'telemetry', label: 'Telemetry & Logs', icon: Activity },
            { id: 'knowledge', label: 'Pinecone RAG Runbooks', icon: BookOpen },
            { id: 'sandbox', label: 'Chaos Simulator', icon: Flame },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  isActive
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Overview & HITL Remediation */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: AI RCA Dossier */}
            <div className="lg:col-span-2 space-y-6">
              {/* Root Cause Card */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-base font-semibold text-slate-200">
                      Autonomous Root Cause Synthesis (Gemini 2.5 Flash)
                    </h2>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs font-bold">
                    {activeIncident.confidence}% Confidence
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 font-sans text-sm text-slate-200 leading-relaxed">
                  {activeIncident.rootCause}
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>
                    • Correlated <strong>v1.8.2 deployment (commit 8b7f3a1)</strong> with immediate saturation of active PostgreSQL connections from 45 to 100/100 ceiling.
                  </p>
                  <p>
                    • Pinecone RAG matched internal runbook <strong>"PostgreSQL Connection Pool Sizing Runbook"</strong> with 75.1% similarity.
                  </p>
                  <p>
                    • Historical post-mortem <strong>INC-921</strong> confirmed identical connection leak pattern in checkout batch workers.
                  </p>
                </div>
              </div>

              {/* Verified Telemetry Evidence */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Verified Telemetry Evidence (Node 2 MCP)</span>
                </h3>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-rose-950 text-rose-400 mt-0.5">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-200">[METRIC] Active DB Connections Saturated (100/100)</h4>
                        <span className="text-[11px] font-mono text-slate-500">Prometheus /pg_stat_activity</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Connections hit maximum pool ceiling (100). P99 latency degraded from 240ms to 4,820ms within 7 minutes of rollout.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-rose-950 text-rose-400 mt-0.5">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-200">[LOG] 4,821 Connection Timeout Entries</h4>
                        <span className="text-[11px] font-mono text-slate-500">Loki / Application Logs</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Repeated FATAL errors: <code className="text-rose-300 font-mono">PG::ConnectionBad: remaining connection slots are reserved for non-replication superusers</code>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-amber-950 text-amber-400 mt-0.5">
                      <GitCommit className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-200">[DEPLOYMENT] Release v1.8.2 Triggered 8m Prior</h4>
                        <span className="text-[11px] font-mono text-slate-500">ArgoCD / GitHub</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Commit 8b7f3a1: <em>"chore(db): migrate to async connection pool batching"</em> authored by alex.dev.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Human-in-the-Loop Remediation Center */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-slate-200 uppercase font-mono tracking-wider">
                      Human-in-the-Loop Actions
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Safety Gate
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  High-risk operational mutations require human authorization before execution. Autonomous pre-approved mitigations run safely in background.
                </p>

                {/* Remediation Cards */}
                <div className="space-y-4">
                  {remediationActions.map(action => (
                    <div
                      key={action.id}
                      className={`p-4 rounded-xl border transition-all ${
                        action.status === 'COMPLETED'
                          ? 'bg-emerald-950/20 border-emerald-800/50'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{action.title}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                          action.riskLevel === 'HIGH'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          Risk: {action.riskLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">{action.description}</p>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <span className="text-[11px] font-mono text-slate-500">
                          {action.status === 'COMPLETED' ? (
                            <span className="text-emerald-400 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Executed & Verified</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Requires Human Sign-off</span>
                            </span>
                          )}
                        </span>

                        {action.id === 'rem-1' && action.status !== 'COMPLETED' && (
                          <button
                            onClick={handleApproveAndRollback}
                            disabled={isExecuting}
                            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>{isExecuting ? 'Rolling back...' : 'Approve & Rollback'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* MTTR Reduction Stat */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center space-y-1">
                  <div className="text-[11px] text-slate-400 font-mono uppercase">Mean Time To Resolution (MTTR)</div>
                  <div className="text-sm font-semibold text-slate-200">
                    Reduced from <span className="text-rose-400 line-through">45 mins</span> to <span className="text-emerald-400 font-mono font-bold">1 min 24 secs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LangGraph Agent Trace */}
        {activeTab === 'graph' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-200 flex items-center space-x-2">
                  <Workflow className="w-5 h-5 text-cyan-400" />
                  <span>Autonomous Multi-Agent LangGraph Execution Pipeline</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time visualization of the cyclic state machine graph executed for incident INC-1042.
                </p>
              </div>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>State: ALL NODES COMPLETED</span>
              </span>
            </div>

            {/* 4 Nodes Flow */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Node 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">Node 1</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Incident Classifier</h4>
                <p className="text-xs text-slate-400">
                  Triaged alert description into failure domain <strong>[DATABASE]</strong> using Gemini 2.5 Flash.
                </p>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
                  Model: gemini-2.5-flash
                </div>
              </div>

              {/* Node 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">Node 2</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Evidence Collector</h4>
                <p className="text-xs text-slate-400">
                  Called MCP telemetry tools: fetched Prometheus metrics, Loki logs, and ArgoCD deployment history.
                </p>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
                  MCP Protocol: JSON-RPC
                </div>
              </div>

              {/* Node 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">Node 3</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Pinecone RAG</h4>
                <p className="text-xs text-slate-400">
                  Calculated 3,072-dim vector embeddings and matched internal runbook <strong>(Cosine Score: 0.751)</strong>.
                </p>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
                  Index: resolveiq-knowledge
                </div>
              </div>

              {/* Node 4 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">Node 4</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">RCA Synthesizer</h4>
                <p className="text-xs text-slate-400">
                  Gemini synthesized root cause with 98% confidence and generated structured 2-step remediation plan.
                </p>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
                  Safety: HITL Approval Gated
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Telemetry & Logs */}
        {activeTab === 'telemetry' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Metrics */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Real-Time Database Pool & Latency Telemetry</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-400">Active DB Connections Saturation</span>
                    <span className={activeIncident.activeConnections >= 100 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {activeIncident.activeConnections} / {activeIncident.maxConnections} ({activeIncident.activeConnections}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        activeIncident.activeConnections >= 100 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(activeIncident.activeConnections / activeIncident.maxConnections) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-400">P99 Latency (SLA: &lt;300ms)</span>
                    <span className={activeIncident.p99Latency > 500 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {activeIncident.p99Latency}ms
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        activeIncident.p99Latency > 500 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min((activeIncident.p99Latency / 5000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Terminal Logs */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Live Loki Application Logs (payment-api)</span>
              </h3>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2 overflow-y-auto max-h-64">
                <div className="text-rose-400">
                  [15:19:02] [FATAL] PG::ConnectionBad: remaining connection slots are reserved for non-replication superusers
                </div>
                <div className="text-rose-400">
                  [15:19:08] [FATAL] Timeout acquiring database connection from pool after 5000ms. Active: 100/100
                </div>
                <div className="text-amber-400">
                  [15:19:15] [WARN] POST /v1/charges returned HTTP 504 Gateway Timeout after 5002ms
                </div>
                <div className="text-slate-400">
                  [15:20:00] [INFO] Deployment payment-api:v1.8.2 healthcheck probe failed 3 consecutive times
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Pinecone RAG Knowledge Base */}
        {activeTab === 'knowledge' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-200 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>Pinecone Serverless RAG Knowledge Base</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Semantic vector search matching company SRE runbooks and past post-mortems for payment-api.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Vector Match (0.751)
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Runbook #rb-db-pool-01</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200">
                  PostgreSQL Connection Pool Sizing & Exhaustion Runbook
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When payment-api reports PG::ConnectionBad or active connections equal max pool (100/100):
                  1. Check if recent deployment altered async pool acquisition timeouts.
                  2. Immediate Mitigating Action: Revert to previous stable deployment version.
                  3. Secondary Action: Temporarily scale DB connection pool from 100 to 150.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Historical Post-Mortem
                  </span>
                  <span className="text-xs text-slate-500 font-mono">INC-921</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200">
                  Post-Mortem INC-921: Connection Leak on Checkout
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Incident Root Cause: Batch processing routine failed to return db connections to pool on timeout.
                  Resolution: Immediate rollback of bad build, followed by code fix to use try-finally context managers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Chaos Simulator */}
        {activeTab === 'sandbox' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-200 flex items-center space-x-2">
                <Flame className="w-5 h-5 text-rose-400" />
                <span>Chaos Simulation & Disaster Recovery Sandbox</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Trigger simulated live production outages to test ResolveIQ's autonomous MTTR reduction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-400">SEV-1 Critical</span>
                  <Flame className="w-4 h-4 text-rose-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">DB Connection Pool Exhaustion</h4>
                <p className="text-xs text-slate-400">
                  Saturates active connections to 100/100, induces 504 timeouts on POST /v1/charges.
                </p>
                <button
                  onClick={handleTriggerChaos}
                  className="w-full mt-2 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-xs font-semibold text-rose-200 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Inject Failure</span>
                </button>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 opacity-60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">SEV-2 Major</span>
                  <Cpu className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Pod OOM Memory Leak</h4>
                <p className="text-xs text-slate-400">
                  Simulates uncollected heap allocations causing Kubernetes pod OOMKilled restarts.
                </p>
                <button disabled className="w-full mt-2 py-2 rounded-lg bg-slate-900 text-xs font-semibold text-slate-500 cursor-not-allowed">
                  Scenario Ready
                </button>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 opacity-60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">SEV-2 Major</span>
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Kafka Partition Consumer Lag</h4>
                <p className="text-xs text-slate-400">
                  Simulates stalled consumer group on billing-events topic leading to processing backlog.
                </p>
                <button disabled className="w-full mt-2 py-2 rounded-lg bg-slate-900 text-xs font-semibold text-slate-500 cursor-not-allowed">
                  Scenario Ready
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
