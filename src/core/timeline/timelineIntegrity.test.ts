import { test } from "node:test"
import assert from "node:assert/strict"
import {
  analyzeScheduleFeasibility,
  propagateTaskDelay,
  getTimeline,
  generateMilestonesIcs,
  generateRunSheetIcs,
  KERALA_WEDDING_TEMPLATE,
} from "../../data.ts"
import type { ScheduledTask, RunSheetItem } from "../types.ts"

test("timelineIntegrity: cyclic dependency detection in complex graphs", () => {
  // Cycle between 3 tasks: A -> B -> C -> A
  const cyclicTasks: ScheduledTask[] = [
    {
      id: "t-a",
      title: "Task A",
      category: "venue",
      due: "Month 1",
      durationDays: 10,
      status: "Not started",
      dependsOn: ["t-c"], // Points to C (Cycle!)
      isCriticalPath: false,
      canCompress: false,
    },
    {
      id: "t-b",
      title: "Task B",
      category: "venue",
      due: "Month 2",
      durationDays: 15,
      status: "Not started",
      dependsOn: ["t-a"],
      isCriticalPath: false,
      canCompress: false,
    },
    {
      id: "t-c",
      title: "Task C",
      category: "venue",
      due: "Month 3",
      durationDays: 10,
      status: "Not started",
      dependsOn: ["t-b"],
      isCriticalPath: false,
      canCompress: false,
    },
  ]

  const feasibility = analyzeScheduleFeasibility(4, cyclicTasks)
  assert.equal(feasibility.cycleDetected, true)
  assert.equal(feasibility.isFeasible, false)
  assert.ok(feasibility.conflicts.length > 0)
})

test("timelineIntegrity: missing dependencies handled safely without crashing", () => {
  const tasksWithMissingDep: ScheduledTask[] = [
    {
      id: "t-real",
      title: "Real Task",
      category: "food",
      due: "Month 1",
      durationDays: 10,
      status: "Not started",
      dependsOn: ["t-ghost-nonexistent"], // Phantom dependency
      isCriticalPath: false,
      canCompress: false,
    },
  ]

  const feasibility = analyzeScheduleFeasibility(4, tasksWithMissingDep)
  assert.equal(feasibility.cycleDetected, false)
  assert.ok(feasibility.isFeasible)
})

test("timelineIntegrity: impossible schedules flagged (duration exceeds available window)", () => {
  // In a 1-month window (30 days), critical path of 69 days is impossible
  const feasibility1Month = analyzeScheduleFeasibility(1)
  assert.equal(feasibility1Month.availableDays, 30)
  assert.equal(feasibility1Month.isFeasible, false)
  assert.ok(feasibility1Month.slackDays < 0)
  assert.ok(feasibility1Month.conflicts.some((c) => c.includes("exceeds")))
})

test("timelineIntegrity: delay propagation through downstream dependencies", () => {
  // When guest-est is delayed by 14 days, downstream tasks (cater-comp and vendor-confirm) are delayed
  const delay = propagateTaskDelay("guest-est", 14)
  assert.equal(delay.totalFinalDelay, 14)
  assert.ok(delay.impactedTaskIds.includes("cater-comp"))
  assert.ok(delay.impactedTaskIds.includes("vendor-confirm"))
})

test("timelineIntegrity: event-day run sheet chronological ordering", () => {
  const runSheet = KERALA_WEDDING_TEMPLATE.defaultRunSheet

  // Helper to convert "09:45 AM" into minutes from midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i)
    if (!match) return 0
    let hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    const meridiem = (match[3] || "").toUpperCase()
    if (meridiem === "PM" && hours < 12) hours += 12
    if (meridiem === "AM" && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  for (let i = 0; i < runSheet.length - 1; i++) {
    const currentMins = parseTimeToMinutes(runSheet[i].time)
    const nextMins = parseTimeToMinutes(runSheet[i + 1].time)
    assert.ok(
      nextMins >= currentMins,
      `Run sheet not chronological: ${runSheet[i].title} (${runSheet[i].time}) came before ${runSheet[i + 1].title} (${runSheet[i + 1].time})`,
    )
  }
})

test("timelineIntegrity: RFC 5545 iCalendar UTC date and timezone formatting", () => {
  const tasks = getTimeline(4)
  const icsContent = generateMilestonesIcs(tasks, "2026-12-15", "Kerala Wedding")

  // Must have standard RFC 5545 envelope
  assert.ok(icsContent.includes("BEGIN:VCALENDAR"))
  assert.ok(icsContent.includes("VERSION:2.0"))
  assert.ok(icsContent.includes("PRODID:-//KOOTTU//Celebration Planner//EN"))
  assert.ok(icsContent.includes("END:VCALENDAR"))

  // Each VEVENT must have DTSTAMP, UID, and DTSTART
  assert.ok(icsContent.includes("BEGIN:VEVENT"))
  assert.ok(icsContent.includes("DTSTAMP:"))
  assert.ok(icsContent.includes("UID:koottu-"))
  assert.ok(icsContent.includes("DTSTART"))
  assert.ok(icsContent.includes("END:VEVENT"))

  // Run sheet .ics check
  const runSheetIcs = generateRunSheetIcs(KERALA_WEDDING_TEMPLATE.defaultRunSheet, "2026-12-15")
  assert.ok(runSheetIcs.includes("BEGIN:VCALENDAR"))
  assert.ok(runSheetIcs.includes("Muhurtham"))
  assert.ok(runSheetIcs.includes("END:VCALENDAR"))
})
