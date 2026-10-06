from ..state import InvestigationState

async def classify_incident_node(state: InvestigationState) -> InvestigationState:
    """
    Node 1: Incident Classifier
    Inspects the incident title and description to determine the failure domain:
    - DATABASE (Connection pool leaks, lock contention, query timeouts)
    - INFRASTRUCTURE (CPU saturation, OOM container kills, disk exhaustion)
    - NETWORK (DNS resolution failure, Ingress drop, circuit breaker trips)
    - APPLICATION (Unhandled exceptions, null pointer crashes, 5xx bugs)
    """
    incident_id = state.get("incident_id", "INC-UNKNOWN")
    service_name = state.get("service_name", "unknown-service")
    description = state.get("description", "")

    print(f"🤖 [Node 1: Classifier] Evaluating incident {incident_id} ({service_name})...")

    # Combine text for evaluation
    eval_text = (f"{incident_id} {service_name} {description}").lower()

    # Domain classification heuristic (can also call local Ollama / Gemini model)
    if any(k in eval_text for k in ["connection", "pool", "database", "postgres", "sql", "pg::", "exhaustion", "lock"]):
        incident_type = "DATABASE"
    elif any(k in eval_text for k in ["oom", "memory", "cpu", "throttle", "pod", "evicted"]):
        incident_type = "INFRASTRUCTURE"
    elif any(k in eval_text for k in ["dns", "gateway", "ingress", "network", "packet"]):
        incident_type = "NETWORK"
    else:
        incident_type = "APPLICATION"

    # 1. Update the shared LangGraph memory chart
    state["incident_type"] = incident_type
    state["current_node"] = "CLASSIFIER_NODE"

    if "steps_taken" not in state or state["steps_taken"] is None:
        state["steps_taken"] = []
    state["steps_taken"].append(f"Node 1: Categorized incident domain as [{incident_type}]")

    print(f"✅ [Node 1: Classifier] Complete: Categorized as [{incident_type}]. Passing state to Node 2.")
    return state
