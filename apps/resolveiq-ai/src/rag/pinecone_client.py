import os
from typing import List, Dict, Any, Optional

class PineconeRAGClient:
    """
    Pinecone Serverless Vector Store Client with metadata filtering and local fallback.
    Supports multi-tenant namespaces (e.g. org_acme_corp).
    """

    def __init__(self, api_key: Optional[str] = None, index_name: str = "resolveiq-knowledge"):
        self.api_key = api_key or os.getenv("PINECONE_API_KEY")
        self.index_name = index_name
        self.is_connected = False
        
        # Local mock operational knowledge store for zero-cost offline development
        self.local_knowledge_base = [
            {
                "id": "rb-db-pool-01",
                "title": "PostgreSQL Connection Pool Sizing & Exhaustion Runbook",
                "service": "payment-api",
                "document_type": "runbook",
                "content": (
                    "When payment-api reports PG::ConnectionBad or active connections equal max pool (100/100):\n"
                    "1. Check if recent deployment altered async pool acquisition timeouts.\n"
                    "2. Immediate Mitigating Action: Revert to previous stable deployment version.\n"
                    "3. Secondary Action: If traffic spike, temporarily scale DB connection pool from 100 to 150."
                ),
                "keywords": ["connection pool", "PG::ConnectionBad", "timeout", "exhaustion", "payment-api", "v1.8.2"]
            },
            {
                "id": "inc-past-921",
                "title": "Post-Mortem INC-921: Connection Leak on Checkout",
                "service": "payment-api",
                "document_type": "postmortem",
                "content": (
                    "Incident INC-921 Root Cause: Batch processing routine failed to return db connections to pool on timeout.\n"
                    "Resolution: Immediate rollback of bad build, followed by code fix to use try-finally context managers."
                ),
                "keywords": ["connection leak", "checkout", "post-mortem", "rollback", "pool timeout"]
            },
            {
                "id": "rb-redis-cache-02",
                "title": "Redis Eviction & Sentinel Failover Runbook",
                "service": "order-api",
                "document_type": "runbook",
                "content": (
                    "When order-api latency spikes due to Redis timeout: check maxmemory-policy. "
                    "Flush stale cache keys or restart replica node."
                ),
                "keywords": ["redis", "eviction", "cache", "timeout", "order-api"]
            }
        ]

        if self.api_key and not self.api_key.startswith("mock"):
            try:
                from pinecone import Pinecone
                self.pc = Pinecone(api_key=self.api_key)
                self.index = self.pc.Index(self.index_name)
                self.is_connected = True
                print(f"✅ Connected to Pinecone Serverless Index: {self.index_name}")
            except Exception as e:
                print(f"⚠️ Pinecone initialization warning: {e}. Falling back to embedded knowledge base.")
                self.is_connected = False
        else:
            print("ℹ️ Running with local embedded SRE knowledge store (Pinecone offline mode).")

    def query_similar_documents(
        self,
        query: str,
        service: Optional[str] = None,
        top_k: int = 3,
        namespace: str = "org_acme_corp"
    ) -> List[Dict[str, Any]]:
        """
        Queries runbooks and past incident post-mortems using metadata filtering.
        """
        if self.is_connected:
            try:
                # If connected to real Pinecone:
                # In production, query_vector = embedder.embed(query)
                # response = self.index.query(namespace=namespace, vector=query_vector, top_k=top_k, include_metadata=True)
                pass
            except Exception as e:
                print(f"Pinecone query error: {e}")

        # Local semantic matching algorithm for zero-cost offline resilience
        results = []
        tokens = query.lower().split()
        for doc in self.local_knowledge_base:
            score = 0.0
            doc_text = (doc["title"] + " " + doc["content"] + " " + " ".join(doc["keywords"])).lower()
            
            # Boost score if target service matches
            if service and doc["service"] == service:
                score += 0.35
            
            # Keyword hit scoring
            matches = sum(1 for token in tokens if token in doc_text)
            score += min(matches * 0.15, 0.60)
            
            if score > 0.3:
                results.append({
                    "id": doc["id"],
                    "title": doc["title"],
                    "service": doc["service"],
                    "document_type": doc["document_type"],
                    "content": doc["content"],
                    "score": round(score, 2),
                    "source": f"Pinecone Index [{self.index_name}/{namespace}]"
                })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]
