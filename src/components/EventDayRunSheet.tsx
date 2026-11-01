import { useState } from "react"
import type { RunSheetItem } from "../data.ts"
import { generateRunSheetIcs } from "../data.ts"

export function EventDayRunSheet({
  runSheet,
  eventDate,
  occasion,
}: {
  runSheet: RunSheetItem[]
  eventDate?: string
  occasion?: string
}) {
  const [items, setItems] = useState<RunSheetItem[]>(runSheet)

  const handleDownloadRunSheetIcs = () => {
    const icsData = generateRunSheetIcs(
      items,
      eventDate,
      `${occasion || "Celebration"} Day`,
    )
    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "celebration-day-runsheet.ics"
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "Completed" ? "Pending" : "Completed",
            }
          : item,
      ),
    )
  }

  return (
    <section className="workspace-section runsheet-section" id="runsheet">
      <div className="section-heading">
        <div>
          <span className="kicker">Day-of Execution · Auspicious Timings</span>
          <h2>Chronological event-day run sheet.</h2>
        </div>
        <button
          type="button"
          className="insight-action-btn"
          onClick={handleDownloadRunSheetIcs}
          title="Download Event-Day schedule as RFC 5545 .ics file"
          aria-label="Download Event-Day schedule as RFC 5545 .ics file"
        >
          📅 Download Day-of .ics
        </button>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 14px" }}>
        Chronological sequence of rituals, vendor arrivals, and banquet rounds.
        Click any step to mark completed.
      </p>
      <div className="runsheet-timeline">
        {items.map((item) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            aria-label={`${item.title}, ${item.time}, owner: ${item.owner}, status: ${item.status}. Press enter or space to toggle completion.`}
            className="runsheet-item"
            style={{
              opacity: item.status === "Completed" ? 0.6 : 1,
              cursor: "pointer",
            }}
            onClick={() => toggleStatus(item.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                toggleStatus(item.id)
              }
            }}
          >
            <div className="runsheet-time">{item.time}</div>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", color: "var(--ink)" }}>
                {item.title}
              </strong>
              <div className="runsheet-owner">
                👤 {item.owner} · 📍 {item.location}
              </div>
              {item.notes && (
                <small
                  style={{
                    color: "var(--muted)",
                    display: "block",
                    marginTop: 2,
                  }}
                >
                  {item.notes}
                </small>
              )}
            </div>
            <span
              className={`task-status ${
                item.status === "Completed" ? "status-3" : "status-0"
              }`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

