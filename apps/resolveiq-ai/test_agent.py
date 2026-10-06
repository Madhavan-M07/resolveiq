import asyncio
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from src.agents.state import InvestigationState
from src.agents.graph import orchestrator

async def main():
    print("\n" + "=" * 70)
    print("      ResolveIQ Autonomous Incident Resolution Agent Test Runner     ")
    print("=" * 70 + "\n")

    # 1. Prepare raw incident alert input
    initial_incident_state: InvestigationState = {
        "incident_id": "INC-1042",
        "service_name": "payment-api",
        "severity": "SEV-1",
        "description": "Payment API Latency Spike: Active database connections reached 100/100 ceiling. 504 timeouts on POST /v1/charges.",
        "incident_type": "UNKNOWN",
        "current_node": "START",
        "steps_taken": [],
        "metrics_summary": {},
        "logs_summary": [],
        "recent_deployments": [],
        "matched_runbooks": [],
        "similar_incidents": [],
        "evidence_list": [],
        "root_cause": None,
        "confidence_score": 0.0,
        "detailed_analysis": None,
        "remediation_plan": [],
        "needs_human_approval": False,
        "is_mitigated": False,
    }

    # 2. Run the LangGraph multi-agent pipeline
    final_state = await orchestrator.run_investigation(initial_incident_state)

    # 3. Print the final executive investigation result
    print("=" * 70)
    print(f"[DOSSIER] FINAL INCIDENT REPORT: {final_state['incident_id']} ({final_state['service_name']})")
    print("=" * 70)
    print(f"* Domain Classification : {final_state['incident_type']}")
    print(f"* Root Cause Analysis   : {final_state['root_cause']}")
    print(f"* Confidence Score      : {int(final_state['confidence_score'] * 100)}%")
    print(f"* Human-in-the-Loop     : {'REQUIRED (High-risk action flagged)' if final_state['needs_human_approval'] else 'Autonomous'}")
    
    print("\n[EVIDENCE] Verified Evidence Collected:")
    for ev in final_state["evidence_list"]:
        print(f"   [+] [{ev['type']}] {ev['title']} (Source: {ev['source']})")

    print("\n[RUNBOOKS] Matched Internal Runbooks (Pinecone RAG):")
    for rb in final_state["matched_runbooks"]:
        print(f"   [DOC] {rb['title']} (Score: {rb['pineconeScore']})")

    print("\n[ACTIONS] Proposed Remediation Plan:")
    for rem in final_state["remediation_plan"]:
        approval_str = "Requires Human Sign-off" if rem["requiresApproval"] else "Pre-approved"
        print(f"   [!] [{rem['actionType']}] {rem['title']} - Risk: {rem['riskLevel']} ({approval_str})")

    print("\n" + "=" * 70 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
