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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
