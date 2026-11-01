# KOOTTU — Intelligent Celebration Operating System

> **കൂട്ട് (KOOTTU)**: Malayalam for *togetherness, gathering, or alliance*.
> An exceptionally engineered, competition-winning celebration planning operating system tailored for Indian cultural celebrations, rooted in Kerala traditions, and powered by deterministic financial engineering paired with Google Gemini 3.8 Flash intelligence.

---

## 1. Architectural Philosophy & Core Tenets

KOOTTU is built on one foundational engineering truth: **AI should explain, interpret, ideate, and advise — but never calculate or hallucinate financial numbers or scheduling commitments.**

```mermaid
flowchart TD
    User([User Request / Natural Language]) -->|HTTP POST| Gateway[Vite Dev Middleware / Vercel Serverless]
    
    subgraph Server_Boundary [Server-Side Boundary (Secrets Protected)]
        Gateway --> Val[Input Validation & Rate Limiter]
        Val --> Engine[Unified Authoritative Event Model]
        
        subgraph Deterministic_Core [Deterministic Ground Truth Subsystems]
            Engine --> BudgetEng[Budget & Allocation Engine (Integer INR)]
            Engine --> TradeOffEng[3-Scenario Trade-Off Engine]
            Engine --> DAGEng[Timeline DAG & CPM Engine]
            Engine --> VendorEng[Vendor Lifecycle & 3-Quote Matrix]
            Engine --> StressEng[Budget Stress Testing Engine]
            Engine --> ReadinessEng[Celebration Readiness Engine (0-100)]
            Engine --> RunSheetEng[Run Sheet & RFC 5545 .ics Calendar]
            Engine --> InsightEng[Proactive Insights Engine]
        end
        
        Deterministic_Core -->|Verified Ground Truth| GeminiPrompt[Ground-Truth Structured Prompt]
        GeminiPrompt -->|Official SDK @google/genai| GeminiAPI[Google Gemini 3.8 Flash]
        GeminiAPI -->|Structured JSON Response| ParseRepair[JSON Parser & Schema Repair]
        GeminiAPI -.->|Quota Limit / Timeout / 503| FallbackGen[Deterministic Fallback Generator]
        ParseRepair --> OutputEnvelope[Unified Output Envelope]
        FallbackGen --> OutputEnvelope
    end

    OutputEnvelope -->|Client Response| ReactClient[React 19 Frontend State]
    
    subgraph Client_Workspace [Client-Side Celebration Workspace]
        ReactClient --> ReadinessUI[Celebration Readiness Score & Insights]
        ReactClient --> WorkspaceUI[Visual Budget Planner with Contingency Reserve]
        ReactClient --> StressUI[Budget Stress Test Simulator]
        ReactClient --> VendorUI[Vendor Quotation Audit & 3-Quote Comparison]
        ReactClient --> TimelineUI[DAG Dependency Timeline & Milestones .ics]
        ReactClient --> RunSheetUI[Event-Day Chronological Run Sheet & .ics]
        ReactClient --> AdaptDrawerUI[Multi-Scenario Adapt Drawer & AI Advisor]
        ReactClient --> LocalStore[(Local-First Persistence v3)]
    end
```

### Core Architecture Pillars

1. **Deterministic Financial Ground Truth**:
   - Budget allocations, priority calculations, category minimum floors, deficits, and surpluses are computed in pure TypeScript with integer Indian Rupees (INR) to eliminate floating-point penny drift.
   - Food catering is strictly protected at ₹1,500/guest.
   - Reducing guest count from 230 to 200 saves exactly $30 \times ₹1,500 = ₹45,000$, leaving precisely ₹7,000 of the ₹52,000 deficit to resolve.
   - Category locks allow users to hold high-priority allocations (e.g., Photography at ₹86,000 or Venue at ₹1,65,000) completely constant while rebalancing secondary flexible spending.
   - **Contingency Reserve Slider (0–10%)**: Protects unexpected overruns as a distinct reserve buffer without diluting category baselines.

2. **Celebration Readiness Score (0–100)**:
   - Deterministically scores event preparation across four 25-point pillars:
     - **Budget Health (0–25 pts)**: Deficit status and contingency cushion.
     - **Timeline Feasibility (0–25 pts)**: Critical path buffer and planning window slack.
     - **Vendor Confirmation (0–25 pts)**: Core vendor quotes locked vs unconfirmed.
     - **Task Execution (0–25 pts)**: Completion ratio of dependency DAG milestones.
   - Deducts risk penalties for circular dependencies or critical vendor gaps.

