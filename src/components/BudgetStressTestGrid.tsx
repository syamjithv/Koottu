import type { StressTestScenario } from "../data.ts"
import { formatINR } from "../data.ts"

export function BudgetStressTestGrid({
  stressScenarios,
  showStressTests,
  onToggle,
}: {
  stressScenarios: StressTestScenario[]
  showStressTests: boolean
  onToggle: () => void
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <button
        type="button"
        className="scenario-apply-btn"
        aria-expanded={showStressTests}
        aria-controls="budget-stress-grid"
        style={{ width: "100%", textAlign: "center", padding: "8px 12px" }}
        onClick={onToggle}
      >
        {showStressTests ? "▲ Hide" : "⚡ Simulate"} Budget Stress Scenarios
        (+20% Guests, Venue Surge, Monsoon Emergency)
      </button>

      {showStressTests && (
        <div
          id="budget-stress-grid"
          className="stress-grid"
          aria-live="polite"
        >
          {stressScenarios.map((sc) => (
            <div key={sc.id} className="stress-card">
              <h4>{sc.title}</h4>
              <p>{sc.description}</p>
              <div>
                <small style={{ color: "var(--muted)", display: "block" }}>
                  Calculated Impact:
                </small>
                <span className="stress-deficit">
                  {sc.resultingDeficit > 0
                    ? `Deficit: -${formatINR(sc.resultingDeficit)}`
                    : "Balanced"}
                </span>
              </div>
              <div
                style={{ marginTop: 4, fontSize: 10, color: "var(--muted)" }}
              >
                {sc.impactSummary}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

