import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

from src.agents.state import InvestigationState
from src.agents.graph import orchestrator

app = FastAPI(title="ResolveIQ AI Brain", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        "gemini_model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        "pinecone_index": os.getenv("PINECONE_INDEX_NAME", "resolveiq-knowledge")
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
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = f"""You are ResolveIQ AI SRE Copilot investigating production incident {req.incident_id} on service '{req.service_name}'.
Incident Context:
- Domain: DATABASE
- Active connections: 100/100 saturation
- P99 latency degraded to 4,820ms
- Root cause: Deployment v1.8.2 (commit 8b7f3a1 by alex.dev) altered async connection pool batching, causing connection exhaustion.
- Pinecone RAG matched: 'PostgreSQL Connection Pool Sizing & Exhaustion Runbook' (Score: 0.751).
- Recommended action: Rollback to stable v1.8.1.

User Question: {req.query}

Answer concisely, technically accurate, and helpfully as an expert SRE in 2-3 sentences.
"""
        response = model.generate_content(prompt)
        return {"reply": response.text.strip()}
    except Exception as e:
        return {"reply": f"Gemini Analysis: Root cause on {req.service_name} is connection pool exhaustion caused by regression in deployment v1.8.2. Rollback to v1.8.1 is recommended to restore SLA. ({e})"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
