import { useEffect, useMemo, useRef, useState } from "react"
import {
  adaptPlan,
  formatINR,
  getTimeline,
  isOriginalPlan,
  originalPlan,
  sumPlan,
  type Plan,
  type RecommendationResponse,
  type CategoryKey,
  type VendorQuote,
  type TradeOffScenario,
  type StoredAppState,
  type TaskStatus,
  generateTradeOffScenarios,
  analyzeScheduleFeasibility,
  SAMPLE_QUOTES,
  parseVendorQuote,
  compareQuoteToPlan,
  loadStoredAppState,
  saveStoredAppState,
  clearStoredAppState,
  DEFAULT_SETUP,
} from "./data.ts"

type Stage = "landing" | "setup" | "workspace"
type Setup = {
  occasion: string
  date: string
  months: number
  guests: number
  location: string
  budget: number
  priorities: string[]
  requirements: string
}

const occasions = [
  "Wedding",
  "Engagement",
  "Birthday",
  "Family gathering",
  "Festival or community celebration",
  "Other",
]
const priorityOptions = [
  "Food and catering",
  "Guest experience",
  "Venue and accessibility",
  "Photography and memories",
  "Decorations and atmosphere",
  "Cultural or family traditions",
]

function useRevealOnScroll(dependency?: unknown) {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(
      ".reveal:not(.is-visible)",
    )
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [dependency])
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        KOOTTU<small>make room for what matters</small>
      </span>
    </div>
  )
}

