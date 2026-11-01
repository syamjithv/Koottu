import { useState, useMemo, useRef, useEffect } from "react"
import type { Plan, Setup, RecommendationResponse, UnifiedEventPlan } from "../data.ts"
import {
  adaptPlan,
  sumPlan,
  formatINR,
  generateTradeOffScenarios,
  simulateDecisionImpact,
  getTimeline,
  originalPlan,
} from "../data.ts"
import { CulturalIdeasBox } from "./CulturalIdeasBox.tsx"
import { AskAdvisorBox } from "./AskAdvisorBox.tsx"
import { DrawerScenarioCards } from "./DrawerScenarioCards.tsx"

export function AdaptDrawer({
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
    activeLockedKeys.length !== lockedKeys.length ||
    selectedScenarioPlan !== null
  const invalid = budget < 300000 || guests < 20 || guests > 500

  // Multi-scenario trade-off generation
  const tradeOffScenarios = useMemo(() => {
    if (balance >= 0) return []
    return generateTradeOffScenarios(proposal, activeLockedKeys)
  }, [proposal, balance, activeLockedKeys])

  const decisionImpact = useMemo(() => {
    if (!changed && !selectedScenarioPlan && balance >= 0) return null
    const dummyPlan: UnifiedEventPlan = {
      id: "drawer-plan",
      version: 3,
      createdAt: "",
      lastUpdated: "",
      identity: {
        title: "",
        occasion: setup.occasion,
        date: setup.date,
        months: current.months,
        location: setup.location,
        guests: current.guests,
        budget: current.budget,
        priorities: setup.priorities,
        requirements: setup.requirements,
      },
      financials: {
        totalBudget: current.budget,
        totalAllocated: sumPlan(current),
        totalActualSpent: 0,
        contingencyReserve: Math.round(current.budget * 0.05),
        unallocatedAmount: Math.max(0, current.budget - sumPlan(current)),
        netBalance: current.budget - sumPlan(current),
        isDeficit: current.budget - sumPlan(current) < 0,
        deficitAmount: Math.max(0, sumPlan(current) - current.budget),
        foodPerPerson: 1500,
      },
      contingency: {
        percent: 5,
        reserveAmount: Math.round(current.budget * 0.05),
        isManual: false,
      },
      categories: current.categories.map((c) => ({ ...c })),
      lockedKeys,
      tradeOffScenarios: [],
      tasks: [],
      timelineFeasibility: {
        isFeasible: true,
        totalDurationDays: 69,
        availableDays: 120,
        slackDays: 51,
        criticalPathTaskIds: [],
        cycleDetected: false,
        conflicts: [],
        summary: "",
      },
      vendors: [],
      acceptedQuotes: {},
      runSheet: [],
      ideas: [],
      readiness: {
        overallScore: 78,
        budgetScore: 20,
        timelineScore: 25,
        vendorScore: 15,
        taskScore: 18,
        riskDeductions: 0,
        reasons: [],
        summary: "",
      },
      insights: [],
      history: [],
      planningStatus: "adapting",
    }
    return simulateDecisionImpact(dummyPlan, {
      budgetDelta: budget - current.budget,
      guestDelta: guests - current.guests,
      monthsDelta: months - current.months,
      lockedKeys: activeLockedKeys,
    })
  }, [
    current,
    budget,
    guests,
    months,
    activeLockedKeys,
    setup,
    changed,
    lockedKeys,
  ])

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
                aria-label="Express plan changes in plain English"
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
            <div
              className="intent-result-banner"
              role="status"
              aria-live="polite"
            >
              {intentSummary}
            </div>
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
        ) : !changed && balance >= 0 && !selectedScenarioPlan ? (
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

            {decisionImpact && (
              <div
                style={{
                  background: "var(--paper2)",
                  border: "1px solid var(--line)",
                  padding: 12,
                  borderRadius: 4,
                  margin: "12px 0",
                  fontSize: 11,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <strong style={{ color: "var(--ink)" }}>
                    ⚡ Decision Impact Preview
                  </strong>
                  <span
                    style={{
                      fontSize: 10,
                      color:
                        decisionImpact.deltas.readinessScoreDelta >= 0
                          ? "var(--forest)"
                          : "var(--coral)",
                      fontWeight: 700,
                    }}
                  >
                    Readiness:{" "}
                    {decisionImpact.deltas.readinessScoreDelta >= 0
                      ? `+${decisionImpact.deltas.readinessScoreDelta}`
                      : decisionImpact.deltas.readinessScoreDelta}{" "}
                    pts
                  </span>
                </div>
                <p
                  style={{
                    margin: "2px 0 6px",
                    color: "var(--ink)",
                    lineHeight: 1.4,
                  }}
                >
                  {decisionImpact.impactExplanation}
                </p>
                <small
                  style={{
                    color: decisionImpact.after.isDeficit
                      ? "var(--coral)"
                      : "var(--forest)",
                    fontWeight: 600,
                  }}
                >
                  {decisionImpact.recommendation}
                </small>
              </div>
            )}
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

            {balance < 0 && (
              <DrawerScenarioCards
                tradeOffScenarios={tradeOffScenarios}
                onApplyScenario={(sc) => {
                  setBudget(sc.proposedPlan.budget)
                  setGuests(sc.proposedPlan.guests)
                  setMonths(sc.proposedPlan.months)
                  setSelectedScenarioPlan(sc.proposedPlan)
                }}
              />
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

            <CulturalIdeasBox
              occasion={setup.occasion}
              budget={budget}
              guests={guests}
            />
            <AskAdvisorBox currentPlan={proposal} />
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

