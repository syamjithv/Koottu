# KOOTTU — AI-Powered Celebration Planning Platform

> **കൂട്ട് (KOOTTU)**: Malayalam for *togetherness, gathering, or alliance*.
> A production-grade, competition-winning celebration planning platform tailored for cultural celebrations, rooted in Kerala traditions, and powered by deterministic financial engineering paired with Google Gemini 3.8 Flash intelligence.

---

## 1. Architectural Philosophy & Core Tenets

KOOTTU is built on one foundational engineering truth: **AI should explain, interpret, and advise — but never calculate or hallucinate financial numbers or scheduling commitments.**

```mermaid
flowchart TD
    User([User Request / Natural Language]) -->|HTTP POST| Gateway[Vite Dev Middleware / Vercel Serverless]
    
    subgraph Server_Boundary [Server-Side Boundary (Secrets Protected)]
        Gateway --> Val[Input Validation & Rate Limiter]
        Val --> Engine[Deterministic Core Engine]
        
        subgraph Deterministic_Core [Deterministic Ground Truth]
            Engine --> BudgetEng[Budget & Allocation Engine (Integer INR)]
            Engine --> TradeOffEng[3-Scenario Trade-Off Engine]
            Engine --> DAGEng[Timeline DAG & Critical Path Engine]
            Engine --> VendorEng[Vendor Quote & GST Parser]
        end
        
        Deterministic_Core -->|Verified Ground Truth| GeminiPrompt[Ground-Truth Structured Prompt]
        GeminiPrompt -->|Official SDK @google/genai| GeminiAPI[Google Gemini 3.8 Flash]
        GeminiAPI -->|Structured JSON Response| ParseRepair[JSON Parser & Schema Repair]
        GeminiAPI -.->|503 / Timeout Headroom| FallbackGen[Deterministic Fallback Generator]
        ParseRepair --> OutputEnvelope[Unified Output Envelope]
        FallbackGen --> OutputEnvelope
    end

    OutputEnvelope -->|Client Response| ReactClient[React 19 Frontend State]
    
    subgraph Client_Workspace [Client-Side Workspace]
        ReactClient --> WorkspaceUI[Visual Budget Planner]
        ReactClient --> VendorUI[Vendor Quotation Audit]
        ReactClient --> TimelineUI[DAG Dependency Timeline]
        ReactClient --> AdaptDrawerUI[Multi-Scenario Adapt Drawer]
        ReactClient --> LocalStore[(Local-First Persistence v2)]
    end
```

### Core Architecture Pillars

1. **Deterministic Financial Ground Truth**:
   - Budget allocations, priority calculations, category minimum floors, deficits, and surpluses are computed in pure TypeScript with integer Indian Rupees (INR) to eliminate floating-point penny drift.
   - Food catering is strictly protected at ₹1,500/guest.
   - Reducing guest count from 230 to 200 saves exactly $30 \times ₹1,500 = ₹45,000$, leaving precisely ₹7,000 of the ₹52,000 deficit to resolve.
   - Category locks allow users to hold high-priority allocations (e.g., Photography at ₹86,000 or Venue at ₹1,65,000) completely constant while rebalancing secondary flexible spending.

2. **True Directed Acyclic Graph (DAG) Scheduling**:
   - Tasks are modeled as a dependency graph with topological sorting, cycle detection (DFS 3-color algorithm), Critical Path Method (CPM) calculation, and delay propagation.
   - Timeline feasibility is mathematically proven (`availableDays >= criticalPathDuration`) before any feasibility claim is surfaced to the user.

3. **Multi-Scenario Trade-Off Generation**:
   - Automatically generates 3 distinct, mathematically verified trade-off options for any budget deficit:
     - **Scenario A (Guest Count Optimization)**: Trims headcount to save catering expenses while preserving all category budgets.
     - **Scenario B (Headcount Protected)**: Retains full guest list; optimizes unlocked flexible categories (decor, photography hours, misc essentials) to absorb the deficit.
     - **Scenario C (Balanced Compromise)**: Mild guest trim paired with gentle category adjustments.

4. **Vendor Quotation Intelligence**:
   - Extracts vendor names, categories, base quotes, GST rates (inclusive vs exclusive), advance payment tokens, and cancellation policies from raw quotation text.
   - Calculates exact budget variance against the active plan allocation.
   - Gemini 3.8 Flash audits contracts for hidden risk flags (overtime penalties, uncapped generator fuel, non-refundable deposits).

5. **Natural Language Plan Changes**:
   - Users can express changes colloquially (*"Reduce budget by ₹50,000 and lock photography"* or *"Add 30 guests for the evening"*).
   - Gemini 3.8 Flash interprets the intent into structured deltas; the deterministic engine computes the resulting plan; the user reviews and confirms.

