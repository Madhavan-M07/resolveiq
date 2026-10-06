'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Server,
  Activity,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  Play,
  TrendingDown,
  Lock,
  GitBranch,
  Database
} from 'lucide-react';
import api from '../services/api';

export default function ResolveIQDashboard() {
  // Incident State
  const [incidentState, setIncidentState] = useState<'CRITICAL' | 'RESOLVING' | 'RESOLVED'>('CRITICAL');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [actionProgress, setActionProgress] = useState<string>('');

  // Handle Rollback Approval
  const handleApproveRollback = async () => {
    setIncidentState('RESOLVING');
    setActionProgress('Verifying human approval with audit trail...');
    
    setTimeout(() => {
      setActionProgress('Reverting payment-api deployment to stable version v1.8.1...');
    }, 900);

    setTimeout(() => {
      setActionProgress('Flushing stuck database connections & verifying health check...');
    }, 1800);

    setTimeout(() => {
      setIncidentState('RESOLVED');
      setActionProgress('');
    }, 2800);

    // Call backend API in background for audit logging
    try {
      await api.remediation.approve({
        incidentId: 'INC-1042',
        actionId: 'rem-1',
        approvedBy: 'on-call-engineer@acme.com',
        rationale: 'Approved automated rollback to restore customer checkout.'
      });
      await api.remediation.execute({
        incidentId: 'INC-1042',
        actionId: 'rem-1',
        idempotencyKey: `exec-${Date.now()}`
      });
    } catch (e) {
      // Background logging fallback
    }
  };

  // Handle Simulate Outage
  const handleSimulateOutage = async () => {
    setIncidentState('CRITICAL');
    setActionProgress('');
    try {
      await api.sandbox.triggerScenario('scenario-db-pool-exhaustion');
    } catch (e) {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      
      {/* 1. TOP HEADER */}
      <header className="border-b border-slate-800/80 bg-[#0d1322] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">ResolveIQ</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-medium">
                AI Incident Assistant
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Production Incident Triage & Resolution
            </p>
          </div>
        </div>

        {/* Demo Controls Bar */}
        <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="text-xs text-slate-400 font-medium hidden md:inline">Interactive Demo:</span>
          
          <button
            onClick={handleSimulateOutage}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Outage</span>
          </button>

          <button
            onClick={() => setIncidentState('RESOLVED')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reset Demo</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">

        {/* INCIDENT STATUS HERO BANNER */}
        <div className={`p-6 rounded-2xl border transition-all ${
          incidentState === 'RESOLVED'
            ? 'bg-emerald-950/20 border-emerald-800/60 shadow-xl shadow-emerald-950/20'
            : incidentState === 'RESOLVING'
            ? 'bg-cyan-950/20 border-cyan-800/60 shadow-xl shadow-cyan-950/20 animate-pulse'
            : 'bg-rose-950/20 border-rose-800/60 shadow-xl shadow-rose-950/20'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-xl mt-1 ${
                incidentState === 'RESOLVED'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : incidentState === 'RESOLVING'
                  ? 'bg-cyan-500/20 text-cyan-400 animate-spin'
                  : 'bg-rose-500/20 text-rose-400 animate-pulse'
              }`}>
                {incidentState === 'RESOLVED' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : incidentState === 'RESOLVING' ? (
                  <RotateCcw className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    incidentState === 'RESOLVED'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                      : 'bg-rose-900/60 text-rose-300 border border-rose-700'
                  }`}>
                    {incidentState === 'RESOLVED' ? 'All Systems Healthy' : 'Active SEV-1 Outage'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Incident #INC-1042</span>
                </div>

                <h1 className="text-xl font-bold text-white mt-1.5">
                  {incidentState === 'RESOLVED'
                    ? 'Payment Service Restored to 100% Normal Operation'
                    : 'Payment API Outage: Customers Unable to Complete Checkout'}
                </h1>
                
                <p className="text-sm text-slate-300 mt-1">
                  {incidentState === 'RESOLVED'
                    ? 'Service successfully rolled back to v1.8.1. Latency and database connections returned to nominal baselines.'
                    : 'The payment system is failing with 504 timeout errors. ResolveIQ AI investigated and prepared a fix.'}
                </p>
              </div>
            </div>

            {/* Quick Time Counter */}
            <div className="px-5 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-right min-w-[150px]">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">MTTR (Resolution Time)</div>
              <div className={`text-2xl font-bold font-mono ${
                incidentState === 'RESOLVED' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {incidentState === 'RESOLVED' ? '1m 24s' : 'Ongoing'}
              </div>
              <div className="text-[11px] text-slate-400">
                {incidentState === 'RESOLVED' ? 'Saved 43 mins of downtime' : 'Automating triage'}
              </div>
            </div>
          </div>
        </div>

        {/* 3-STEP STORY CARDS (THE CORE USER EXPERIENCE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* STEP 1: WHAT BROKE? */}
          <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
                <span>Step 1: The Problem</span>
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold">1</span>
              </div>
              <h3 className="text-base font-semibold text-white">What broke?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                PostgreSQL database ran out of connection slots, causing payment requests to time out.
              </p>

              {/* Visual Health Gauges */}
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Database Capacity:</span>
                    <span className={incidentState === 'RESOLVED' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {incidentState === 'RESOLVED' ? '42 / 100 slots (Nominal)' : '100 / 100 (Full & Blocked)'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        incidentState === 'RESOLVED' ? 'w-[42%] bg-emerald-500' : 'w-full bg-rose-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Checkout Response Time:</span>
                    <span className={incidentState === 'RESOLVED' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {incidentState === 'RESOLVED' ? '240 ms (Fast)' : '4,820 ms (Crashing)'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        incidentState === 'RESOLVED' ? 'w-[15%] bg-emerald-500' : 'w-[95%] bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Service: <strong>payment-api</strong></span>
              <span className="text-rose-400 font-semibold">{incidentState === 'RESOLVED' ? 'Nominal' : '504 Timeouts'}</span>
            </div>
          </div>

          {/* STEP 2: WHAT CAUSED IT? */}
          <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
                <span>Step 2: AI Investigation</span>
                <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold">2</span>
              </div>
              <h3 className="text-base font-semibold text-white flex items-center space-x-1.5">
                <span>What caused it?</span>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <strong>Deployment v1.8.2</strong> introduced a database connection leak 8 minutes ago, exhausting all available server connections.
              </p>

              {/* Verified Evidence Badges */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span><strong>AI Confidence:</strong> 98% (Gemini 2.5 Flash)</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span><strong>Code Deploy:</strong> Commit <code>8b7f3a1</code> by alex.dev</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span><strong>Runbook Match:</strong> DB Pool Runbook (Pinecone)</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Investigation: <strong>Autonomous</strong></span>
              <span className="text-cyan-400 font-medium">Root Cause Proven</span>
            </div>
          </div>

          {/* STEP 3: HOW DO WE FIX IT? */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#10172a] to-[#0d1322] border border-cyan-500/30 flex flex-col justify-between space-y-4 shadow-lg shadow-cyan-950/20">
            <div>
              <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-2">
                <span>Step 3: Solution & Action</span>
                <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">3</span>
              </div>
              <h3 className="text-base font-semibold text-white">How do we fix it?</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Revert the faulty <strong>v1.8.2</strong> release back to stable <strong>v1.8.1</strong>.
              </p>

              {/* Safety Gate Warning */}
              <div className="mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-200 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Gate:</strong> Production rollbacks require human confirmation to prevent unintended disruption.
                </span>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <div>
              {incidentState === 'RESOLVED' ? (
                <div className="w-full py-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Successfully Rolled Back to v1.8.1</span>
                </div>
              ) : incidentState === 'RESOLVING' ? (
                <div className="w-full py-3 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-200 text-xs font-semibold flex items-center justify-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>{actionProgress || 'Executing Rollback...'}</span>
                </div>
              ) : (
                <button
                  onClick={handleApproveRollback}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Approve & Rollback to v1.8.1</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. EXPANDABLE TECHNICAL DETAILS (FOR ENGINEERS & SREs) */}
        <div className="border border-slate-800 rounded-2xl bg-[#0d1322] overflow-hidden">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Layers className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">
                  Technical Deep-Dive: Multi-Agent AI Trace & Telemetry Evidence
                </h4>
                <p className="text-xs text-slate-400">
                  Inspect the exact LangGraph agent reasoning steps, Pinecone cosine similarity vectors, and server logs.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
              <span>{showTechnicalDetails ? 'Hide details' : 'Show details'}</span>
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showTechnicalDetails && (
            <div className="p-6 border-t border-slate-800 space-y-6 bg-slate-950/60">
              {/* Agent Flow Timeline */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Autonomous Multi-Agent Workflow (LangGraph)
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-cyan-400">
                      <span>Node 1: Classifier</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-slate-300">Categorized alert as <strong>[DATABASE]</strong> domain using Gemini 2.5 Flash.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-cyan-400">
                      <span>Node 2: Telemetry</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-slate-300">Queried Prometheus & Loki: verified 100/100 connection pool exhaustion.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-cyan-400">
                      <span>Node 3: Pinecone RAG</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-slate-300">Matched internal DB runbook (Score: 0.751) and past post-mortem INC-921.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-cyan-400">
                      <span>Node 4: Synthesizer</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-slate-300">Formulated 98% confident RCA and triggered Human-in-the-Loop approval gate.</p>
                  </div>
                </div>
              </div>

              {/* Raw Logs Snippet */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Raw Application Logs (Loki)
                </h5>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                  <div className="text-rose-400">[15:19:02] [FATAL] PG::ConnectionBad: remaining connection slots are reserved for non-replication superusers</div>
                  <div className="text-rose-400">[15:19:08] [FATAL] Timeout acquiring database connection from pool after 5000ms. Active: 100/100</div>
                  <div className="text-amber-400">[15:19:15] [WARN] POST /v1/charges returned HTTP 504 Gateway Timeout after 5002ms</div>
                </div>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
