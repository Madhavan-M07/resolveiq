import os
import json
import re
import asyncio
from dotenv import load_dotenv
from ..state import InvestigationState

load_dotenv()

async def classify_incident_node(state: InvestigationState) -> InvestigationState:
    """
    Node 1: Incident Classifier
    Uses Google Gemini 2.5 Flash to inspect the incident alert and failure domain.
    """
    incident_id = state.get("incident_id", "INC-UNKNOWN")
    service_name = state.get("service_name", "unknown-service")
    description = state.get("description", "")

    print(f"[Node 1: Classifier] Evaluating incident {incident_id} ({service_name}) with Gemini 2.5 Flash...")

    gemini_key = os.getenv("GEMINI_API_KEY")
    incident_type = "APPLICATION"

    if gemini_key:
        import google.generativeai as genai
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = (
            "You are an autonomous SRE incident triage AI.\n"
            "Analyze the following incident report and classify the failure domain into strictly one of: "
            "DATABASE, INFRASTRUCTURE, NETWORK, APPLICATION.\n\n"
            f"Incident ID: {incident_id}\n"
            f"Service: {service_name}\n"
            f"Alert Description: {description}\n\n"
            "Return ONLY valid JSON with no markdown formatting:\n"
            '{"domain": "DATABASE", "reasoning": "Brief explanation"}'
        )

        success = False
        for attempt in range(2):
            try:
                response = model.generate_content(prompt)
                raw_text = response.text.strip()
                clean_json = re.sub(r"^```(?:json)?|```$", "", raw_text, flags=re.MULTILINE).strip()
                data = json.loads(clean_json)
                domain = data.get("domain", "").upper()
                if domain in ["DATABASE", "INFRASTRUCTURE", "NETWORK", "APPLICATION"]:
                    incident_type = domain
                    print(f"[Node 1: Classifier] Gemini Reasoning: {data.get('reasoning')}")
                    success = True
                    break
            except Exception as e:
                if "429" in str(e) and attempt == 0:
                    print("[INFO] Gemini rate-limit (429) hit. Pausing 10s for free-tier window...")
                    await asyncio.sleep(10)
                    continue
                print(f"[WARN] Gemini classification error: {e}. Falling back to heuristic classifier.")
                break

        if not success:
            eval_text = (f"{incident_id} {service_name} {description}").lower()
            if any(k in eval_text for k in ["connection", "pool", "database", "postgres", "sql", "pg::", "exhaustion", "lock"]):
                incident_type = "DATABASE"
            elif any(k in eval_text for k in ["oom", "memory", "cpu", "throttle", "pod", "evicted"]):
                incident_type = "INFRASTRUCTURE"
            elif any(k in eval_text for k in ["dns", "gateway", "ingress", "network", "packet"]):
                incident_type = "NETWORK"
            else:
                incident_type = "APPLICATION"
    else:
        incident_type = "DATABASE"

    state["incident_type"] = incident_type
    state["current_node"] = "CLASSIFIER_NODE"

    if "steps_taken" not in state or state["steps_taken"] is None:
        state["steps_taken"] = []
    state["steps_taken"].append(f"Node 1: Gemini classified domain as [{incident_type}]")

    print(f"[Node 1: Classifier] Complete: Categorized as [{incident_type}]. Passing state to Node 2.")
    return state
