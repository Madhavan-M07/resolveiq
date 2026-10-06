import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class PineconeRAGClient:
    """
    Pinecone Serverless Vector Store Client with Gemini embeddings and metadata filtering.
    Supports multi-tenant namespaces (e.g. org_acme_corp).
    """

    def __init__(self, api_key: Optional[str] = None, index_name: str = "resolveiq-knowledge"):
        self.api_key = api_key or os.getenv("PINECONE_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.index_name = index_name or os.getenv("PINECONE_INDEX_NAME", "resolveiq-knowledge")
        self.is_connected = False
        self.index = None

        self.knowledge_base_documents = [
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
            }
        ]

        if self.api_key:
            try:
                from pinecone import Pinecone
                self.pc = Pinecone(api_key=self.api_key)
                self.index = self.pc.Index(self.index_name)
                self.is_connected = True
                print(f"[OK] Connected to Pinecone Cloud Serverless Index: {self.index_name}")
                self._seed_index_if_empty()
            except Exception as e:
                print(f"[WARN] Pinecone cloud connection failed: {e}. Using fallback.")
                self.is_connected = False
        else:
            print("[INFO] No PINECONE_API_KEY provided; using local embedded store.")

    def _get_embedding(self, text: str) -> List[float]:
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.gemini_key)
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=text
            )
            return result["embedding"]
        except Exception as e:
            print(f"[WARN] Failed to compute Gemini embedding: {e}")
            return [0.0] * 3072

    def _seed_index_if_empty(self, namespace: str = "org_acme_corp"):
        if not self.is_connected:
            return
        try:
            stats = self.index.describe_index_stats()
            total_vector_count = stats.get("total_vector_count", 0)
            if total_vector_count == 0 or namespace not in stats.get("namespaces", {}):
                print(f"[INFO] Seeding Pinecone index [{self.index_name}] with SRE operational runbooks...")
                vectors = []
                for doc in self.knowledge_base_documents:
                    full_text = f"{doc['title']}\n{doc['content']}"
                    vec = self._get_embedding(full_text)
                    vectors.append({
                        "id": doc["id"],
                        "values": vec,
                        "metadata": {
                            "title": doc["title"],
                            "service": doc["service"],
                            "document_type": doc["document_type"],
                            "content": doc["content"]
                        }
                    })
                self.index.upsert(vectors=vectors, namespace=namespace)
                print(f"[OK] Successfully upserted runbook embeddings to Pinecone namespace [{namespace}].")
        except Exception as e:
            print(f"[WARN] Seeding error: {e}")

    def query_similar_documents(
        self,
        query: str,
        service: Optional[str] = None,
        top_k: int = 3,
        namespace: str = "org_acme_corp"
    ) -> List[Dict[str, Any]]:
        """
        Queries runbooks and past incidents using real Pinecone vector search
        with fallback to local lexical search if offline.
        """
        if self.is_connected:
            try:
                query_vector = self._get_embedding(query)
                query_response = self.index.query(
                    namespace=namespace,
                    vector=query_vector,
                    top_k=top_k,
                    include_metadata=True
                )

                matches = query_response.get("matches", [])
                results = []
                for match in matches:
                    meta = match.get("metadata", {})
                    results.append({
                        "id": match["id"],
                        "title": meta.get("title", match["id"]),
                        "service": meta.get("service", "unknown"),
                        "document_type": meta.get("document_type", "runbook"),
                        "content": meta.get("content", ""),
                        "score": round(float(match.get("score", 0.0)), 3),
                        "source": f"Pinecone Serverless Cloud [{self.index_name}/{namespace}]"
                    })
                if results:
                    return results[:top_k]
            except Exception as e:
                print(f"[WARN] Pinecone vector query error: {e}. Falling back to embedded store.")

        results = []
        tokens = query.lower().split()
        for doc in self.knowledge_base_documents:
            score = 0.0
            doc_text = (doc["title"] + " " + doc["content"]).lower()
            if service and doc["service"] == service:
                score += 0.35
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
                    "source": f"Embedded Fallback [{self.index_name}]"
                })
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]
