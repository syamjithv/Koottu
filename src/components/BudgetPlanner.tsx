import { useEffect, useMemo, useRef, useState } from "react"
import type { Plan, UnifiedEventPlan } from "../data.ts"
import { sumPlan, formatINR, runBudgetStressTests } from "../data.ts"
import { BudgetStressTestGrid } from "./BudgetStressTestGrid.tsx"

export function BudgetPlanner({
  plan,
  lockedKeys = [],
  contingencyPercent = 5,
  onUpdateContingency,
  onToggleLock,
}: {
  plan: Plan
  lockedKeys?: string[]
  contingencyPercent?: number
  onUpdateContingency?: (pct: number) => void
  onToggleLock?: (key: string) => void
}) {
  const [selected, setSelected] = useState(plan.categories[1].key)
  const [showStressTests, setShowStressTests] = useState(false)
  const spent = sumPlan(plan)
  const contingencyReserve = Math.round(
    (plan.budget * contingencyPercent) / 100,
  )
  const remaining = plan.budget - (spent + contingencyReserve)
  const detail =
    plan.categories.find((item) => item.key === selected) || plan.categories[0]
  const colors = ["forest", "coral", "saffron", "sage", "sand"]

  // Track previous category amounts to highlight only genuinely changed allocations
  const previousAmounts = useRef<Record<string, number>>({})
  const [changedKeys, setChangedKeys] = useState<string[]>([])

  const stressScenarios = useMemo(() => {
    const dummyPlan: UnifiedEventPlan = {
      id: "view-plan",
      version: 3,
      createdAt: "",
      lastUpdated: "",
      identity: {
        title: "",
        occasion: "Wedding",
        date: "",
        months: plan.months,
        location: "",
        guests: plan.guests,
        budget: plan.budget,
        priorities: [],
        requirements: "",
      },
      financials: {
        totalBudget: plan.budget,
        totalAllocated: spent,
        totalActualSpent: 0,
        contingencyReserve,
        unallocatedAmount: Math.max(0, remaining),
        netBalance: remaining,
        isDeficit: remaining < 0,
        deficitAmount: remaining < 0 ? Math.abs(remaining) : 0,
        foodPerPerson: 1500,
      },
      contingency: {
        percent: contingencyPercent,
        reserveAmount: contingencyReserve,
        isManual: false,
      },
      categories: plan.categories.map((c) => ({ ...c })),
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
        overallScore: 80,
        budgetScore: 20,
        timelineScore: 25,
        vendorScore: 15,
        taskScore: 20,
        riskDeductions: 0,
        reasons: [],
        summary: "",
      },
      insights: [],
      history: [],
      planningStatus: "configured",
    }
    return runBudgetStressTests(dummyPlan)
  }, [
    plan,
    spent,
    contingencyReserve,
    remaining,
    contingencyPercent,
    lockedKeys,
  ])

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
            <div
              key={category.key}
              className={`budget-legend-cell ${
                selected === category.key ? "active" : ""
              } ${
                changedKeys.includes(category.key) ? "allocation-changed" : ""
              }`}
            >
              <button
                type="button"
                className="budget-legend-btn"
                onClick={() => setSelected(category.key)}
                aria-pressed={selected === category.key}
                aria-label={`Select ${category.name}, allocation ${formatINR(category.amount)}`}
              >
                <i className={colors[index]} />
                <span>{category.name}</span>
                <b>{formatINR(category.amount)}</b>
              </button>
              {onToggleLock && (
                <button
                  type="button"
                  className={`category-lock-btn ${isLocked ? "is-locked" : ""}`}
                  onClick={() => onToggleLock(category.key)}
                  aria-pressed={isLocked}
                  aria-label={
                    isLocked
                      ? `Unlock ${category.name} allocation`
                      : `Lock ${category.name} allocation against reductions`
                  }
                  title={
                    isLocked
                      ? "Category locked against budget reductions"
                      : "Lock this allocation"
                  }
                >
                  {isLocked ? "🔒" : "🔓"}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="contingency-bar">
        <div>
          <strong style={{ color: "var(--ink)", display: "block" }}>
            Contingency Reserve: {contingencyPercent}% (
            {formatINR(contingencyReserve)})
          </strong>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>
            Emergency reserve buffer for unexpected food inflation or monsoon
            setups.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={contingencyPercent}
            onChange={(e) =>
              onUpdateContingency && onUpdateContingency(Number(e.target.value))
            }
            aria-label="Contingency percentage slider"
            style={{ width: 100 }}
          />
          <span style={{ fontWeight: 700, minWidth: 30, textAlign: "right" }}>
            {contingencyPercent}%
          </span>
        </div>
      </div>

      <BudgetStressTestGrid
        stressScenarios={stressScenarios}
        showStressTests={showStressTests}
        onToggle={() => setShowStressTests(!showStressTests)}
      />
    </section>
  )
}