6. **Local-First Persistence**:
   - Automatically persists the active plan, setup, category locks, custom task statuses, and vendor quotes to `localStorage` under versioned schema `koottu_plan_v2`.
   - 1-click **Reset Demo** restores the competition benchmark scenario instantly.

---

## 2. Competitive Benchmark Scenario (Kerala Wedding)

KOOTTU is pre-configured and tested against the standard competition benchmark:

- **Occasion**: Kerala Wedding Celebration
- **Location**: Kochi, Kerala
- **Budget Limit**: ₹6,40,000
- **Expected Guests**: 230
- **Planning Window**: 4 Months
- **Priorities**: Food & catering, Photography

### Authoritative Allocations & Deficit Breakdown

| Category | Allocated (INR) | Priority Status | Rationale |
| :--- | :--- | :--- | :--- |
| **Venue** | ₹1,65,000 | Baseline | Scaled down under budget pressure |
| **Food & catering** | ₹3,45,000 | **Protected** | $230 \text{ guests} \times ₹1,500/\text{guest}$ |
| **Decorations** | ₹28,000 | Flexible | Floor minimum |
| **Photography** | ₹86,000 | Flexible | Preserves coverage quality |
| **Other essentials**| ₹68,000 | Flexible | Uncommitted essentials |
| **Total Planned** | **₹6,92,000** | — | — |
| **Net Deficit** | **−₹52,000** | **Over Budget** | Requires intentional trade-offs |

**Exact Arithmetic on Guest Reduction**:
$$\Delta \text{Guests} = 230 - 200 = 30 \text{ guests}$$
$$\text{Savings} = 30 \times ₹1,500 = ₹45,000$$
$$\text{Remaining Deficit} = ₹52,000 - ₹45,000 = ₹7,000$$

---

## 3. Technology Stack

- **Runtime & Framework**: React 19, TypeScript 5.7, Vite 8
- **Styling**: Tailwind CSS v4, Custom CSS with tactile cubic-bezier motion tokens
- **AI SDK**: Official Google GenAI SDK (`@google/genai`)
- **Foundation Model**: `gemini-3.8-flash` (configurable via `GEMINI_MODEL`)
- **Server Environment**: Vite middleware for local development (`src/server/vitePlugin.ts`), Node.js Serverless Functions for production deployment (`api/*.ts`)
- **Testing**: Node.js Native Test Runner with TypeScript stripping (`node --test`)
- **Code Formatting**: `oxfmt`

---

## 4. Folder Structure

```
KOOTTU/
├── api/                             # Production Serverless Functions (Vercel / Netlify)
│   ├── health.ts                    # GET /api/health
│   ├── recommendations.ts           # POST /api/recommendations
│   ├── plan-intent.ts               # POST /api/plan-intent
│   └── vendor-quote.ts              # POST /api/vendor-quote
├── src/
│   ├── core/                        # Pure Domain Engines (100% Deterministic)
│   │   ├── types.ts                 # Unified TypeScript domain definitions
│   │   ├── budget/
│   │   │   ├── budgetEngine.ts      # Integer INR allocation & category locking
│   │   │   ├── budgetEngine.test.ts # Budget unit tests
│   │   │   └── tradeOffEngine.ts    # 3-scenario trade-off generation
│   │   ├── timeline/
│   │   │   ├── timelineEngine.ts    # DAG scheduler, CPM, cycle detection & delay propagation
│   │   │   └── timelineEngine.test.ts
│   │   ├── vendor/
│   │   │   ├── vendorEngine.ts      # Quote parsing, GST calculation & variance
│   │   │   ├── vendorEngine.test.ts # Vendor parser unit tests
│   │   │   └── sampleQuotes.ts      # Authentic Kerala vendor quote samples
│   │   └── persistence/
│   │       ├── storage.ts           # Local-first localStorage v2 manager
│   │       └── storage.test.ts      # Storage recovery & migration tests
│   ├── server/                      # Server-Side Route Handlers
│   │   ├── recommendationsHandler.ts # Gemini trade-off handler + deterministic fallback
│   │   ├── recommendationsHandler.test.ts
│   │   ├── intentHandler.ts         # Natural language plan adjuster
│   │   ├── intentHandler.test.ts    # Intent parser unit tests
│   │   ├── vendorQuoteHandler.ts    # Vendor quotation audit handler
│   │   ├── vendorQuoteHandler.test.ts
│   │   └── vitePlugin.ts            # Vite local development dev middleware
│   ├── data.ts                      # Backward-compatible domain facade
│   ├── data.test.ts                 # Regression test suite
│   ├── App.tsx                      # Primary application component & workspace
│   ├── main.tsx                     # React 19 entrypoint
│   └── index.css                    # Design tokens, motion easing, and component styles
├── .env                             # Server-side API key (git-ignored)
├── .env.example                     # Environment template
├── package.json
└── vite.config.ts
```

