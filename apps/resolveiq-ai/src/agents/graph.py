from .state import InvestigationState
from .nodes.classifier_node import classify_incident_node
from .nodes.evidence_collector_node import collect_evidence_node
from .nodes.runbook_retriever_node import retrieve_runbooks_node
from .nodes.rca_synthesizer_node import synthesize_rca_node

class LangGraphOrchestrator:
    """
    ResolveIQ Autonomous LangGraph Multi-Agent Orchestrator
    Manages the sequential and cyclic execution of specialized incident agents:
    [Classifier] -> [Evidence Collector] -> [Pinecone RAG] -> [RCA Synthesizer]
    """

    def __init__(self):
        print("[ORCHESTRATOR] Initialized LangGraph multi-agent state graph pipeline.")

    async def run_investigation(self, initial_state: InvestigationState) -> InvestigationState:
        """
        Executes the LangGraph state machine sequentially across all specialized nodes.
        """
        print(f"\n====================================================================")
        print(f"[LANGGRAPH] Starting Investigation for {initial_state.get('incident_id')}...")
        print(f"====================================================================")

        # Node 1: Classifier
        state = await classify_incident_node(initial_state)

        # Node 2: Evidence Collector
        state = await collect_evidence_node(state)

        # Node 3: Pinecone RAG Retriever
        state = await retrieve_runbooks_node(state)

        # Node 4: RCA Synthesizer
        state = await synthesize_rca_node(state)

        print(f"====================================================================")
        print(f"[LANGGRAPH] Investigation Pipeline Completed Successfully!")
        print(f"====================================================================\n")
        return state

orchestrator = LangGraphOrchestrator()
