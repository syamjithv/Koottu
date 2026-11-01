import { useState } from "react"
import type { EventIdea } from "../data.ts"
import { DEFAULT_CULTURAL_IDEAS } from "../data.ts"

export function CulturalIdeasBox({
  occasion,
  budget,
  guests,
}: {
  occasion: string
  budget: number
  guests: number
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<EventIdea[]>(DEFAULT_CULTURAL_IDEAS)
  const [savedIds, setSavedIds] = useState<string[]>([])

  const handleFetchIdeas = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/event-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion, budget, guests }),
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.ideas) && data.ideas.length > 0) {
          setIdeas(data.ideas)
        }
      }
    } catch {
      // Fallback catalog is already default
    } finally {
      setLoading(false)
    }
  }

  const toggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  return (
    <div
      style={{
        marginTop: 14,
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
          ✦ Cultural Ideas & Traditions (Gemini 3.8 Flash)
        </strong>
        <button
          type="button"
          className="insight-action-btn"
          aria-expanded={open}
          aria-controls="cultural-ideas-list"
          onClick={() => {
            if (!open) handleFetchIdeas()
            setOpen(!open)
          }}
        >
          {open ? "Hide" : "Explore Ideas"}
        </button>
      </div>

      {open && (
        <div
          id="cultural-ideas-list"
          role="region"
          aria-label="Cultural celebration ideas"
          style={{ marginTop: 10 }}
        >
          {loading ? (
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              ✦ Consulting Gemini for Kerala cultural concepts...
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ideas.map((idea) => {
                const isSaved = savedIds.includes(idea.id)
                return (
                  <div
                    key={idea.id}
                    style={{
                      background: "var(--paper2)",
                      padding: 8,
                      borderRadius: 3,
                      fontSize: 11,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <strong style={{ color: "var(--ink)" }}>
                        {idea.title}
                      </strong>
                      <button
                        type="button"
                        className="insight-action-btn"
                        aria-label={
                          isSaved
                            ? `Remove ${idea.title} from saved ideas`
                            : `Save ${idea.title} idea`
                        }
                        style={{
                          padding: "2px 6px",
                          fontSize: 9,
                          background: isSaved ? "var(--forest)" : "none",
                          color: isSaved ? "#fff" : "var(--ink)",
                        }}
                        onClick={() => toggleSave(idea.id)}
                      >
                        {isSaved ? "✓ Saved" : "+ Save Idea"}
                      </button>
                    </div>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "var(--ink)",
                        lineHeight: 1.4,
                      }}
                    >
                      {idea.description}
                    </p>
                    {idea.estimatedCostRange && (
                      <small
                        style={{ color: "var(--muted)", fontStyle: "italic" }}
                      >
                        Estimated Impact: {idea.estimatedCostRange}
                      </small>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

