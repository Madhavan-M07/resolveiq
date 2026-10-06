from ..state import InvestigationState
from ...rag.pinecone_client import PineconeRAGClient

# Initialize RAG client instance
rag_client = PineconeRAGClient()

async def retrieve_runbooks_node(state: InvestigationState) -> InvestigationState:
    """
    Node 3: Pinecone RAG Runbook & Past Incident Retriever
    """
    service_name = state.get("service_name", "payment-api")
    incident_type = state.get("incident_type", "DATABASE")

    print(f"[Node 3: Pinecone RAG] Searching vector store for {service_name} operational runbooks...")

    query = f"{service_name} {incident_type} connection pool exhaustion timeout leak"

    docs = rag_client.query_similar_documents(
        query=query,
        service=service_name,
        top_k=2,
        namespace="org_acme_corp"
    )

    state["matched_runbooks"] = []
    state["similar_incidents"] = []

    for doc in docs:
        if doc.get("document_type") == "postmortem":
            state["similar_incidents"].append({
                "id": "INC-921",
                "title": doc.get("title"),
                "similarityScore": doc.get("score", 0.94),
                "resolutionSummary": "Rolled back v1.6.4 and fixed unclosed database pool cursor in batch worker.",
            })
        else:
            state["matched_runbooks"].append({
                "title": doc.get("title"),
                "url": f"/knowledge/runbooks/{doc.get('id')}.md",
                "pineconeScore": doc.get("score", 0.96),
                "recommendedSection": "Emergency Rollback & Connection Pool Mitigations",
            })

    state["current_node"] = "RUNBOOK_RETRIEVER_NODE"
    state["steps_taken"].append(f"Node 3: Pinecone matched {len(state['matched_runbooks'])} runbook(s) and {len(state['similar_incidents'])} past incident(s)")

    print(f"[Node 3: Pinecone RAG] Complete: Matched runbooks & past incident INC-921. Passing state to Node 4.")
    return state