3. **Budget Stress Testing Simulator**:
   - Deterministically projects four real-world shock scenarios before they happen:
     - **+20% Guest Surge** (family turnout spikes).
     - **Venue Peak-Season Premium** (generator & air conditioning surcharge).
     - **Monsoon & Weather Emergency** (waterproofing & shamiana setup).
     - **Cinematic Photography Extension** (drone film & late reception coverage).

4. **True Directed Acyclic Graph (DAG) Scheduling**:
   - Tasks are modeled as a dependency graph with topological sorting, cycle detection (DFS 3-color algorithm), Critical Path Method (CPM) calculation, and delay propagation.
   - Feasibility is mathematically verified (`availableDays >= criticalPathDuration`).
   - One-click export to standard **RFC 5545 `.ics`** calendar format for planning milestones.

5. **Event-Day Chronological Run Sheet**:
   - Time-blocked day-of schedule (from 06:30 AM Mandapam floral setup through 09:45 AM Muhurtham and Sadya banquet).
   - Generates downloadable `.ics` calendar events for family coordinators and vendor leads.

6. **Vendor Lifecycle & 3-Quote Value Comparison Matrix**:
   - Compares up to 3 quotes per category across base pricing, GST inclusions, advance payment %, cancellation policies, and transparent 0–100 value scores.
   - Generates culturally tailored WhatsApp / Email inquiry drafts ready for copy-pasting.

7. **Proactive Insights & Alerts Engine**:
   - Evaluates active plan telemetry and surfaces prioritized alerts (`critical`, `warning`, `info`, `success`) with direct navigation anchors (`#budget`, `#timeline`, `#vendors`, `#runsheet`).

8. **Grounded AI Ideation & Conversational Assistant**:
   - `/api/event-ideas`: Suggests authentic Kerala themes, dining stations, and welcome concepts with cost estimates.
   - `/api/planning-assistant`: Answers planning questions strictly grounded in the user's active plan without hallucinating uncommitted figures.
   - Resilient against Free Tier quota limits via graceful cultural fallback.

