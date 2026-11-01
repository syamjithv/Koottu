import { useState, useMemo } from "react"
import type { Setup, Plan, VendorQuote, TaskStatus } from "../data.ts"
import {
  formatINR,
  findTemplateByOccasion,
  recalculateUnifiedPlan,
  createInitialUnifiedPlan,
} from "../data.ts"
import { Brand } from "./Brand.tsx"
import { useRevealOnScroll } from "./useRevealOnScroll.ts"
import { ProactiveInsightsBanner } from "./ProactiveInsightsBanner.tsx"
import { BudgetPlanner } from "./BudgetPlanner.tsx"
import { VendorQuotesSection } from "./VendorQuotesSection.tsx"
import { EventMap } from "./EventMap.tsx"
import { Timeline } from "./Timeline.tsx"
import { EventDayRunSheet } from "./EventDayRunSheet.tsx"
import { AdaptDrawer } from "./AdaptDrawer.tsx"

export function Workspace({
  setup,
  plan,
  accepted,
  lockedKeys = [],
  vendorQuotes = [],
  customTaskStatuses = {},
  taskAssignees = {},
  acceptedQuotes = {},
  contingencyPercent = 5,
  onToggleLock,
  onAddQuote,
  onAcceptQuote,
  onToggleStatus,
  onAssignTask,
  onUpdateContingency,
  onResetDemo,
  onAdapt,
  onAccept,
  onHome,
}: {
  setup: Setup
  plan: Plan
  accepted: boolean
  lockedKeys?: string[]
  vendorQuotes?: VendorQuote[]
  customTaskStatuses?: Record<string, TaskStatus>
  taskAssignees?: Record<string, string>
  acceptedQuotes?: Record<string, string>
  contingencyPercent?: number
  onToggleLock?: (key: string) => void
  onAddQuote?: (quote: VendorQuote) => void
  onAcceptQuote?: (quote: VendorQuote) => void
  onToggleStatus?: (taskId: string) => void
  onAssignTask?: (taskId: string, assignee: string) => void
  onUpdateContingency?: (pct: number) => void
  onResetDemo?: () => void
  onAdapt: () => void
  onAccept: (plan: Plan) => void
  onHome: () => void
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [planJustAccepted, setPlanJustAccepted] = useState(false)
  useRevealOnScroll(plan)
  const scroll = (id: string) =>
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" })

  const handleAcceptProposal = (nextPlan: Plan) => {
    onAccept(nextPlan)
    setDrawerOpen(false)
    setPlanJustAccepted(true)
    window.setTimeout(() => setPlanJustAccepted(false), 1400)
  }

  const template = useMemo(
    () => findTemplateByOccasion(setup.occasion),
    [setup.occasion],
  )
  const runSheet = useMemo(() => template.defaultRunSheet, [template])

  const unifiedPlan = useMemo(() => {
    return recalculateUnifiedPlan(
      createInitialUnifiedPlan(setup, template.id),
      {
        newBudget: plan.budget,
        newGuests: plan.guests,
        newMonths: plan.months,
        newLockedKeys: lockedKeys,
        newContingencyPercent: contingencyPercent,
      },
    )
  }, [setup, template, plan, lockedKeys, contingencyPercent])

  const readiness = unifiedPlan.readiness
  const insights = unifiedPlan.insights

  return (
    <div className="workspace">
      <header className="workspace-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            className="brand-button"
            onClick={onHome}
            aria-label="KOOTTU home"
          >
            <Brand />
          </button>
          <div className="storage-pill">
            <i className="storage-dot" />
            <span>Saved locally</span>
            {onResetDemo && (
              <button
                type="button"
                className="reset-demo-btn"
                onClick={onResetDemo}
                title="Reset to benchmark ₹6.4L / 230 guests Kerala wedding demo"
              >
                Reset Demo
              </button>
            )}
          </div>
          <div className="readiness-pill" title={readiness.summary}>
            <span>
              Readiness:{" "}
              <strong className="readiness-score">
                {readiness.overallScore}%
              </strong>
            </span>
          </div>
          <button
            type="button"
            className="reset-demo-btn"
            style={{ marginLeft: 2 }}
            onClick={() => window.print()}
            title="Print Celebration Brief for family elders"
          >
            🖨 Print Brief
          </button>
        </div>
        <nav aria-label="Workspace navigation">
          {[
            ["Overview", "#overview"],
            ["Budget", "#budget"],
            ["Quotes", "#quotes"],
            ["Timeline", "#timeline"],
            ["Run Sheet", "#runsheet"],
            ["Place", "#map"],
          ].map(([label, id]) => (
            <button key={id} onClick={() => scroll(id)}>
              {label}
            </button>
          ))}
        </nav>
        <button
          className="adapt-nav"
          onClick={() => {
            setDrawerOpen(true)
            onAdapt()
          }}
        >
          Adapt plan <span>↗</span>
        </button>
      </header>
      <main className="workspace-main">
        <section
          className={`celebration-hero ${
            planJustAccepted ? "plan-accepted-glow" : ""
          }`}
          id="overview"
        >
          <div className="celebration-title">
            <span className="kicker">
              {setup.location || "Location to be chosen"} · Prototype plan
            </span>
            <h1>
              Our {setup.occasion}
              <br />
              <em>Celebration</em>
            </h1>
            <div className="priority-row">
              {setup.priorities.map((priority) => (
                <span key={priority}>{priority}</span>
              ))}
            </div>
          </div>
          <div className="celebration-state">
            <span>{accepted ? "Accepted plan" : "Original plan"}</span>
            <p>
              {accepted
                ? "Your baseline is retained. This is the latest plan you accepted."
                : "Your first connected plan, ready to explore and adapt."}
            </p>
            <button className="what-if" onClick={() => setDrawerOpen(true)}>
              What if things change? <b>→</b>
            </button>
          </div>
          <div className="celebration-facts">
            <div>
              <small>Event timeframe</small>
              <strong>{setup.date || `${plan.months} months away`}</strong>
              <span>
                {setup.date ? "Illustrative month" : "Planning estimate"}
              </span>
            </div>
            <div>
              <small>Gathering</small>
              <strong>{plan.guests}</strong>
              <span>Expected guests</span>
            </div>
            <div>
              <small>Plan limit</small>
              <strong>{formatINR(plan.budget)}</strong>
              <span>Total budget</span>
            </div>
            <div>
              <small>Time to plan</small>
              <strong>{plan.months} mo.</strong>
              <span>{plan.months < 3 ? "Compressed" : "Working window"}</span>
            </div>
          </div>
        </section>

        <ProactiveInsightsBanner
          insights={insights}
          onNavigate={(dest) => {
            if (dest === "#adapt") setDrawerOpen(true)
            else scroll(dest)
          }}
        />

        <div className="reveal">
          <BudgetPlanner
            plan={plan}
            lockedKeys={lockedKeys}
            contingencyPercent={contingencyPercent}
            onUpdateContingency={onUpdateContingency}
            onToggleLock={onToggleLock}
          />
        </div>
        <div className="reveal">
          <VendorQuotesSection
            plan={plan}
            quotes={vendorQuotes}
            acceptedQuotes={acceptedQuotes}
            onAddQuote={onAddQuote || (() => undefined)}
            onAcceptQuote={onAcceptQuote}
          />
        </div>
        <div className="workspace-pair reveal">
          <EventMap location={setup.location} />
          <aside className="matters-panel">
            <span className="kicker">What we’re protecting</span>
            <h2>
              Make every trade-off <em>intentional.</em>
            </h2>
            <ol>
              {setup.priorities.map((priority, index) => (
                <li key={priority}>
                  <i>0{index + 1}</i>
                  <span>{priority}</span>
                </li>
              ))}
            </ol>
            {setup.requirements && (
              <blockquote>“{setup.requirements}”</blockquote>
            )}
            <button onClick={() => setDrawerOpen(true)}>
              Explore a change <span>→</span>
            </button>
          </aside>
        </div>
        <div className="reveal">
          <Timeline
            months={plan.months}
            customStatuses={customTaskStatuses}
            taskAssignees={taskAssignees}
            onToggleStatus={onToggleStatus}
            onAssignTask={onAssignTask}
          />
        </div>
        <div className="reveal">
          <EventDayRunSheet
            runSheet={runSheet}
            eventDate={setup.date}
            occasion={setup.occasion}
          />
        </div>
        <section className="workspace-cta">
          <div className="gathering-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className="kicker">Plans change. Meaning doesn’t.</span>
          <h2>Make room for what matters.</h2>
          <button
            className="button primary"
            onClick={() => setDrawerOpen(true)}
          >
            Adapt this plan <span>→</span>
          </button>
        </section>
      </main>
      <footer className="workspace-footer">
        <Brand light />
        <p>
          All amounts are calculated deterministically. AI trade-off
          explanations are powered by Gemini 3.8 Flash.
        </p>
      </footer>
      {drawerOpen && (
        <AdaptDrawer
          current={plan}
          currentLabel={accepted ? "Accepted plan" : "Original plan"}
          setup={setup}
          lockedKeys={lockedKeys}
          onClose={() => setDrawerOpen(false)}
          onAccept={handleAcceptProposal}
        />
      )}
    </div>
  )
}

