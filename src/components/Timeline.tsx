import { useEffect, useMemo, useRef, useState } from "react"
import type { TaskStatus } from "../data.ts"
import {
  getTimeline,
  analyzeScheduleFeasibility,
  generateMilestonesIcs,
} from "../data.ts"

export function Timeline({
  months,
  customStatuses = {},
  taskAssignees = {},
  onToggleStatus,
  onAssignTask,
}: {
  months: number
  customStatuses?: Record<string, TaskStatus>
  taskAssignees?: Record<string, string>
  onToggleStatus?: (taskId: string) => void
  onAssignTask?: (taskId: string, assignee: string) => void
}) {
  const tasks = getTimeline(months, customStatuses)
  const feasibility = useMemo(
    () => analyzeScheduleFeasibility(months),
    [months],
  )
  const previousMonths = useRef(months)
  const [changedIndices, setChangedIndices] = useState<number[]>([])

  const handleDownloadMilestonesIcs = () => {
    const icsContent = generateMilestonesIcs(
      tasks,
      undefined,
      "KOOTTU Celebration",
    )
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "celebration-milestones.ics"
    a.click()
    URL.revokeObjectURL(url)
  }

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
          <button
            type="button"
            className="insight-action-btn"
            onClick={handleDownloadMilestonesIcs}
            title="Download milestones as RFC 5545 .ics calendar file"
          >
            📅 Download .ics
          </button>
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
              <div
                style={{ marginTop: 4, fontSize: 10, color: "var(--muted)" }}
              >
                👤 Assigned:{" "}
                <b>
                  {taskAssignees[task.id] ||
                    task.assignee ||
                    "Family Coordinator"}
                </b>
              </div>
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

