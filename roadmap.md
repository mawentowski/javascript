# 🧭 SemanticAPIs Learning Plan

---

## **Core Mental Model**

* **JSON-LD Graph = Database**

  * Schema.org–first + small custom `sa:` extensions (policies, fused schemas).
  * Semantic, reviewable, version-controlled → **single source of truth**.
* **Manifests = Cached Views**

  * Pre-joined query results for **fast runtime**.
  * `docs.manifest.json`, `mcp-tools.manifest.json`, `(optional) sdk.manifest.json`.

---

## **Stage 1 — Fundamentals & Setup**

* 📘 Revisit **JavaScript basics**, organize notes, ensure dev environment is ready.
* 🟦 Start with **Node.js (JS)** → gradually migrate to **TypeScript (TS)**.
* ⚙️ Read: *MCP Client Development Guide* → understand **MCP protocol basics** (`tools/list`, `tools/call`).
* 🎯 Goal: **Get something working quickly** → simple MCP client in JS that calls a toy server.

---

## **Stage 2 — Graph Foundation**

* 📝 Convert `oas.yaml` → **JSON-LD** using schema.org classes:

  * `WebAPI`, `EntryPoint`, `Action`.
* 🔗 Add **HowTo flows**: `HowTo → HowToStep[]` → each `target` points to an `EntryPoint`.
* 🆔 Use **ldkit** (or similar) to **mint permanent IDs** for endpoints & resources.

  * Enables micro-versioning + cross-references.
* 🧾 Add **knowledge overlays**: when-to-use descriptions, policies, examples.
* 📦 Emit a **single combined JSON-LD graph snapshot** (schema.org + `sa:` extensions).

---

## **Stage 3 — Graph Validation**

* ✅ **JSON-level validation (fast, CI)**

  * Validate node shapes with JSON Schema (EntryPoint, HowTo, Policy).
  * Ensure `sa:fusedInputSchema` itself is valid JSON Schema.
* 🧩 **RDF-level validation (semantic, deeper)**

  * Expand JSON-LD → RDF (N-Quads).
  * Validate with SHACL / ShEx:

    * Every EntryPoint has `httpMethod`, `urlTemplate`, `sa:fusedInputSchema`.
    * Every HowToStep `target` → valid EntryPoint.
    * Policies well-formed (e.g. `timeoutSec` integer ≥ 1).
  * Tools: **pySHACL**, **Neo4j + n10s**, Jena.

---

## **Stage 4 — Artifact Generation**

* From the JSON-LD graph snapshot, **generate build artifacts**:

  * `docs.manifest.json` → pre-joined page objects (used by docs site).
  * `mcp-tools.manifest.json` → flattened tools & flows w/ fused schemas (used by MCP server).
  * `(optional) sdk.manifest.json` → per-language scaffolding for SDK/tests.
* ⚡ Purpose: derived, disposable, optimized for **fast runtime & deterministic builds**.

---

## **Stage 5 — Outputs & Runtimes**

* 📚 **Docs site** → consumes `docs.manifest.json`, embeds JSON-LD nodes for SEO.
* 🤖 **MCP server** → consumes `mcp-tools.manifest.json`, implements `tools/list` + `tools/call`.
* 🧠 **LLM retrieval** → indexes the JSON-LD graph for semantic Q\&A (flows/docs).

---

## **Stage 6 — Graph + LLM Integration**

* 📖 Learn **LlamaIndex** (start with JS version, then explore Python if needed).
* 🗂 Try **Neo4j + graph queries** for retrieval:

  * LlamaIndex agent → query docs (graph) before calling MCP tools.
* 🔌 Test **Claude Desktop or other LLM clients** hooked to MCP server.
* 🎯 Goal: LLM reads docs (graph), plans steps, then calls MCP tools reliably.

---

## **Stage 7 — Extended Work**

* 📝 Work on **docs-to-JSON-LD pipeline** (HTML/Markdown → XML/JSON-LD).
* ⚖️ Compare **SemanticAPIs vs competitors** (Speakeasy, Stainless, FastMCP).

  * Validate that your **knowledge layer advantage** (flows, policies, JSON-LD docs) outperforms flat converters.
* 🔄 Build proof by showing **end-to-end sync**: OAS + overlays → JSON-LD graph → artifacts → MCP + docs → LLM planning/execution.

---

# 🚀 End Goal

* **SemanticAPIs** is validated as:

  * **Knowledge graph (JSON-LD)** = database, source of truth.
  * **Manifests** = cached views for MCP/docs runtime.
  * **Outputs** = in-sync MCP server, docs, and LLM integrations.

---
