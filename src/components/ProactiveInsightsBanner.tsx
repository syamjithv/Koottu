import type { ProactiveInsight } from "../data.ts"

export function ProactiveInsightsBanner({
  insights,
  onNavigate,
}: {
  insights: ProactiveInsight[]
  onNavigate: (destination: string) => void
}) {
  if (insights.length === 0) return null

  const activeInsights = insights.filter((i) => !i.resolved).slice(0, 3)
  if (activeInsights.length === 0) return null

  return (
    <div className="insights-strip" aria-label="Proactive celebration alerts">
      {activeInsights.map((insight) => (
        <aside
          key={insight.id}
          className={`insight-card severity-${insight.severity}`}
          role="alert"
        >
          <div className="insight-content">
            <span className="insight-title">
              {insight.severity === "critical" && "🚨 "}
              {insight.severity === "warning" && "⚠ "}
              {insight.severity === "info" && "ℹ "}
              {insight.severity === "success" && "✓ "}
              {insight.title}
            </span>
            <span className="insight-desc">{insight.explanation}</span>
          </div>
          {insight.actionDestination && (
            <button
              type="button"
              className="insight-action-btn"
              onClick={() => onNavigate(insight.actionDestination!)}
            >
              {insight.recommendedAction} ↗
            </button>
          )}
        </aside>
      ))}
    </div>
  )
}