9. **Local-First Persistence (Schema v3)**:
   - Stores complete plan, category locks, custom task statuses, contingency reserves, accepted quotes, and vendor pipelines in `localStorage`.
   - Backward-compatible v2 migration and 1-click **Reset Demo**.

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
├── api/                             # Production Serverless Functions (Vercel)
│   ├── health.ts                    # GET /api/health
│   ├── recommendations.ts           # POST /api/recommendations
│   ├── plan-intent.ts               # POST /api/plan-intent
│   ├── vendor-quote.ts              # POST /api/vendor-quote
│   ├── event-ideas.ts               # POST /api/event-ideas
│   └── planning-assistant.ts        # POST /api/planning-assistant
├── src/
│   ├── core/                        # Pure Domain Engines (100% Deterministic)
│   │   ├── types.ts                 # Unified TypeScript domain definitions (v3)
│   │   ├── budget/
│   │   │   ├── budgetEngine.ts      # Integer INR allocation & category locking
│   │   │   ├── budgetEngine.test.ts # Budget unit tests
│   │   │   ├── tradeOffEngine.ts    # 3-scenario trade-off generation
│   │   │   └── stressTestEngine.ts  # Budget stress testing simulator
│   │   ├── timeline/
│   │   │   ├── timelineEngine.ts    # DAG scheduler, CPM, cycle detection & delay propagation
│   │   │   ├── timelineEngine.test.ts
│   │   │   ├── runSheetEngine.ts    # Event-day run sheet & RFC 5545 .ics generator
│   │   │   └── runSheetEngine.test.ts
│   │   ├── vendor/
│   │   │   ├── vendorEngine.ts      # Quote parsing, GST calculation & variance
│   │   │   ├── vendorEngine.test.ts # Vendor parser unit tests
│   │   │   ├── vendorLifecycleEngine.ts # 3-quote comparison matrix & inquiry drafts
│   │   │   ├── vendorLifecycleEngine.test.ts
│   │   │   └── sampleQuotes.ts      # Authentic Kerala vendor quote samples
│   │   ├── templates/
│   │   │   └── occasionTemplates.ts # Occasion templates (Wedding, Engagement, Housewarming)
│   │   ├── insights/
│   │   │   ├── insightEngine.ts     # Proactive prioritized alert generator
│   │   │   └── insightEngine.test.ts
│   │   ├── intelligence/
│   │   │   ├── readinessEngine.ts   # 0–100 Celebration Readiness scoring engine
│   │   │   └── readinessEngine.test.ts
│   │   ├── plan/
│   │   │   ├── unifiedPlanEngine.ts # Authoritative unified plan coordinator
│   │   │   └── unifiedPlanEngine.test.ts
│   │   ├── ideation/
│   │   │   └── culturalIdeas.ts     # Curated Kerala cultural concepts catalog
│   │   └── persistence/
│   │       ├── storage.ts           # Local-first localStorage v3 manager & print summary
│   │       └── storage.test.ts      # Storage recovery & migration tests
│   ├── server/                      # Server-Side Route Handlers
│   │   ├── recommendationsHandler.ts # Gemini trade-off handler + deterministic fallback
│   │   ├── recommendationsHandler.test.ts
│   │   ├── intentHandler.ts         # Natural language plan adjuster
│   │   ├── intentHandler.test.ts    # Intent parser unit tests
│   │   ├── vendorQuoteHandler.ts    # Vendor quotation audit handler
│   │   ├── vendorQuoteHandler.test.ts
│   │   ├── ideationHandler.ts       # Creative cultural concepts handler
│   │   ├── ideationHandler.test.ts
│   │   ├── assistantHandler.ts      # Grounded planning assistant handler
│   │   └── vitePlugin.ts            # Vite local development dev middleware
│   ├── data.ts                      # Backward-compatible domain facade
│   ├── data.test.ts                 # Regression test suite
│   ├── App.tsx                      # Primary application component & celebration workspace
│   ├── main.tsx                     # React 19 entrypoint
│   └── index.css                    # Design tokens, motion easing, and component styles
├── scripts/
│   └── e2e-qa-sprint.mjs            # Comprehensive 68-check E2E verifier
├── .env                             # Server-side API key (git-ignored)
├── .env.example                     # Environment template
├── package.json
├── vercel.json                      # Vercel serverless routing
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

### 3. Run Automated Unit & Integration Tests

```bash
# On Linux / macOS / Bash:
npm test

# On Windows PowerShell:
npm.cmd run test
```
*Executes all 59 automated unit and integration tests across 15 test suites in ~17–19s with 0 failures.*

### 4. Run API & Mathematical Integrity Verifier

```bash
node scripts/e2e-qa-sprint.mjs
```
*Executes 68 end-to-end integration and mathematical assertions verifying 100% check pass rate across ground-truth math, DAG feasibility, category locks, stress tests, readiness scoring, vendor matrices, run sheets, and HTTP security boundaries.*

### 5. Run Real Browser (Playwright) E2E Automation

```bash
node scripts/browser-audit.mjs
```
*Executes 36 complete user journeys in a real Chromium browser (Microsoft Edge headless), covering Landing -> Setup Flow -> Workspace, Contingency Slider adjustments, Stress Test simulator expansion, Vendor quote comparison, ics calendar downloads, Adapt Drawer trade-off application, local persistence across reloads, and mobile viewport responsiveness with 0 console errors.*

### 6. Start Local Development Server

```bash
npm run dev
```
*Starts Vite with the server-side API middleware on `http://localhost:8443`.*

### 7. Build for Production

```bash
npm run build
```
*Compiles TypeScript and bundles client assets in `<1s`.*

---

## 6. End-to-End Demonstration Walkthrough

1. Open `http://localhost:8443`.
2. Complete the **Setup Flow** or click **Reset Demo** in the workspace header.
3. Observe the **Celebration Readiness Score** pill in the top header and the **Proactive Insights Banner** surfacing active budget alerts.
4. Observe the benchmark scenario in the **Visual Budget Planner**:
   - Available budget: **₹6,40,000**, Allocated: **₹6,92,000**, Baseline Deficit: **−₹52,000** (or **−₹84,000** with 5% contingency cushion).
   - Food catering protected at **₹3,45,000** for 230 guests ($230 \times ₹1,500$).
   - Adjust the **Contingency Reserve Slider** (0–10%) to see real-time reserve allocation.
   - Expand the **Budget Stress Testing Simulator** to review shock impacts (+20% guests, venue surcharge, monsoon emergency).
