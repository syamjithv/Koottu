import { useState } from "react"
import type { Plan } from "../data.ts"
import { sumPlan } from "../data.ts"

export function AskAdvisorBox({ currentPlan }: { currentPlan: Plan }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [reply, setReply] = useState<string | null>(null)

  const handleAsk = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/planning-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          currentPlan: {
            identity: {
              occasion: "Wedding",
              budget: currentPlan.budget,
              guests: currentPlan.guests,
              months: currentPlan.months,
            },
            financials: {
              totalBudget: currentPlan.budget,
              isDeficit: sumPlan(currentPlan) > currentPlan.budget,
            },
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setReply(data.reply)
      }
    } catch {
      setReply(
        "Could not connect to planning advisor. Using deterministic ground truth.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        marginTop: 12,
        background: "var(--card)",
        border: "1px solid var(--line)",
        padding: 12,
        borderRadius: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong style={{ fontSize: 11, color: "var(--ink)" }}>
          ✦ Ask KOOTTU Advisor (Grounded Q&A)
        </strong>
        <button
          type="button"
          className="insight-action-btn"
          aria-expanded={open}
          aria-controls="advisor-panel"
          onClick={() => setOpen(!open)}
        >
          {open ? "Hide" : "Ask Question"}
        </button>
      </div>

      {open && (
        <div
          id="advisor-panel"
          role="region"
          aria-label="Planning advisor answers"
          style={{ marginTop: 10 }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              aria-label="Ask KOOTTU Advisor a question"
              placeholder="e.g. What is typical advance for Kochi caterers?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAsk()
                }
              }}
              style={{
                flex: 1,
                padding: "6px 8px",
                fontSize: 11,
                border: "1px solid var(--line)",
                borderRadius: 3,
              }}
            />
            <button
              type="button"
              className="button primary green"
              style={{ padding: "6px 12px", fontSize: 11 }}
              disabled={loading || !query.trim()}
              onClick={handleAsk}
            >
              {loading ? "Asking..." : "Ask"}
            </button>
          </div>
          {reply && (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: 8,
                background: "var(--paper2)",
                padding: 10,
                borderRadius: 3,
                fontSize: 11,
                lineHeight: 1.5,
                color: "var(--ink)",
                whiteSpace: "pre-wrap",
              }}
            >
              {reply}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

