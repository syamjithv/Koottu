import type { CategoryComparisonMatrix } from "../data.ts"
import { formatINR } from "../data.ts"

export function VendorComparisonMatrix({
  categoryHint,
  catAllocated,
  matrix,
}: {
  categoryHint: string
  catAllocated: number
  matrix: CategoryComparisonMatrix
}) {
  return (
    <div
      id="quote-comparison-matrix"
      role="region"
      aria-label="3-Quote value comparison"
      style={{
        marginTop: 16,
        background: "var(--card)",
        border: "1px solid var(--line)",
        padding: 16,
        borderRadius: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div>
          <strong style={{ fontSize: 13, color: "var(--ink)" }}>
            3-Quote Value Comparison ({categoryHint.toUpperCase()} Category)
          </strong>
          <small style={{ display: "block", color: "var(--muted)" }}>
            Category budget allocated: {formatINR(catAllocated)}
          </small>
        </div>
        <span className="prototype-label">
          Transparent Value Scoring (0-100)
        </span>
      </div>

      <p
        style={{
          fontSize: 11,
          color: "var(--forest)",
          background: "var(--paper2)",
          padding: "6px 10px",
          borderRadius: 3,
          margin: "6px 0 12px",
        }}
      >
        💡 <b>Engine Analysis:</b> {matrix.transparentReasoning}
      </p>

      <table className="quote-compare-table">
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Base Quote</th>
            <th>GST Status</th>
            <th>Effective Total</th>
            <th>Advance %</th>
            <th>Budget Variance</th>
            <th>Value Score</th>
          </tr>
        </thead>
        <tbody>
          {matrix.quotes.map((q) => (
            <tr
              key={q.quoteId}
              className={
                q.quoteId === matrix.recommendedQuoteId ? "is-best" : ""
              }
            >
              <td>
                <strong>{q.vendorName}</strong>
                {q.quoteId === matrix.recommendedQuoteId && (
                  <span
                    className="critical-tag"
                    style={{
                      background: "var(--forest)",
                      color: "#fff",
                      marginLeft: 6,
                    }}
                  >
                    Best Value
                  </span>
                )}
              </td>
              <td>{formatINR(q.baseCost)}</td>
              <td>
                {q.gstAmount === 0
                  ? "Included"
                  : `+${q.gstPercent}% (${formatINR(q.gstAmount)})`}
              </td>
              <td>
                <strong>{formatINR(q.effectiveTotal)}</strong>
              </td>
              <td>
                {q.advancePercent}% ({formatINR(q.advanceAmount)})
              </td>
              <td
                style={{
                  color: q.isUnderBudget ? "var(--forest)" : "var(--coral)",
                  fontWeight: 600,
                }}
              >
                {q.isUnderBudget
                  ? `-${formatINR(Math.abs(q.variance))}`
                  : `+${formatINR(q.variance)}`}
              </td>
              <td>
                <span style={{ fontWeight: 700, color: "var(--forest)" }}>
                  {q.valueScore}/100
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

