import type { TradeOffScenario } from "../data.ts"

export function DrawerScenarioCards({
  tradeOffScenarios,
  onApplyScenario,
}: {
  tradeOffScenarios: TradeOffScenario[]
  onApplyScenario: (sc: TradeOffScenario) => void
}) {
  if (tradeOffScenarios.length === 0) return null

  return (
    <div className="scenarios-section">
      <div className="scenarios-heading">
        <span className="kicker">Deterministic Trade-Off Options</span>
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
              onClick={() => onApplyScenario(sc)}
            >
              Preview & Apply {sc.title} →
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}

