import { test } from "node:test"
import assert from "node:assert/strict"
import { createInitialUnifiedPlan, recalculateUnifiedPlan } from "../plan/unifiedPlanEngine.ts"
import { generateProactiveInsights } from "./insightEngine.ts"
import { DEFAULT_SETUP } from "../persistence/storage.ts"

test("insightEngine: generates budget deficit insight when allocations exceed ceiling", () => {
  const basePlan = createInitialUnifiedPlan(DEFAULT_SETUP)
  const constrained = recalculateUnifiedPlan(basePlan, {
    newBudget: 640000,
    newGuests: 230,
    newMonths: 4,
  })

  const insights = generateProactiveInsights(constrained)
  const deficitInsight = insights.find((i) => i.id === "insight-budget-deficit")
  assert.ok(deficitInsight, "Deficit insight should be generated")
  assert.equal(deficitInsight?.severity, "critical")
  assert.equal(deficitInsight?.actionDestination, "#adapt")
})

test("insightEngine: flags unconfirmed core vendors (venue, food, photo)", () => {
  const plan = createInitialUnifiedPlan(DEFAULT_SETUP)
  const insights = generateProactiveInsights(plan)
  assert.ok(insights.some((i) => i.id === "insight-vendor-unconfirmed-venue"))
  assert.ok(insights.some((i) => i.id === "insight-vendor-unconfirmed-food"))
})

