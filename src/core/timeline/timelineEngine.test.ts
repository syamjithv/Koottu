import assert from "node:assert/strict"
import test from "node:test"
import {
  KERALA_CELEBRATION_TASKS,
  detectCycles,
  topologicalSort,
  analyzeScheduleFeasibility,
  propagateTaskDelay,
  getTimeline,
} from "./timelineEngine.ts"
import type { ScheduledTask } from "../types.ts"

test("timelineEngine: verifies Kerala tasks DAG is cycle-free", () => {
  const result = detectCycles(KERALA_CELEBRATION_TASKS)
  assert.equal(result.hasCycle, false)
})

test("timelineEngine: successfully detects circular dependency if injected", () => {
  const cyclicTasks: ScheduledTask[] = [
    {
      id: "A",
      title: "Task A",
      category: "venue",
      due: "Week 1",
      dueDaysBeforeEvent: 60,
      durationDays: 5,
      status: "Not started",
      dependsOn: ["C"], // A depends on C
    },
    {
      id: "B",
      title: "Task B",
      category: "food",
      due: "Week 2",
      dueDaysBeforeEvent: 55,
      durationDays: 5,
      status: "Not started",
      dependsOn: ["A"], // B depends on A
    },
    {
      id: "C",
      title: "Task C",
      category: "decor",
      due: "Week 3",
      dueDaysBeforeEvent: 50,
      durationDays: 5,
      status: "Not started",
      dependsOn: ["B"], // C depends on B -> CYCLE A -> B -> C -> A
    },
  ]

  const result = detectCycles(cyclicTasks)
  assert.equal(result.hasCycle, true)
})

test("timelineEngine: calculates Critical Path Method (CPM) and feasibility", () => {
  const normalFeasibility = analyzeScheduleFeasibility(4)
  assert.equal(normalFeasibility.isFeasible, true)
  assert.ok(normalFeasibility.criticalPathTaskIds.length > 0)
  assert.ok(normalFeasibility.slackDays > 0)

  // Compressed 1-month window
  const tightFeasibility = analyzeScheduleFeasibility(1)
  assert.equal(tightFeasibility.availableDays, 30)
})

test("timelineEngine: propagates task delays through downstream dependencies", () => {
  // guest-est is a dependency of cater-comp, which is a dependency of vendor-confirm
  const delayResult = propagateTaskDelay("guest-est", 7)
  assert.ok(delayResult.impactedTaskIds.includes("cater-comp"))
  assert.ok(delayResult.impactedTaskIds.includes("vendor-confirm"))
  assert.ok(delayResult.impactedTaskIds.includes("budget-review"))
  assert.ok(delayResult.impactedTaskIds.includes("day-coord"))
  // venue-req should NOT be impacted as it does not depend on guest-est
  assert.equal(delayResult.impactedTaskIds.includes("venue-req"), false)
})

