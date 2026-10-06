import os
import sys
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

from src.agents.state import InvestigationState
from src.agents.graph import orchestrator
from src.rag.pinecone_client import PineconeRAGClient

app = FastAPI(title="ResolveIQ AI Brain", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Pinecone Vector Client
rag_client = PineconeRAGClient()

class InvestigateRequest(BaseModel):
    incident_id: str = "INC-1042"
    service_name: str = "payment-api"
    severity: str = "SEV-1"
    description: str = "Payment API Latency Spike: Active database connections reached 100/100 ceiling. 504 timeouts on POST /v1/charges."

class ChatRequest(BaseModel):
    query: str
    incident_id: str = "INC-1042"
    service_name: str = "payment-api"

@app.get("/health")
def health():
    return {
        "status": "OK",
        "service": "resolveiq-ai",
        "gemini_model": os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest"),
        "pinecone_index": os.getenv("PINECONE_INDEX_NAME", "resolveiq-knowledge"),
        "pinecone_connected": rag_client.is_connected
    }

@app.post("/api/v1/investigate")
async def investigate(req: InvestigateRequest):
    initial_state: InvestigationState = {
        "incident_id": req.incident_id,
        "service_name": req.service_name,
        "severity": req.severity,
        "description": req.description,
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
    final_state = await orchestrator.run_investigation(initial_state)
    return final_state

@app.post("/api/v1/chat")
async def chat(req: ChatRequest):
    q_lower = req.query.strip().lower()
    is_greeting = q_lower in {"hi", "hello", "hey", "hola", "greetings", "good morning", "good evening", "good afternoon"} or len(q_lower) <= 2

    gemini_key = os.getenv("GEMINI_API_KEY")
    matched_docs = []

    # 1. For technical queries, fetch relevant runbooks via Pinecone Vector Search (2.0s timeout)
    if not is_greeting:
        try:
            matched_docs = await asyncio.wait_for(
                asyncio.to_thread(rag_client.query_similar_documents, req.query, req.service_name, 2),
                timeout=2.0
            )
        except Exception as e:
            print(f"[WARN] Pinecone RAG lookup timed out or failed: {e}")
            matched_docs = rag_client.knowledge_base_documents[:2]

    doc_context = ""
    if matched_docs:
        doc_context = "\n".join([f"- [{d.get('id', 'doc')}] {d.get('title', '')}: {d.get('content', '')}" for d in matched_docs])

    # 2. Call Google Gemini AI dynamically for ALL queries
    if gemini_key:
        import google.generativeai as genai
        genai.configure(api_key=gemini_key)

        primary_model = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
        candidate_models = [primary_model, "gemini-flash-latest"]

        if is_greeting:
            prompt = f"""You are the ResolveIQ Autonomous AI SRE Copilot investigating production incident {req.incident_id} on microservice '{req.service_name}'.
LIVE SITUATION: PostgreSQL Connection Pool Saturation (100/100 connections), P95 latency degraded to 4.82s (+1,908%) following deployment v1.8.2.

USER GREETING:
{req.query}

INSTRUCTIONS:
Respond authoritatively and concisely as the SRE AI Copilot in 1-2 sentences. Greet the engineer, mention the active incident ({req.incident_id} on {req.service_name}), and ask how you can assist."""
        else:
            prompt = f"""You are the ResolveIQ Autonomous AI SRE Copilot investigating production incident {req.incident_id} on microservice '{req.service_name}'.

LIVE OPERATIONAL TELEMETRY & CONTEXT:
- Domain: PostgreSQL Connection Pool Saturation
- Cluster: prod-us-east-2 (AWS RDS Multi-AZ)
- Current Metrics: 100/100 active connections (ceiling reached), 4.82s P95 latency (+1,908% spike), 31.4% HTTP 504 Gateway Timeouts
- Git Deploy Metadata: Commit 8b7f3a1 by alex.dev ('chore(db): migrate to async connection pool batching') deployed 35 mins ago
- Root Cause: Unclosed database cursor in async worker (checkout_worker.py:L142) leaking active connections
- Recommended Remediation: Immediate automated rollback of payment-api v1.8.2 -> v1.8.1

RELEVANT PINECONE VECTOR RUNBOOKS:
{doc_context if doc_context else "No direct runbook match."}

ENGINEER'S QUESTION:
{req.query}

INSTRUCTIONS:
Provide an authoritative, technical, concise SRE diagnosis in 2-3 sentences. Cite specific metrics, commit hashes, or runbook steps where relevant. Do not include meta commentary or API error notices."""

        def _call_gemini(m_name: str) -> Optional[str]:
            m = genai.GenerativeModel(m_name)
            resp = m.generate_content(prompt)
            if resp and resp.text:
                return resp.text.strip()
            return None

        for model_name in candidate_models:
            try:
                reply_text = await asyncio.wait_for(
                    asyncio.to_thread(_call_gemini, model_name),
                    timeout=5.0
                )
                if reply_text:
                    return {
                        "reply": reply_text,
                        "source": f"Live Gemini AI ({model_name})" + (" + Pinecone RAG" if matched_docs else ""),
                        "pinecone_matches": [d.get("id") for d in matched_docs if d.get("id")]
                    }
            except Exception as e:
                print(f"[WARN] Gemini model {model_name} failed: {e}")
                continue

    # 3. Fallback only if Gemini network is disconnected
    fallback_text = (
        f"Hello! I am ResolveIQ AI Copilot monitoring incident {req.incident_id} on {req.service_name}. How can I assist you with the triage?"
        if is_greeting else
        f"Incident {req.incident_id} analysis on {req.service_name}: Deployment v1.8.2 (commit 8b7f3a1) introduced an unclosed cursor in checkout_worker.py:L142, saturating active connections at 100/100. Recommend immediate rollback to v1.8.1."
    )
    return {
        "reply": fallback_text,
        "source": "Local Fallback",
        "pinecone_matches": [d.get("id") for d in matched_docs if d.get("id")]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
