# KOOTTU — Intelligent Celebration Operating System

> **കൂട്ട് (KOOTTU)**: Malayalam for *togetherness, gathering, or alliance*.  
> An exceptionally engineered celebration planning operating system tailored for Indian cultural celebrations, rooted in Kerala traditions, and powered by deterministic financial engineering paired with Google Gemini 3.8 Flash intelligence.

[![Build Passing](https://img.shields.io/badge/build-passing-brightgreen)](file:///README.md)
[![Unit Tests](https://img.shields.io/badge/unit%20tests-59%2F59%20passed-brightgreen)](file:///README.md)
[![QA Sprint](https://img.shields.io/badge/qa%20checks-68%2F68%20passed-brightgreen)](file:///README.md)
[![Playwright Journeys](https://img.shields.io/badge/playwright%20journeys-36%2F36%20passed-brightgreen)](file:///README.md)
[![Gemini 3.8 Flash](https://img.shields.io/badge/AI-Gemini%203.8%20Flash-4285F4)](file:///README.md)
[![TypeScript 5.7](https://img.shields.io/badge/TypeScript-5.7-blue)](file:///README.md)
[![React 19](https://img.shields.io/badge/React-19-61DAFB)](file:///README.md)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4-38B2AC)](file:///README.md)

---

## 1. Problem Statement: Why Indian Celebrations Need Deterministic Systems

Planning an Indian celebration—such as a traditional Kerala wedding—involves extraordinary cultural nuance, intense emotional stakes, and complex multi-stakeholder logistics:
- **Headcount Dynamics**: Hundreds of guests, variable turnouts, and sacred food traditions where running out of Sadya feast is culturally unthinkable.
- **Financial Complexity**: Multiple vendor contracts, advances, GST variations, seasonal surcharges, and non-negotiable family expectations.
- **Unforgiving Timelines**: Fixed Muhurtham auspicious timings, venue slots, and tightly sequenced ritual dependencies (e.g., Dakshina, Thaali tying, Sadya banquet).

### Why Pure LLMs Fail at Celebration Planning
1. **Mathematical Hallucinations**: Generative AI models frequently generate fluctuating arithmetic, lose track of sums, and create penny drift when rebalancing multi-category budgets.
2. **Scheduling Blindness**: LLMs generate plausible-looking checklists without calculating actual topological task dependencies, critical paths, or real calendar slack.
3. **Vendor Ambiguity**: LLMs overlook contract terms like 18% GST exclusions, advance payment milestones, and cancellation penalties.

### The KOOTTU Solution
**KOOTTU divides intelligence into two complementary halves**:
- **Deterministic TypeScript Core**: 100% authoritative financial allocations, integer arithmetic, category locks, DAG critical path scheduling, stress testing, and readiness metrics.
- **Google Gemini 3.8 Flash**: Contextual natural language plan interpretation, culturally nuanced advice, vendor contract audit, and creative celebration ideation.

---

## 2. Architectural Blueprint

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
            Engine --> ReadinessEng[Celebration Readiness Engine 0-100]
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

---

## 3. Deterministic Mathematical Formulation

All numerical computations in KOOTTU are strictly evaluated in TypeScript using pure integer arithmetic (representing Indian Rupees, INR) to guarantee exact reconciliation.

### 3.1 Budget Allocations & Deficit Breakdown
Given total available budget $B$ and guest headcount $N$:
- **Per-Guest Catering Protection**:
  $$\text{Floor}_{\text{food}}(N) = N \times 1,500$$
  For $N = 230$, catering allocation is strictly fixed at $\text{Floor}_{\text{food}}(230) = ₹3,45,000$.
- **Category Minimum Floors**:
  Every category has an irreducible cultural minimum floor ($\text{Venue} \ge ₹1,65,000$, $\text{Decor} \ge ₹28,000$, $\text{Photo} \ge ₹86,000$, $\text{Essentials} \ge ₹68,000$).
- **Benchmark Scenario**:
  $$\text{Total Allocated} = ₹1,65,000 + ₹3,45,000 + ₹28,000 + ₹86,000 + ₹68,000 = ₹6,92,000$$
  $$\text{Net Deficit} = B - \text{Total Allocated} = ₹6,40,000 - ₹6,92,000 = -₹52,000$$
- **Contingency Cushion (0–10%)**:
  When a user sets a 5% contingency reserve ($0.05 \times ₹6,40,000 = ₹32,000$), the effective financial deficit becomes:
  $$\text{Adjusted Deficit} = -₹52,000 - ₹32,000 = -₹84,000$$

### 3.2 Exact Guest Reduction Proof
When exploring trade-offs by reducing guest count from 230 to 200:
$$\Delta N = 230 - 200 = 30 \text{ guests}$$
$$\text{Catering Savings} = \Delta N \times ₹1,500 = 30 \times 1,500 = ₹45,000$$
$$\text{Residual Deficit} = ₹52,000 - ₹45,000 = ₹7,000$$
*KOOTTU never conceals this ₹7,000 deficit; the system clearly highlights that guest reduction alone does not fully balance the budget.*

### 3.3 Category Lock Invariant
When a user locks a category $k \in \mathcal{L}$ (e.g. Photography at ₹86,000):
$$B_{\text{new}}(k) = B_{\text{base}}(k), \quad \forall k \in \mathcal{L}$$
Any budget adjustment $\Delta B$ is distributed strictly across unlocked categories $\mathcal{U} = \mathcal{C} \setminus \mathcal{L}$ weighted by priority:
$$B_{\text{new}}(u) = \max\left(\text{Floor}(u), \; B_{\text{base}}(u) + \Delta B \cdot \frac{w_u}{\sum_{j \in \mathcal{U}} w_j}\right), \quad \forall u \in \mathcal{U}$$

### 3.4 Directed Acyclic Graph (DAG) Critical Path Scheduling
Tasks are modeled as a directed graph $G = (V, E)$ where edges $(u, v) \in E$ denote that task $u$ must finish before task $v$ can start.
- **Topological Order & Cycle Detection**: Computed via a 3-color DFS algorithm ($0 = \text{unvisited}$, $1 = \text{visiting}$, $2 = \text{visited}$). If an edge leads to a node with color 1, a circular dependency is reported.
- **Early Finish & Critical Path**:
  $$\text{ES}(v) = \max_{(u, v) \in E} \text{EF}(u), \quad \text{EF}(v) = \text{ES}(v) + \text{duration}(v)$$
  $$\text{Critical Path Length} = \max_{v \in V} \text{EF}(v)$$
- **Feasibility Condition**:
  $$\text{Feasible} \iff \text{Critical Path Length} \le \text{Available Planning Days}$$

---

## 4. Feature Gallery

### 4.1 Landing & Cultural Event Setup
The step-by-step setup wizard captures occasion type, budget limit, guest count, planning horizon, location, and cultural priorities.

![Landing Page](docs/assets/screenshots/01_landing.png)
*Figure 1: KOOTTU welcome screen featuring cultural ethos, quick stats, and instant demo access.*

![Setup Review Step](docs/assets/screenshots/02_setup_review.png)
*Figure 2: Setup wizard review step displaying initial category allocations and protected catering baseline.*

---

### 4.2 Benchmark Workspace & Celebration Readiness Cockpit
The primary dashboard provides instant visibility into total allocations, deficit breakdown, contingency reserve slider, category locks, and the 0–100 Celebration Readiness Score.

![Benchmark Workspace](docs/assets/screenshots/03_benchmark_workspace.png)
*Figure 3: Interactive celebration workspace with readiness score pill (72/100), active alerts, and category lock toggles.*

---

### 4.3 Budget Stress Testing Simulator
Deterministically models real-world shocks—such as guest surges, peak season generator surcharges, or monsoon shamiana weather emergencies—showing exact financial impact before commitments are made.

![Budget Stress Simulator](docs/assets/screenshots/04_stress_test_simulator.png)
*Figure 4: Stress testing simulator projecting +20% guest surge, venue surcharges, and weather emergencies.*

---

### 4.4 Vendor Lifecycle & 3-Quote Value Matrix
Compares competing quotes across base pricing, GST inclusions, advance payment schedules, and transparent 0–100 value scores. Also generates culturally tailored WhatsApp inquiry drafts.

![Vendor 3-Quote Matrix](docs/assets/screenshots/05_vendor_matrix.png)
*Figure 5: Vendor 3-Quote value comparison matrix with GST reconciliation and contract status.*

---

### 4.5 Adapt Celebration Drawer & 3-Scenario Trade-offs
Offers three mathematically verified trade-off pathways (Balanced Reallocation, Headcount Protection, Experience Elevation) alongside natural language intent parsing and Google Gemini 3.8 Flash ideation.

![Adapt Drawer Scenarios](docs/assets/screenshots/06_adapt_drawer_scenarios.png)
*Figure 6: Adapt drawer presenting 3 verified trade-offs, natural language interpreter, and decision impact preview.*

---

### 4.6 Mobile Responsive Viewport
Fully responsive design optimized for mobile family coordinators on 375px screens with zero horizontal overflow.

<div align="center">
  <img src="docs/assets/screenshots/07_mobile_viewport.png" alt="Mobile Viewport" width="360" />
  <p><em>Figure 7: Touch-first responsive view on mobile viewport.</em></p>
</div>

---

## 5. Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript 5.7 | Modern component architecture, functional hooks, strict typing |
| **Styling & Design System** | Tailwind CSS v4 | Warm editorial palette (`#12382f` Forest, `#f4f0e7` Paper, `#d97706` Gold) |
| **Build & Dev Tooling** | Vite 8 + `@tailwindcss/vite` | Sub-second HMR and optimized production bundling |
| **AI Intelligence** | Google Gemini 3.8 Flash | Official `@google/genai` SDK for intent parsing, ideation, and audit |
| **Scheduling & Calendar** | Custom DAG + RFC 5545 | CPM algorithm, cycle detection, downloadable `.ics` milestone calendars |
| **Persistence** | Local-First Schema v3 | Zero-latency `localStorage` with versioned migration and Reset Demo |
| **Testing & Automation** | Native `node:test` + Playwright | 59 unit tests, 68 sprint verifier checks, 36 browser journeys |

---

## 6. Repository Structure

```
KOOTTU/
├── api/                             # Production Serverless Functions (Vercel)
│   ├── health.ts                    # GET /api/health
│   ├── recommendations.ts           # POST /api/recommendations (Gemini + fallback)
│   ├── plan-intent.ts               # POST /api/plan-intent (Natural language interpreter)
│   ├── vendor-quote.ts              # POST /api/vendor-quote (Quotation AI audit)
│   ├── event-ideas.ts               # POST /api/event-ideas (Cultural concepts)
│   └── planning-assistant.ts        # POST /api/planning-assistant (Grounded advisor)
├── docs/
│   └── assets/
│       └── screenshots/             # Optimized documentation screenshots (< 800 KB)
│           ├── 01_landing.png
│           ├── 02_setup_review.png
│           ├── 03_benchmark_workspace.png
│           ├── 04_stress_test_simulator.png
│           ├── 05_vendor_matrix.png
│           ├── 06_adapt_drawer_scenarios.png
│           └── 07_mobile_viewport.png
├── src/
│   ├── core/                        # Pure Domain Engines (100% Deterministic TypeScript)
│   │   ├── types.ts                 # Unified TypeScript domain types (Schema v3)
│   │   ├── budget/
│   │   │   ├── budgetEngine.ts      # Integer INR allocation & category locking
│   │   │   ├── tradeOffEngine.ts    # 3-scenario trade-off generation
│   │   │   └── stressTestEngine.ts  # 4-scenario budget stress testing
│   │   ├── timeline/
│   │   │   ├── timelineEngine.ts    # DAG scheduler, CPM, cycle detection & delay propagation
│   │   │   └── runSheetEngine.ts    # Chronological run sheet & RFC 5545 .ics generator
│   │   ├── vendor/
│   │   │   ├── vendorEngine.ts      # Quote parsing, GST calculation & variance
│   │   │   ├── vendorLifecycleEngine.ts # 3-quote comparison matrix & inquiry drafts
│   │   │   └── sampleQuotes.ts      # Realistic Kerala vendor benchmark data
│   │   ├── intelligence/
│   │   │   └── readinessEngine.ts   # 0–100 Celebration Readiness scoring engine
│   │   ├── insights/
│   │   │   └── insightEngine.ts     # Prioritized alert banner engine
│   │   ├── ideation/
│   │   │   └── culturalIdeas.ts     # Authentic Kerala cultural concepts catalog
│   │   └── persistence/
│   │       └── storage.ts           # Local-first localStorage v3 manager & print summary
│   ├── server/                      # Server-Side Route Handlers
│   │   ├── recommendationsHandler.ts # Gemini trade-off handler + deterministic fallback
│   │   ├── intentHandler.ts         # Natural language plan adjuster
│   │   ├── vendorQuoteHandler.ts    # Vendor quotation audit handler
│   │   ├── ideationHandler.ts       # Creative cultural concepts handler
│   │   ├── assistantHandler.ts      # Grounded planning assistant handler
│   │   └── vitePlugin.ts            # Vite local development dev middleware
│   ├── App.tsx                      # Primary application component & celebration workspace
│   ├── main.tsx                     # React 19 entrypoint
│   └── index.css                    # Design tokens and custom styles
├── scripts/
│   ├── e2e-qa-sprint.mjs            # 68-check E2E verifier
│   └── browser-audit.mjs            # 36-journey Playwright browser automation
├── .env.example                     # Environment template (API keys git-ignored)
├── package.json
├── vercel.json                      # Vercel serverless routing configuration
└── vite.config.ts
```

---

## 7. Getting Started & Verification

### 7.1 Setup Environment Variables
Create a `.env` file in the root directory (this is git-ignored):
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

### 7.2 Install Dependencies
```bash
npm install
```

### 7.3 Run All Automated Test Suites

```bash
# 1. Native Unit & Integration Tests (59 tests across 15 suites)
npm test

# 2. End-to-End API & Mathematical Integrity Verifier (68 automated checks)
node scripts/e2e-qa-sprint.mjs

# 3. Real Browser E2E Automation via Playwright (36 user journeys in Microsoft Edge headless)
node scripts/browser-audit.mjs
```

### 7.4 Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:8443](http://localhost:8443) in your browser.

### 7.5 Build for Production
```bash
npm run build
```
Build completes in `<1 second` and outputs an optimized bundle in `dist/`.

---

## 8. Intellectual Integrity, Security & Production Disclaimers

1. **Clear Division of Responsibilities**:
   - Google Gemini 3.8 Flash is utilized strictly for contextual reasoning, natural language intent interpretation, creative Kerala cultural concepts, and vendor audit advice.
   - All budget allocations, contingency reserves, deficits, DAG critical path durations, 0–100 readiness scores, and stress tests are calculated deterministically in TypeScript.
2. **Quota Resilience & Free Tier Handling**:
   - Google AI Studio Free Tier has a rate limit of 20 requests per day (RPD) on `gemini-3.8-flash`.
   - If an API quota is exhausted, the network times out (>120s), or `GEMINI_API_KEY` is not configured, KOOTTU automatically switches to pre-computed deterministic fallbacks. The application never crashes or displays empty states.
3. **Secret Isolation**:
   - `GEMINI_API_KEY` resides strictly on the server (in Node.js / serverless functions). It is never sent to the browser or prefixed with `VITE_`.
4. **Rate Limiting Scope**:
   - The included in-memory sliding window rate limiter protects local dev servers and single-instance deployments against runaway requests. In multi-region serverless cloud production (e.g. AWS Lambda / Vercel Edge), an external coordinated store (such as Redis or Upstash) is recommended.
5. **Illustrative Benchmark Rates**:
   - Vendor rates (Sadya catering at ₹1,500/guest, Kochi photography studios, classical temple musicians) reflect realistic market benchmarks for central Kerala (Ernakulam/Kochi) and serve as an illustrative baseline for planning calculations.

---

## 9. License

MIT License. Designed and engineered for celebrating together.