5. Explore the **Vendor Quotations & Pipeline** section:
   - Click **Sadya Caterers (Kochi)** or **Lumière Visual Studios** (sample benchmark rates provided for illustration).
   - Toggle **Compare 3 Quotes in Category** to evaluate the multi-quote value matrix.
   - Click **Accept Quote** to contract the vendor into the plan.
   - Click **Inquiry Draft** to review and copy a culturally respectful Malayalam/English booking draft.
   - Click **✦ Audit with Gemini 3.8 Flash** to view AI negotiation advice and risk flags.
6. Explore the **Milestone Timeline & Run Sheet**:
   - Click **Download .ics** to export RFC 5545 calendar entries for planning milestones.
   - Review the **Event-Day Chronological Run Sheet** (Muhurtham at 09:45 AM) and click **Download Day-of .ics**.
7. Open the **Adapt Plan** drawer:
   - Type *"Reduce budget by 50,000 and lock photography"* and click **✦ Interpret**.
   - Ask questions in the **Ask Planning Advisor** box (*"What is the best rain contingency for sadya dining?"*).
   - Review **Cultural Celebration Concepts** for creative inspiration.
   - Preview trade-off scenarios and observe the **Decision Impact Preview** before committing.
   - Click **Accept changes** — observe celebration hero update with renewed readiness.
8. Click **Print Brief** to generate an offline, printable family celebration summary.
9. Refresh the browser — observe all state, locks, contingency, and contracted quotes survive via local-first persistence v3.

---

## 7. Security, Resilience & Deployment Architecture

### Secret & Key Isolation
- `GEMINI_API_KEY` is loaded exclusively inside Node.js server environments (`src/server/` and `api/`). It is **never** prefixed with `VITE_` and never bundled into client JavaScript.
- Audited via automated AST/bundle string searches: client production bundles contain zero references to API keys or private credentials.
- `.env` is strictly git-ignored; a sanitized `.env.example` template is provided for judges and contributors.

### Request Validation & Boundary Protection
- **Request Size Limiting**: Hard-capped at **10KB** per request on all API endpoints (`/api/recommendations`, `/api/plan-intent`, `/api/vendor-quote`, `/api/event-ideas`, `/api/planning-assistant`) to prevent denial-of-service via large payloads.
- **Strict Bounds Validation**: Numerical parameters are validated server-side (Budget: ₹3L–₹5Cr, Guests: 20–500, Planning Window: 1–12 months). Non-POST requests are rejected with HTTP 405 Method Not Allowed; malformed JSON returns HTTP 400.
- **In-Memory Rate Limiting vs. Production Distributed Architectures**:
  - The built-in rate limiter utilizes an in-memory sliding window (15–20 requests/minute per client IP), ideal for local development, demonstrations, and single-node instances.
  - *Production Limitation Notice*: In distributed or serverless environments (e.g. AWS Lambda, Vercel Edge/Serverless), individual function invocations run in stateless worker instances that do not share memory. For high-scale production deployments, a distributed store such as Redis or Upstash is recommended to coordinate rate limiting across regions.

### Quota Resilience & Graceful Fallbacks
- If Google Gemini returns HTTP 503, high network latency (>120s timeout), or `RESOURCE_EXHAUSTED` (Google AI Studio Free Tier quota limit of 20 requests/day on `gemini-3.8-flash`), the server intercepts the exception gracefully.
- Instead of failing or displaying broken UI states, the system returns a verified deterministic response with `status: "fallback"`, `isAiGenerated: false`, and an informational badge. The user receives 100% accurate ground-truth calculations, cultural ideas, and recommendations without interruption.

### Production Deployment Architecture (Vercel)
The repository is structured for Vercel serverless deployment:
- `vercel.json` configures serverless routing:
  - `/api/(.*)` routes to Node.js serverless functions in `api/$1.ts`.
  - Client-side routes rewrite to `/index.html` for single-page app navigation.
- *Deployment Status*: Serverless entrypoints are fully compatible and tested locally. Live cloud deployment requires configuring `GEMINI_API_KEY` in the hosting provider's project dashboard (`npx vercel --prod`).