---

## 5. Getting Started & Local Development

### 1. Configure Environment Variables

Create `.env` in the repository root:
```env
GEMINI_API_KEY=your_google_genai_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Automated Test Suite

```bash
# On Linux / macOS / Bash:
npm test

# On Windows PowerShell:
npm.cmd run test
```
*Executes all 33 unit and integration tests across 8 test suites (budget engine, trade-off scenarios, timeline DAG & CPM, vendor parser, persistence & migration, and server API handlers) in ~1.1s.*

### 4. Run Competition QA Sprint Verification

```bash
node scripts/e2e-qa-sprint.mjs
```
*Executes 41 end-to-end integration and mathematical assertions verifying zero floating-point penny drift, category locks, exact ₹7,000 residual deficit exposure, contract auditing, DAG critical paths, and HTTP security boundaries.*

### 4. Start Local Development Server

```bash
npm run dev
```
*Starts Vite with the server-side API middleware on `http://localhost:8443`.*

### 5. Build for Production

```bash
npm run build
```

---

## 6. End-to-End Demonstration Walkthrough

1. Open `http://localhost:8443`.
2. Click **Start planning** or **Reset Demo** in the workspace header.
3. Observe the benchmark scenario:
   - Available budget: **₹6,40,000**, Allocated: **₹6,92,000**, Deficit: **−₹52,000**.
   - Food catering protected at **₹3,45,000** for 230 guests.
4. Explore the **Vendor Quotations** section:
   - Click **Sadya Caterers (Kochi)** or **Lumière Visual Studios**.
   - Review extracted base cost, GST, advance token %, and budget variance.
   - Click **✦ Audit with Gemini 3.8 Flash** to view AI negotiation advice and risk flags.
5. Open the **Adapt Plan** drawer:
   - Type *"Reduce budget by 50,000 and lock photography"* into the natural language box and click **✦ Interpret**.
   - Observe how Gemini parses the intent and the deterministic engine rebalances the allocations.
   - Review the **3 Calculated Trade-Off Scenarios** and click **Preview & Apply**.
   - Click **✦ Explain trade-offs with Gemini 3.8 Flash** to get deep AI trade-off analysis.
   - Click **Accept changes** — observe the celebration hero glowing as the new baseline is locked.
6. Refresh the browser — observe that the plan, quotes, and custom task statuses survive via local-first persistence.

---

## 7. Security, Resilience & Production Deployment

### Secret & Key Isolation
- `GEMINI_API_KEY` is loaded exclusively inside Node.js server environments (`src/server/` and `api/`). It is **never** prefixed with `VITE_` and never bundled into client JavaScript.
- Audited via automated AST/bundle string searches: client production bundles contain zero references to API keys or private credentials.
- `.env` is strictly git-ignored; a sanitized `.env.example` template is provided for judges and contributors.

### Request Validation & Boundary Protection
- **Request Size Limiting**: Hard-capped at **10KB** per request on all API endpoints (`/api/recommendations`, `/api/plan-intent`, `/api/vendor-quote`) to prevent denial-of-service via large payloads.
- **Strict Bounds Validation**: Numerical parameters are validated server-side (Budget: ₹3L–₹5Cr, Guests: 20–500, Planning Window: 1–12 months). Non-POST requests are rejected with HTTP 405 Method Not Allowed; malformed JSON returns HTTP 400.
- **In-Memory Rate Limiting vs. Production Distributed Architectures**:
  - The built-in rate limiter utilizes an in-memory sliding window (15–20 requests/minute per client IP), ideal for local development, demonstrations, and single-node instances.
  - *Production Limitation Notice*: In distributed or serverless environments (e.g. AWS Lambda, Vercel Edge/Serverless), individual function invocations run in stateless worker instances that do not share memory. For high-scale production deployments, a distributed store such as Redis or Upstash is recommended to coordinate rate limiting across regions.

### Quota Resilience & Graceful Fallbacks
- If Google Gemini returns HTTP 503, high network latency (>120s timeout), or `RESOURCE_EXHAUSTED` (Google AI Studio Free Tier quota limit of 20 requests/day on `gemini-3.8-flash`), the server intercepts the exception gracefully.
- Instead of failing or displaying broken UI states, the system returns a verified deterministic response with `status: "fallback"`, `isAiGenerated: false`, and an informational badge. The user receives 100% accurate ground-truth calculations and recommendations without interruption.

### Production Deployment (Vercel)
The repository is production-ready for Vercel deployment:
- `vercel.json` configures serverless routing:
  - `/api/(.*)` routes to Node.js serverless functions in `api/$1.ts`.
  - Client-side routes rewrite to `/index.html` for single-page app navigation.
- To deploy:
  ```bash
  npx vercel --prod
  ```
  Set `GEMINI_API_KEY` in the Vercel Project Settings > Environment Variables.