function Landing({ onStart }: { onStart: () => void }) {
  useRevealOnScroll()
  return (
    <div className="landing">
      <header className="public-nav">
        <Brand />
        <button className="nav-cta" onClick={onStart}>
          Start planning <span>↗</span>
        </button>
      </header>
      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-copy">
            <span className="kicker">
              Celebrations, planned around real life
            </span>
            <h1>
              Make room for the moments <em>that matter.</em>
            </h1>
            <p>
              KOOTTU connects your budget, people, priorities, and timing into
              one practical celebration plan — then helps it adapt when life
              changes.
            </p>
            <div className="hero-ctas">
              <button className="button primary" onClick={onStart}>
                Plan my celebration <span>→</span>
              </button>
              <button
                className="button quiet"
                onClick={() =>
                  document
                    .querySelector("#how")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore how it works
              </button>
            </div>
          </div>
          <div
            className="plan-canvas"
            aria-label="Preview of a KOOTTU celebration plan"
          >
            <div className="canvas-top">
              <span>Wedding celebration</span>
              <b>04 months</b>
            </div>
            <div className="canvas-budget">
              <small>Working budget</small>
              <strong>₹8,00,000</strong>
              <div className="mini-segments">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="canvas-note note-one">
              <span>200</span> people
              <br />
              <small>guest estimate</small>
            </div>
            <div className="canvas-note note-two">
              <span>Priority 01</span> Food quality
            </div>
            <div className="canvas-path">
              <i />
              <i />
              <i />
              <i />
              <span>Venue</span>
              <span>Catering</span>
              <span>Celebrate</span>
            </div>
            <div className="canvas-stamp">Plan can adapt</div>
            <div className="gathering-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        </section>

        <section className="story reveal" id="how">
          <div className="story-intro">
            <span className="kicker">A plan with a point of view</span>
            <h2>
              Start with meaning.
              <br />
              Finish with a plan.
            </h2>
          </div>
          <div className="story-steps">
            {[
              [
                "01",
                "Start with what matters.",
                "Tell us who is gathering, what you value, and the limits we should respect.",
              ],
              [
                "02",
                "Get a plan that makes sense.",
                "See how budget, arrangements, timing, and tasks connect before you commit.",
              ],
              [
                "03",
                "Adapt without starting over.",
                "Change the guests, budget, or date. Keep the plan — and see every trade-off.",
              ],
            ].map(([number, title, copy], index) => (
              <article
                className="reveal"
                style={
                  { "--reveal-delay": `${index * 70}ms` } as React.CSSProperties
                }
                key={number}
              >
                <b>{number}</b>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="adapt-story reveal">
          <div>
            <span className="kicker">The KOOTTU difference</span>
            <h2>
              When the guest list grows,
              <br />
              <em>the plan responds.</em>
            </h2>
            <p>
              ₹8,00,000 and 200 guests becomes ₹6,40,000 and 230 guests. KOOTTU
              doesn’t hide the pressure: the current prototype exposes the
              ₹52,000 deficit and the decisions it creates.
            </p>
            <button className="button primary green" onClick={onStart}>
              Build my plan <span>→</span>
            </button>
          </div>
          <div className="before-after">
            <div>
              <small>Before</small>
              <strong>₹8L</strong>
              <span>200 guests</span>
            </div>
            <b>→</b>
            <div className="after">
              <small>After</small>
              <strong>₹6.4L</strong>
              <span>230 guests</span>
            </div>
            <p>
              <i /> Constraint made visible
              <br />
              <b>₹52,000 over budget</b>
            </p>
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <Brand light />
        <button onClick={onStart}>
          Plan something meaningful <span>→</span>
        </button>
      </footer>
    </div>
  )
}

function SetupFlow({
  value,
  onChange,
  onComplete,
  onExit,
}: {
  value: Setup
  onChange: (next: Setup) => void
  onComplete: () => void
  onExit: () => void
}) {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<"forward" | "back">("forward")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const update = <K extends keyof Setup>(key: K, next: Setup[K]) => {
    if (error) setError("")
    onChange({ ...value, [key]: next })
  }
  const valid =
    step === 1
      ? !!value.occasion
      : step === 2
        ? value.guests >= 20 && value.guests <= 500 && value.budget >= 300000
        : step === 3
          ? value.priorities.length > 0
          : true
  const next = () => {
    if (!valid) {
      setError(
        step === 1
          ? "Choose an occasion to continue."
          : step === 2
            ? "Enter 20–500 guests and a budget of at least ₹3,00,000."
            : "Choose at least one priority.",
      )
      return
    }
    setError("")
    setDirection("forward")
    setStep((current) => Math.min(4, current + 1))
  }
  const togglePriority = (priority: string) =>
    update(
      "priorities",
      value.priorities.includes(priority)
        ? value.priorities.filter((item) => item !== priority)
        : value.priorities.length < 3
          ? [...value.priorities, priority]
          : value.priorities,
    )

  const handleFinish = () => {
    if (submitting) return
    setSubmitting(true)
    onComplete()
  }

  return (
    <div className="setup-shell">
      <header className="setup-nav">
        <button
          className="brand-button"
          onClick={onExit}
          aria-label="Back to KOOTTU home"
        >
          <Brand />
        </button>
        <span>Celebration setup</span>
      </header>
      <div className="setup-progress" aria-label={`Step ${step} of 4`}>
        <span style={{ width: `${step * 25}%` }} />
      </div>
      <main className="setup-main">
        <div className="step-label">
          <span>0{step}</span> / 04
        </div>
        {step === 1 && (
          <section
            key={`step-${step}`}
            className={`setup-step step-${direction}`}
          >
            <span className="kicker">Let’s begin</span>
            <h1>
              What are we
              <br />
              <em>celebrating?</em>
            </h1>
            <p>
              Choose the occasion that best fits. You can make the plan your own
              in the next steps.
            </p>
            <div className="occasion-grid">
              {occasions.map((occasion, index) => (
                <button
                  key={occasion}
                  className={
                    value.occasion === occasion ? "choice selected" : "choice"
                  }
                  onClick={() => update("occasion", occasion)}
                >
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <span>{occasion}</span>
                  <b>{value.occasion === occasion ? "✓" : "↗"}</b>
                </button>
              ))}
            </div>
          </section>
        )}
        {step === 2 && (
          <section
            key={`step-${step}`}
            className={`setup-step step-${direction}`}
          >
            <span className="kicker">The practical details</span>
            <h1>
              Give the plan
              <br />
              <em>its shape.</em>
            </h1>
            <p>
              Estimates are welcome. KOOTTU is designed to adapt as details
              become clearer.
            </p>
            <div className="form-grid">
              <label>
                <span>
                  Event month <small>Optional</small>
                </span>
                <input
                  type="month"
                  value={value.date}
                  onChange={(e) => update("date", e.target.value)}
                />
              </label>
              <label>
                <span>Planning window</span>
                <select
                  value={value.months}
                  onChange={(e) => update("months", Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 8, 12].map((month) => (
                    <option value={month} key={month}>
                      {month} month{month > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Expected guests</span>
                <input
                  type="number"
                  min="20"
                  max="500"
                  value={value.guests}
                  onChange={(e) => update("guests", Number(e.target.value))}
                />
              </label>
              <label>
                <span>
                  Location or preferred area <small>Optional</small>
                </span>
                <input
                  placeholder="e.g. Kochi"
                  value={value.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </label>
              <label className="budget-input">
                <span>Total planning budget</span>
                <div>
                  <b>₹</b>
                  <input
                    type="number"
                    min="300000"
                    step="10000"
                    value={value.budget}
                    onChange={(e) => update("budget", Number(e.target.value))}
                  />
                </div>
                <small>{formatINR(value.budget)}</small>
              </label>
            </div>
          </section>
        )}
        {step === 3 && (
          <section
            key={`step-${step}`}
            className={`setup-step step-${direction}`}
          >
            <span className="kicker">Your priorities</span>
            <h1>
              What matters
              <br />
              <em>most?</em>
            </h1>
            <p>
              Choose up to three priorities. These stay visible when the plan
              needs to make a trade-off.
            </p>
            <div className="priority-grid">
              {priorityOptions.map((priority, index) => (
                <button
                  key={priority}
                  className={
                    value.priorities.includes(priority)
                      ? "priority-choice selected"
                      : "priority-choice"
                  }
                  onClick={() => togglePriority(priority)}
                >
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <span>{priority}</span>
                  <b>
                    {value.priorities.includes(priority)
                      ? "Selected"
                      : "Choose"}
                  </b>
                </button>
              ))}
            </div>
            <label className="requirements">
              <span>
                Anything we should never compromise on? <small>Optional</small>
              </span>
              <textarea
                rows={4}
                value={value.requirements}
                onChange={(e) => update("requirements", e.target.value)}
                placeholder="Share traditions, accessibility needs, family requirements, or anything else that matters."
              />
            </label>
          </section>
        )}
        {step === 4 && (
          <section
            key={`step-${step}`}
            className={`setup-step review-step step-${direction}`}
          >
            <span className="kicker">Ready to plan</span>
            <h1>
              One celebration.
              <br />
              <em>Your requirements.</em>
            </h1>
            <p>
              Review the starting point. This prototype uses transparent,
              deterministic planning rules — not a live AI or vendor search.
            </p>
            <div className="review-sheet">
              <div className="review-title">
                <span>{value.occasion}</span>
                <strong>
                  {value.date || `${value.months}-month planning window`}
                </strong>
              </div>
              <div className="review-facts">
                <div>
                  <small>Guests</small>
                  <b>{value.guests}</b>
                </div>
                <div>
                  <small>Budget</small>
                  <b>{formatINR(value.budget)}</b>
                </div>
                <div>
                  <small>Area</small>
                  <b>{value.location || "To be chosen"}</b>
                </div>
              </div>
              <div className="review-priorities">
                <small>Protected priorities</small>
                {value.priorities.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              {value.requirements && (
                <blockquote>“{value.requirements}”</blockquote>
              )}
              <button
                className="edit-link"
                onClick={() => {
                  setDirection("back")
                  setStep(1)
                }}
              >
                Edit my answers
              </button>
            </div>
          </section>
        )}
        {error && (
          <div className="setup-error" role="alert" aria-live="assertive">
            <span aria-hidden="true">⚠ </span>
            {error}
          </div>
        )}
        <footer className="setup-actions">
          <button
            className="button quiet"
            disabled={step === 1}
            onClick={() => {
              setError("")
              setDirection("back")
              setStep((current) => Math.max(1, current - 1))
            }}
          >
            ← Back
          </button>
          {step < 4 ? (
            <button className="button primary green" onClick={next}>
              Continue <span>→</span>
            </button>
          ) : (
            <button
              className="button primary green"
              disabled={submitting}
              onClick={handleFinish}
            >
              {submitting ? "Preparing plan..." : "Build my celebration plan →"}
            </button>
          )}
        </footer>
      </main>
    </div>
  )
}

function BudgetPlanner({
  plan,
  lockedKeys = [],
  onToggleLock,
}: {
  plan: Plan
  lockedKeys?: string[]
  onToggleLock?: (key: string) => void
}) {
  const [selected, setSelected] = useState(plan.categories[1].key)
  const spent = sumPlan(plan)
  const remaining = plan.budget - spent
  const detail =
    plan.categories.find((item) => item.key === selected) || plan.categories[0]
  const colors = ["forest", "coral", "saffron", "sage", "sand"]

  // Track previous category amounts to highlight only genuinely changed allocations
  const previousAmounts = useRef<Record<string, number>>({})
  const [changedKeys, setChangedKeys] = useState<string[]>([])

  useEffect(() => {
    const changed: string[] = []
    plan.categories.forEach((cat) => {
      if (
        previousAmounts.current[cat.key] !== undefined &&
        previousAmounts.current[cat.key] !== cat.amount
      ) {
        changed.push(cat.key)
      }
      previousAmounts.current[cat.key] = cat.amount
    })
    if (changed.length > 0) {
      setChangedKeys(changed)
      const timer = window.setTimeout(() => setChangedKeys([]), 1200)
      return () => window.clearTimeout(timer)
    }
  }, [plan])

  return (
    <section className="workspace-section budget-planner" id="budget">
      <div className="section-heading">
        <div>
          <span className="kicker">Visual budget planner</span>
          <h2>Every rupee has a role.</h2>
        </div>
        <span className="prototype-label">Planning estimates · not quotes</span>
      </div>
      <div className="budget-numbers">
        <div>
          <small>Available</small>
          <strong className="value-update" key={`budget-${plan.budget}`}>
            {formatINR(plan.budget)}
          </strong>
        </div>
        <div>
          <small>Allocated</small>
          <strong className="value-update" key={`spent-${spent}`}>
            {formatINR(spent)}
          </strong>
        </div>
        <div className={remaining < 0 ? "risk-text deficit-arrival" : ""}>
          <small>{remaining < 0 ? "Deficit" : "Room remaining"}</small>
          <strong className="value-update" key={`remaining-${remaining}`}>
            {remaining < 0
              ? `−${formatINR(Math.abs(remaining))}`
              : formatINR(remaining)}
          </strong>
          {remaining < 0 && (
            <span className="deficit-badge" aria-label="Warning: over budget">
              <span aria-hidden="true">⚠</span> Over budget
            </span>
          )}
        </div>
      </div>
      <div className="segment-bar" aria-label="Budget allocation by category">
        {plan.categories.map((category, index) => (
          <button
            key={category.key}
            aria-label={`${category.name}: ${formatINR(category.amount)}`}
            className={`${colors[index]} ${
              selected === category.key ? "active" : ""
            } ${
              changedKeys.includes(category.key) ? "allocation-changed" : ""
            }`}
            style={{ width: `${(category.amount / spent) * 100}%` }}
            onClick={() => setSelected(category.key)}
          />
        ))}
      </div>
      <div className="budget-detail">
        <div>
          <span
            className={`legend ${colors[plan.categories.findIndex((item) => item.key === selected)]}`}
          />
          <small>Selected allocation</small>
          <h3>{detail.name}</h3>
          <strong className="value-update" key={`detail-${detail.amount}`}>
            {formatINR(detail.amount)}
          </strong>
        </div>
        <p>
          {detail.priority
            ? "Protected priority. This allocation follows the current illustrative per-guest food rule."
            : "This is an adjustable planning estimate. Review it against verified quotes before making commitments."}
        </p>
        {detail.priority && (
          <span className="protected">Protected priority</span>
        )}
        {lockedKeys.includes(detail.key) && (
          <span
            className="protected"
            style={{
              background: "var(--ink)",
              color: "var(--saffron)",
              borderColor: "var(--ink)",
            }}
          >
            🔒 Locked Category
          </span>
        )}
      </div>
      <div className="budget-legend">
        {plan.categories.map((category, index) => {
          const isLocked = lockedKeys.includes(category.key)
          return (
            <button
              key={category.key}
              onClick={() => setSelected(category.key)}
              className={`${selected === category.key ? "active" : ""} ${
                changedKeys.includes(category.key) ? "allocation-changed" : ""
              }`}
            >
              <i className={colors[index]} />
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                {category.name}
                {onToggleLock && (
                  <span
                    role="button"
                    tabIndex={0}
                    className={`category-lock-btn ${
                      isLocked ? "is-locked" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleLock(category.key)
                    }}
                    title={
                      isLocked
                        ? "Category locked against budget reductions"
                        : "Lock this allocation"
                    }
                  >
                    {isLocked ? "🔒" : "🔓"}
                  </span>
                )}
              </span>
              <b>{formatINR(category.amount)}</b>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function VendorQuotesSection({
  plan,
  quotes,
  onAddQuote,
}: {
  plan: Plan
  quotes: VendorQuote[]
  onAddQuote: (quote: VendorQuote) => void
}) {
  const [activeSampleIdx, setActiveSampleIdx] = useState<number>(0)
  const [rawText, setRawText] = useState(SAMPLE_QUOTES[0].rawText)
  const [categoryHint, setCategoryHint] = useState<CategoryKey>("food")
  const [analyzedQuote, setAnalyzedQuote] = useState<VendorQuote>(() =>
    parseVendorQuote(SAMPLE_QUOTES[0].rawText, "food"),
  )
  const [aiAdvice, setAiAdvice] = useState<{
    summary: string
    tips: string[]
  } | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)

  const comparison = useMemo(
    () => compareQuoteToPlan(analyzedQuote, plan),
    [analyzedQuote, plan],
  )

  const handleSelectSample = (idx: number) => {
    setActiveSampleIdx(idx)
    const sample = SAMPLE_QUOTES[idx]
    setRawText(sample.rawText)
    setCategoryHint(sample.category)
    const parsed = parseVendorQuote(sample.rawText, sample.category)
    setAnalyzedQuote(parsed)
    setAiAdvice(null)
  }

  const handleAudit = async () => {
    setLoadingAi(true)
    try {
      const res = await fetch("/api/vendor-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          categoryHint,
          currentPlan: {
            budget: plan.budget,
            guests: plan.guests,
            months: plan.months,
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.parsedQuote) {
          setAnalyzedQuote(data.parsedQuote)
          onAddQuote(data.parsedQuote)
        }
        if (data.aiNegotiationAdvice) setAiAdvice(data.aiNegotiationAdvice)
      }
    } catch {
      // Deterministic fallback already active
    } finally {
      setLoadingAi(false)
    }
  }

  return (
    <section className="workspace-section vendor-section" id="quotes">
      <div className="section-heading">
        <div>
          <span className="kicker">
            Vendor intelligence · Kerala market rates
          </span>
          <h2>Audit quotes against verified allocations.</h2>
        </div>
        <span className="prototype-label">
          Deterministic GST & contract risk extraction
        </span>
      </div>
      <div className="vendor-layout">
        <div>
          <small
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              color: "var(--muted)",
            }}
          >
            Load realistic Kerala celebration quote:
          </small>
          <div className="sample-quote-picker">
            {SAMPLE_QUOTES.map((sample, idx) => (
              <button
                key={sample.title}
                type="button"
                className={`sample-btn ${
                  activeSampleIdx === idx ? "is-active" : ""
                }`}
                onClick={() => handleSelectSample(idx)}
              >
                {sample.title}
              </button>
            ))}
          </div>
          <textarea
            className="quote-textarea"
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value)
              setAnalyzedQuote(parseVendorQuote(e.target.value, categoryHint))
            }}
            placeholder="Paste vendor contract or quotation text here..."
          />
          <div className="quote-actions-row">
            <span style={{ fontSize: 10, color: "var(--muted)" }}>
              Category: <b>{analyzedQuote.category.toUpperCase()}</b>
            </span>
            <button
              type="button"
              className="button primary green"
              style={{ padding: "9px 15px", fontSize: 11 }}
              disabled={loadingAi}
              onClick={handleAudit}
            >
              {loadingAi
                ? "✦ Auditing contract..."
                : "✦ Audit with Gemini 3.8 Flash"}
            </button>
          </div>
        </div>

        <div className="quote-audit-card">
          <div className="quote-audit-header">
            <div>
              <span className="kicker">{analyzedQuote.category} quotation</span>
              <h3>{analyzedQuote.vendorName}</h3>
            </div>
            <span
              className={`variance-badge ${
                comparison.isOverBudget ? "over-budget" : "under-budget"
              }`}
            >
              {comparison.isOverBudget
                ? `+${formatINR(comparison.variance)} Over Budget`
                : `${formatINR(Math.abs(comparison.variance))} Under Budget`}
            </span>
          </div>

          <div className="quote-stats-grid">
            <div>
              <small>Quoted Base</small>
              <strong>{formatINR(analyzedQuote.quotedAmount)}</strong>
            </div>
            <div>
              <small>GST Status</small>
              <strong style={{ fontSize: 16 }}>
                {analyzedQuote.gstIncluded
                  ? "Included"
                  : `+${analyzedQuote.gstRatePercent}% Extra`}
              </strong>
            </div>
            <div>
              <small>Advance Token</small>
              <strong>{formatINR(analyzedQuote.advanceAmount)}</strong>
              <span style={{ fontSize: 9, color: "var(--muted)" }}>
                ({analyzedQuote.advancePaymentPercent}% upfront)
              </span>
            </div>
          </div>

          <div>
            <small
              style={{
                display: "block",
                fontSize: 9,
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 6,
              }}
            >
              Category Budget Comparison
            </small>
            <p
              style={{
                fontSize: 12,
                color: "var(--ink)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {comparison.recommendation}
            </p>
          </div>

          {analyzedQuote.riskFlags.length > 0 && (
            <div>
              <small
                style={{
                  display: "block",
                  fontSize: 9,
                  textTransform: "uppercase",
                  color: "var(--risk)",
                  marginBottom: 6,
                }}
              >
                ⚠ Contract Risk & Hidden Fee Alerts:
              </small>
              <div className="risk-tags-list">
                {analyzedQuote.riskFlags.map((risk, i) => (
                  <span key={i} className="risk-tag">
                    {risk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {aiAdvice && (
            <div className="ai-advice-panel">
              <b>✦ Gemini 3.8 Flash Negotiation Strategy:</b>
              <span>{aiAdvice.summary}</span>
              <ul>
                {aiAdvice.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function EventMap({ location }: { location: string }) {
  const [selectedPin, setSelectedPin] = useState<"area" | "note">("area")
  return (
    <section className="workspace-section map-section" id="map">
      <div className="section-heading">
        <div>
          <span className="kicker">Place planner</span>
          <h2>Give the plan a sense of place.</h2>
        </div>
        <span className="prototype-label">Illustrative map · no live data</span>
      </div>
      <div className="map-canvas">
        <div className="map-grid" aria-hidden="true" />
        {location ? (
          <>
            <div className="map-road road-one" />
            <div className="map-road road-two" />
            <button
              className={`map-pin pin-main ${
                selectedPin === "area" ? "selected" : ""
              }`}
              aria-pressed={selectedPin === "area"}
              onClick={() => setSelectedPin("area")}
            >
              <i />
              <span>Your preferred area</span>
              <strong>{location}</strong>
            </button>
            <button
              className={`map-pin pin-note ${
                selectedPin === "note" ? "selected" : ""
              }`}
              aria-pressed={selectedPin === "note"}
              onClick={() => setSelectedPin("note")}
            >
              <i />
              <span>Planning note</span>
              <strong>Venue area to verify</strong>
            </button>
            <div className="map-annotation" key={selectedPin}>
              <b>{selectedPin === "area" ? location : "Venue research area"}</b>
              <br />
              {selectedPin === "area"
                ? "Preferred area supplied during setup."
                : "Illustrative stop awaiting user research."}
              <br />
              <small>No venues or routes are verified.</small>
            </div>
          </>
        ) : (
          <div className="map-empty">
            <div className="location-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <span className="kicker">Location still open</span>
            <h3>Choose an area when you’re ready.</h3>
            <p>
              Your plan can begin without a place. Add a preferred area later to
              organise venue research and planning stops.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function Timeline({
  months,
  customStatuses = {},
  onToggleStatus,
}: {
  months: number
  customStatuses?: Record<string, TaskStatus>
  onToggleStatus?: (taskId: string) => void
}) {
  const tasks = getTimeline(months, customStatuses)
  const feasibility = useMemo(
    () => analyzeScheduleFeasibility(months),
    [months],
  )
  const previousMonths = useRef(months)
  const [changedIndices, setChangedIndices] = useState<number[]>([])

  useEffect(() => {
    if (previousMonths.current !== months) {
      const oldTasks = getTimeline(previousMonths.current, customStatuses)
      const newTasks = getTimeline(months, customStatuses)
      const changed: number[] = []
      newTasks.forEach((task, idx) => {
        if (
          oldTasks[idx]?.due !== task.due ||
          previousMonths.current < 3 !== months < 3
        ) {
          changed.push(idx)
        }
      })
      previousMonths.current = months
      if (changed.length > 0) {
        setChangedIndices(changed)
        const timer = window.setTimeout(() => setChangedIndices([]), 1400)
        return () => window.clearTimeout(timer)
      }
    }
  }, [months, customStatuses])

  return (
    <section className="workspace-section journey-section" id="timeline">
      <div className="section-heading">
        <div>
          <span className="kicker">
            {months}-month planning window · DAG Scheduling Engine
          </span>
          <h2>The path to the celebration.</h2>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span
            className={`feasibility-badge ${
              feasibility.isFeasible ? "is-feasible" : "is-compressed"
            }`}
          >
            {feasibility.isFeasible
              ? `✓ Feasible (${feasibility.slackDays}d buffer)`
              : `⚠ Compression Alert (${Math.abs(feasibility.slackDays)}d deficit)`}
          </span>
          {months < 3 && (
            <span className="timeline-risk">
              Compressed timeline · attention needed
            </span>
          )}
        </div>
      </div>
      <div className="journey">
        {tasks.map((task, index) => (
          <article
            className={`${months < 3 && index < 4 ? "task-urgent" : ""} ${
              changedIndices.includes(index) ? "task-date-changed" : ""
            }`}
            key={task.title}
          >
            <div className="journey-point">
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="journey-copy">
              <small>{task.due}</small>
              <h3>
                {task.title}
                {task.isCriticalPath && (
                  <span
                    className="critical-tag"
                    title="On Critical Path: delays affect completion date"
                  >
                    Critical Path
                  </span>
                )}
              </h3>
              {task.dependency && (
                <p>
                  Depends on: <b>{task.dependency.replace("After ", "")}</b>
                </p>
              )}
            </div>
            <button
              type="button"
              className={`task-status status-${index}`}
              style={{ cursor: "pointer", background: "none" }}
              title="Click to cycle task status"
              onClick={() => onToggleStatus && onToggleStatus(task.id)}
            >
              {task.status}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function AdaptDrawer({
  current,
  currentLabel,
  setup,
  lockedKeys = [],
  onClose,
  onAccept,
}: {
  current: Plan
  currentLabel: string
  setup: Setup
  lockedKeys?: string[]
  onClose: () => void
  onAccept: (plan: Plan) => void
}) {
  const [budget, setBudget] = useState(current.budget)
  const [guests, setGuests] = useState(current.guests)
  const [months, setMonths] = useState(current.months)
  const [activeLockedKeys, setActiveLockedKeys] = useState<string[]>(lockedKeys)
  const [selectedScenarioPlan, setSelectedScenarioPlan] = useState<Plan | null>(
    null,
  )
  const [closing, setClosing] = useState<"accept" | "cancel" | null>(null)

  // Natural language plan adjustment state
  const [intentInput, setIntentInput] = useState("")
  const [intentLoading, setIntentLoading] = useState(false)
  const [intentSummary, setIntentSummary] = useState<string | null>(null)

  // Synchronous recalculation with locked categories support and explicit scenario proposal
  const proposal = useMemo(() => {
    if (selectedScenarioPlan) return selectedScenarioPlan
    return adaptPlan(budget, guests, months, activeLockedKeys)
  }, [budget, guests, months, activeLockedKeys, selectedScenarioPlan])
  const proposedSpend = sumPlan(proposal)
  const balance = budget - proposedSpend
  const changed =
    budget !== current.budget ||
    guests !== current.guests ||
    months !== current.months ||
    activeLockedKeys.length !== lockedKeys.length
  const invalid = budget < 300000 || guests < 20 || guests > 500

  // Multi-scenario trade-off generation
  const tradeOffScenarios = useMemo(() => {
    if (balance >= 0) return []
    return generateTradeOffScenarios(proposal, activeLockedKeys)
  }, [proposal, balance, activeLockedKeys])

  const handleApplyIntent = async () => {
    if (!intentInput.trim()) return
    setIntentLoading(true)
    try {
      const res = await fetch("/api/plan-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: intentInput,
          currentPlan: { budget, guests, months, lockedKeys: activeLockedKeys },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.intent?.recognized) {
          if (data.financials?.budget) setBudget(data.financials.budget)
          if (data.financials?.guests) setGuests(data.financials.guests)
          if (data.financials?.months) setMonths(data.financials.months)
          if (
            Array.isArray(data.intent.lockedCategories) &&
            data.intent.lockedCategories.length > 0
          ) {
            setActiveLockedKeys((prev) =>
              Array.from(new Set([...prev, ...data.intent.lockedCategories])),
            )
          }
          setIntentSummary(`✓ Interpreted: ${data.intent.summary}`)
        } else {
          setIntentSummary(
            data.intent?.summary || "Could not parse numerical changes.",
          )
        }
      }
    } catch {
      setIntentSummary("Could not connect to plan intent service.")
    } finally {
      setIntentLoading(false)
    }
  }

  // Gemini AI Recommendation state & cache
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<RecommendationResponse | null>(
    null,
  )
  const [aiRequested, setAiRequested] = useState(false)
  const cacheRef = useRef<Map<string, RecommendationResponse>>(new Map())

  const fetchRecommendations = async (forceFresh = false) => {
    if (invalid) return
    const cacheKey = `${budget}:${guests}:${months}:${setup.priorities.join(",")}:${activeLockedKeys.join(",")}`
    if (!forceFresh && cacheRef.current.has(cacheKey)) {
      setAiResponse(cacheRef.current.get(cacheKey)!)
      setAiRequested(true)
      return
    }

    setAiLoading(true)
    setAiRequested(true)

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget,
          guests,
          months,
          lockedKeys: activeLockedKeys,
          context: {
            occasion: setup.occasion,
            location: setup.location,
            priorities: setup.priorities,
            requirements: setup.requirements,
          },
        }),
      })

      if (res.ok) {
        const data: RecommendationResponse = await res.json()
        cacheRef.current.set(cacheKey, data)
        setAiResponse(data)
      }
    } catch (err) {
      console.warn(
        "AI recommendation request failed; using deterministic fallback",
        err,
      )
    } finally {
      setAiLoading(false)
    }
  }

  // When AI mode is active, automatically refresh with debounce as scenario values settle
  useEffect(() => {
    if (!aiRequested || !changed || invalid) return
    const cacheKey = `${budget}:${guests}:${months}:${setup.priorities.join(",")}`
    if (cacheRef.current.has(cacheKey)) {
      setAiResponse(cacheRef.current.get(cacheKey)!)
      return
    }

    const timer = window.setTimeout(() => {
      fetchRecommendations(false)
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [budget, guests, months, aiRequested, changed, invalid])

  // Track changed timeline tasks
  const timelineChanged = useMemo(() => {
    const oldTimeline = getTimeline(current.months)
    const newTimeline = getTimeline(months)
    return newTimeline.filter((t, i) => t.due !== oldTimeline[i]?.due)
  }, [current.months, months])

  const handleClose = () => {
    if (closing) return
    setClosing("cancel")
    window.setTimeout(() => {
      onClose()
    }, 180)
  }

  const handleAccept = () => {
    if (closing || !changed || invalid) return
    setClosing("accept")
    window.setTimeout(() => {
      onAccept(proposal)
    }, 180)
  }

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose()
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [closing])

  return (
    <div
      className={`drawer-layer ${closing ? "is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="adapt-title"
    >
      <button
        className="scrim"
        aria-label="Close adaptation preview"
        onClick={handleClose}
      />
      <aside className="drawer">
        <header className="drawer-head">
          <div>
            <span className="kicker">A calm way to reconsider</span>
            <h2 id="adapt-title">What if things change?</h2>
          </div>
          <button
            className="icon-button"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <p className="drawer-intro">
          Change the circumstances, not the whole plan. Food quality stays
          protected while every trade-off remains visible.
        </p>

        <div className="intent-box">
          <label>
            <span>Express changes in plain English (Gemini 3.8 Flash)</span>
            <div className="intent-input-row">
              <input
                type="text"
                placeholder="e.g. Reduce budget by ₹50,000 and lock photography"
                value={intentInput}
                onChange={(e) => setIntentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleApplyIntent()
                  }
                }}
              />
              <button
                type="button"
                className="intent-submit-btn"
                disabled={intentLoading || !intentInput.trim()}
                onClick={handleApplyIntent}
              >
                {intentLoading ? "✦ Interpreting..." : "✦ Interpret"}
              </button>
            </div>
          </label>
          {intentSummary && (
            <div className="intent-result-banner">{intentSummary}</div>
          )}
        </div>

        <div className="controls">
          <label>
            <span>
              Total budget <strong>{formatINR(budget)}</strong>
            </span>
            <input
              type="range"
              min="300000"
              max="1200000"
              step="10000"
              value={budget}
              onChange={(e) => {
                setSelectedScenarioPlan(null)
                setBudget(Number(e.target.value))
              }}
            />
          </label>
          <label>
            <span>Number of guests</span>
            <input
              type="number"
              min="20"
              max="500"
              value={guests}
              onChange={(e) => {
                setSelectedScenarioPlan(null)
                setGuests(Number(e.target.value))
              }}
            />
          </label>
          <label>
            <span>Time remaining</span>
            <select
              value={months}
              onChange={(e) => {
                setSelectedScenarioPlan(null)
                setMonths(Number(e.target.value))
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <option key={value} value={value}>
                  {value} month{value > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            className="reset-link"
            type="button"
            onClick={() => {
              setSelectedScenarioPlan(null)
              setBudget(originalPlan.budget)
              setGuests(originalPlan.guests)
              setMonths(originalPlan.months)
            }}
          >
            Restore original ₹8L / 200 scenario
          </button>
        </div>
        {invalid ? (
          <div className="validation" role="alert">
            Enter a budget of at least ₹3,00,000 and between 20–500 guests.
          </div>
        ) : !changed ? (
          <div className="empty-preview" aria-live="polite">
            <strong>Your {currentLabel.toLowerCase()} is unchanged.</strong>
            <span>
              Try ₹6,40,000 and 230 guests to see the pressure clearly.
            </span>
          </div>
        ) : (
          <div className="preview" aria-live="polite">
            <div className="compare">
              <div className="compare-card baseline">
                <small>{currentLabel}</small>
                <strong className="value-update" key={`curr-${current.budget}`}>
                  {formatINR(current.budget)}
                </strong>
                <span>
                  {current.guests} guests · {current.months} months
                </span>
              </div>
              <b className="compare-arrow" aria-hidden="true">
                →
              </b>
              <div className="compare-card proposed">
                <span className="proposed-badge">Proposed</span>
                <small>Adjusted scenario</small>
                <strong className="value-update" key={`prop-${budget}`}>
                  {formatINR(budget)}
                </strong>
                <span>
                  {guests} guests · {months} months
                </span>
              </div>
            </div>
            <div className={`proposal-balance ${balance < 0 ? "risk" : ""}`}>
              <span>
                {balance < 0
                  ? "Unresolved deficit"
                  : "Estimated room remaining"}
              </span>
              <strong className="value-update" key={`bal-${balance}`}>
                {balance < 0
                  ? `−${formatINR(Math.abs(balance))}`
                  : formatINR(balance)}
              </strong>
              {balance < 0 && (
                <span
                  className="deficit-badge"
                  aria-label="Warning: over budget"
                >
                  <span aria-hidden="true">⚠</span> Over budget
                </span>
              )}
              <small>{formatINR(proposedSpend)} proposed allocation</small>
            </div>
            <div className="change-list">
              {proposal.categories.map((category, index) => {
                const difference =
                  category.amount - current.categories[index].amount
                const isAffected = difference !== 0
                return (
                  <div
                    className={isAffected ? "affected" : ""}
                    key={category.key}
                  >
                    <span>{category.name}</span>
                    <strong>
                      {difference === 0
                        ? "No change"
                        : `${
                            difference > 0 ? "+" : "−"
                          }${formatINR(Math.abs(difference))}`}
                    </strong>
                  </div>
                )
              })}
            </div>

            {balance < 0 && tradeOffScenarios.length > 0 && (
              <div className="scenarios-section">
                <div className="scenarios-heading">
                  <span className="kicker">
                    Deterministic Trade-Off Options
                  </span>
                  <small>3 Mathematically Verified Scenarios</small>
                </div>
                <div className="scenarios-list">
                  {tradeOffScenarios.map((sc) => (
                    <article key={sc.id} className="scenario-card">
                      <div className="scenario-header">
                        <h4 className="scenario-title">{sc.title}</h4>
                        <span className="scenario-badge">{sc.badge}</span>
                      </div>
                      <p className="scenario-desc">{sc.description}</p>
                      <button
                        type="button"
                        className="scenario-apply-btn"
                        onClick={() => {
                          setBudget(sc.proposedPlan.budget)
                          setGuests(sc.proposedPlan.guests)
                          setMonths(sc.proposedPlan.months)
                          setSelectedScenarioPlan(sc.proposedPlan)
                        }}
                      >
                        Preview & Apply {sc.title} →
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}
            {aiResponse ? (
              <div
                className={`recommendation ${aiLoading ? "ai-loading" : ""}`}
              >
                <div className="recommendation-header">
                  <span className="kicker">
                    {aiResponse.isAiGenerated
                      ? "Gemini 3.8 Flash analysis"
                      : "Deterministic recommendation"}
                  </span>
                  <span
                    className={`ai-badge ${
                      aiResponse.isAiGenerated
                        ? "ai-badge-live"
                        : "ai-badge-fallback"
                    }`}
                  >
                    {aiResponse.isAiGenerated
                      ? "✦ Live Gemini 3.8"
                      : "Ground-truth math"}
                  </span>
                </div>
                <h3>{aiResponse.recommendations.headline}</h3>
                <p>{aiResponse.recommendations.analysis}</p>
                <ul>
                  <li>
                    <b>Protected</b>
                    <span>{aiResponse.recommendations.protectedInsight}</span>
                  </li>
                  <li>
                    <b>Trade-off</b>
                    <span>{aiResponse.recommendations.tradeOffs}</span>
                  </li>
                  {aiResponse.recommendations.decisions.map((decision, idx) => (
                    <li key={idx}>
                      <b>{idx === 0 ? "Recommendation" : "Alternative"}</b>
                      <span>{decision}</span>
                    </li>
                  ))}
                  {aiResponse.recommendations.timelineNote && (
                    <li className="affected-task">
                      <b>Timeline effect</b>
                      <span>{aiResponse.recommendations.timelineNote}</span>
                    </li>
                  )}
                </ul>
                <div className="ai-actions">
                  <button
                    type="button"
                    className="ai-refresh-button"
                    disabled={aiLoading}
                    onClick={() => fetchRecommendations(true)}
                  >
                    {aiLoading
                      ? "Analyzing scenario..."
                      : "↻ Re-analyze with Gemini"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="recommendation">
                <div className="recommendation-header">
                  <span className="kicker">Illustrative recommendation</span>
                  <span className="ai-badge ai-badge-fallback">
                    Baseline rules
                  </span>
                </div>
                <h3>
                  {balance < 0
                    ? "The current constraints cannot all be satisfied."
                    : "The plan can absorb this change."}
                </h3>
                <p>
                  {budget < current.budget && guests > current.guests
                    ? `Adding ${guests - current.guests} guests while removing ${formatINR(current.budget - budget)} puts direct pressure on adjustable categories.`
                    : "The allocation responds to the new guest count while preserving the prototype food-quality rule."}
                </p>
                <ul>
                  <li>
                    <b>Protected</b>
                    <span>
                      Food quality at an illustrative ₹1,500 per guest
                    </span>
                  </li>
                  <li>
                    <b>Likely adjustment</b>
                    <span>Decoration scope and photography coverage</span>
                  </li>
                  <li>
                    <b>Needs your decision</b>
                    <span>
                      {balance < 0
                        ? guests > 200
                          ? `Trimming guests from ${guests} to ${guests - 30} saves ₹45,000 on catering, leaving ₹7,000 of the ₹52,000 deficit.`
                          : "Raise budget, reduce guests, or make a further cut"
                        : "Review proposed category allocations"}
                    </span>
                  </li>
                  {timelineChanged.length > 0 && (
                    <li className="affected-task">
                      <b>Timeline effect</b>
                      <span>
                        {months < 3
                          ? `Compressed timeline: ${timelineChanged.length} vendor tasks accelerated.`
                          : `Expanded timeline: ${timelineChanged.length} vendor tasks given standard window.`}
                      </span>
                    </li>
                  )}
                </ul>
                <div className="ai-consult-banner">
                  <button
                    type="button"
                    className="ai-consult-button"
                    disabled={aiLoading}
                    onClick={() => fetchRecommendations(false)}
                  >
                    {aiLoading
                      ? "✦ Consulting Gemini 3.8 Flash..."
                      : "✦ Explain trade-offs with Gemini 3.8 Flash"}
                  </button>
                </div>
              </div>
            )}
            <div className="calc-note">
              <b>Calculated:</b> category totals and balance (deterministic
              math).{" "}
              {aiResponse?.isAiGenerated ? (
                <>
                  <b>Context:</b> powered by Gemini 3.8 Flash with verified
                  mathematical ground truth.
                </>
              ) : (
                <>
                  <b>Context:</b> live AI trade-off analysis available via
                  Gemini 3.8 Flash.
                </>
              )}
            </div>
          </div>
        )}
        <footer className="drawer-actions">
          <button className="button quiet" onClick={handleClose}>
            Keep current plan
          </button>
          <button
            className="button primary green"
            disabled={!changed || invalid || !!closing}
            onClick={handleAccept}
          >
            {closing === "accept" ? "Applying..." : "Accept changes"}
          </button>
        </footer>
      </aside>
    </div>
  )
}

function Workspace({
  setup,
  plan,
  accepted,
  lockedKeys = [],
  vendorQuotes = [],
  customTaskStatuses = {},
  onToggleLock,
  onAddQuote,
  onToggleStatus,
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
  onToggleLock?: (key: string) => void
  onAddQuote?: (quote: VendorQuote) => void
  onToggleStatus?: (taskId: string) => void
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
        </div>
        <nav aria-label="Workspace navigation">
          {[
            ["Overview", "#overview"],
            ["Budget", "#budget"],
            ["Quotes", "#quotes"],
            ["Place", "#map"],
            ["Timeline", "#timeline"],
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
        <div className="reveal">
          <BudgetPlanner
            plan={plan}
            lockedKeys={lockedKeys}
            onToggleLock={onToggleLock}
          />
        </div>
        <div className="reveal">
          <VendorQuotesSection
            plan={plan}
            quotes={vendorQuotes}
            onAddQuote={onAddQuote || (() => undefined)}
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
            onToggleStatus={onToggleStatus}
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

export default function App() {
  const [initialLoaded] = useState(() => loadStoredAppState())
  const [stage, setStage] = useState<Stage>(() =>
    initialLoaded ? "workspace" : "landing",
  )
  const [setup, setSetup] = useState<Setup>(
    () => initialLoaded?.setup || DEFAULT_SETUP,
  )
  const [plan, setPlan] = useState<Plan>(
    () => initialLoaded?.plan || originalPlan,
  )
  const [accepted, setAccepted] = useState<boolean>(() =>
    Boolean(initialLoaded?.accepted),
  )
  const [lockedKeys, setLockedKeys] = useState<string[]>(
    () => initialLoaded?.lockedKeys || [],
  )
  const [vendorQuotes, setVendorQuotes] = useState<VendorQuote[]>(
    () => initialLoaded?.vendorQuotes || [],
  )
  const [customTaskStatuses, setCustomTaskStatuses] =
    useState<Record<string, TaskStatus>>(
      () => initialLoaded?.customTaskStatuses || {},
    )

  // Auto-save to localStorage with versioning
  useEffect(() => {
    saveStoredAppState({
      version: 2,
      lastUpdated: new Date().toISOString(),
      setup,
      plan,
      accepted,
      lockedKeys,
      vendorQuotes,
      customTaskStatuses,
      history: [],
    })
  }, [setup, plan, accepted, lockedKeys, vendorQuotes, customTaskStatuses])

  const handleToggleLock = (key: string) => {
    setLockedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const handleAddQuote = (quote: VendorQuote) => {
    setVendorQuotes((prev) => [quote, ...prev.filter((q) => q.id !== quote.id)])
  }

  const handleToggleTaskStatus = (taskId: string) => {
    const cycle: Record<TaskStatus, TaskStatus> = {
      "Not started": "In progress",
      "In progress": "Needs review",
      "Needs review": "Completed",
      Completed: "Not started",
    }
    setCustomTaskStatuses((prev) => {
      const current = prev[taskId] || "Not started"
      return { ...prev, [taskId]: cycle[current] }
    })
  }

  const handleResetDemo = () => {
    // Reset to benchmark Kerala Wedding demo: ₹6,40,000, 230 guests, 4 months
    const demoSetup: Setup = {
      occasion: "Wedding",
      date: "4-month planning window",
      months: 4,
      guests: 230,
      location: "Kochi, Kerala",
      budget: 640000,
      priorities: ["Food and catering", "Photography"],
      requirements:
        "Traditional vegetarian sadya feast; protect catering quality.",
    }
    const demoPlan = adaptPlan(640000, 230, 4, ["food"])
    setSetup(demoSetup)
    setPlan(demoPlan)
    setAccepted(false)
    setLockedKeys(["food"])
    setCustomTaskStatuses({})
    setStage("workspace")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (stage === "landing") return <Landing onStart={() => setStage("setup")} />
  if (stage === "setup")
    return (
      <SetupFlow
        value={setup}
        onChange={setSetup}
        onExit={() => setStage("landing")}
        onComplete={() => {
          setPlan(
            adaptPlan(setup.budget, setup.guests, setup.months, lockedKeys),
          )
          setAccepted(false)
          setStage("workspace")
          window.scrollTo(0, 0)
        }}
      />
    )
  return (
    <Workspace
      setup={setup}
      plan={plan}
      accepted={accepted}
      lockedKeys={lockedKeys}
      vendorQuotes={vendorQuotes}
      customTaskStatuses={customTaskStatuses}
      onToggleLock={handleToggleLock}
      onAddQuote={handleAddQuote}
      onToggleStatus={handleToggleTaskStatus}
      onResetDemo={handleResetDemo}
      onAdapt={() => undefined}
      onHome={() => setStage("landing")}
      onAccept={(next) => {
        setPlan(next)
        setAccepted(!isOriginalPlan(next))
      }}
    />
  )
}
