import { test } from "node:test"
import assert from "node:assert/strict"
import { calculateCelebrationReadiness } from "./readinessEngine.ts"
import { analyzeScheduleFeasibility } from "../timeline/timelineEngine.ts"
import type { UnifiedFinancials, ScheduledTask } from "../types.ts"

test("readinessEngine: computes score deterministically based on four 25-point pillars", () => {
  const financials: UnifiedFinancials = {
    totalBudget: 800000,
    totalAllocated: 760000,
    totalActualSpent: 0,
    contingencyReserve: 40000,
    unallocatedAmount: 0,
    netBalance: 0,
    isDeficit: false,
    deficitAmount: 0,
    foodPerPerson: 1500,
  }
  const feasibility = analyzeScheduleFeasibility(4)
  const tasks: ScheduledTask[] = [
    {
      id: "t1",
      title: "Task 1",
      category: "venue",
      due: "Week 1",
      dueDaysBeforeEvent: 90,
      durationDays: 7,
      status: "Completed",
      dependsOn: [],
    },
    {
      id: "t2",
      title: "Task 2",
      category: "food",
      due: "Week 2",
      dueDaysBeforeEvent: 80,
      durationDays: 7,
      status: "In progress",
      dependsOn: [],
    },
  ]
  const acceptedQuotes = { venue: "q1", food: "q2" }

  const readiness = calculateCelebrationReadiness(financials, feasibility, tasks, acceptedQuotes)

  assert.equal(readiness.budgetScore, 25)
  assert.equal(readiness.timelineScore, 25)
  // Venue (9) + Food (9) = 18 pts
  assert.equal(readiness.vendorScore, 18)
  // Tasks: (1 * 1.0 + 1 * 0.5) / 2 = 0.75 * 25 = 19 pts
  assert.equal(readiness.taskScore, 19)
  assert.equal(readiness.overallScore, 25 + 25 + 18 + 19) // 87
  assert.ok(readiness.summary.length > 0)
})

