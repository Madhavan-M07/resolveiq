from typing import TypedDict, List, Dict, Any, Optional

class EvidenceItem(TypedDict):
    id: str
    type: str # METRIC, LOG, DEPLOYMENT, RUNBOOK, PAST_INCIDENT
    title: str
    description: str
    confidence: float
    source: str
    timestamp: str

class RemediationPlan(TypedDict):
    id: str
    title: str
    description: str
    actionType: str # ROLLBACK, SCALE_CONNECTION_POOL, RESTART_POD
    targetService: str
    targetPayload: Dict[str, Any]
    riskLevel: str # LOW, MEDIUM, HIGH
    requiresApproval: bool
    isApproved: bool

class InvestigationState(TypedDict):
    incident_id: str
    service_name: str
    severity: str
    description: str
    
    # State flags
    incident_type: str # APPLICATION, INFRASTRUCTURE, NETWORK, UNKNOWN
    current_node: str
    steps_taken: List[str]
    
    # Collected Evidence
    metrics_summary: Dict[str, Any]
    logs_summary: List[Dict[str, Any]]
    recent_deployments: List[Dict[str, Any]]
    matched_runbooks: List[Dict[str, Any]]
    similar_incidents: List[Dict[str, Any]]
    
    # Root Cause Output
    root_cause: Optional[str]
    confidence_score: float # 0.0 to 1.0
    detailed_analysis: Optional[str]
    evidence_list: List[EvidenceItem]
    remediation_plan: List[RemediationPlan]
    
    # Human in the loop
    needs_human_approval: bool
    is_mitigated: bool
