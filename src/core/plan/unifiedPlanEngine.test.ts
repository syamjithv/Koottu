import { test } from "node:test"
import assert from "node:assert/strict"
import {
  createInitialUnifiedPlan,
  recalculateUnifiedPlan,
  simulateDecisionImpact,
} from "./unifiedPlanEngine.ts"
import { DEFAULT_SETUP } from "../persistence/storage.ts"

test("unifiedPlanEngine: initializes unified plan with 5% contingency and deterministic categories", () => {
  const plan = createInitialUnifiedPlan(DEFAULT_SETUP)
  assert.equal(plan.identity.budget, 800000)
  assert.equal(plan.identity.guests, 200)
  assert.equal(plan.contingency.percent, 5)
  assert.equal(plan.contingency.reserveAmount, 40000) // 5% of 800,000

  // Verify food is strictly 200 * 1500 = 300,000
  const food = plan.categories.find((c) => c.key === "food")
  assert.equal(food?.amount, 300000)

  // Verify readiness score is computed
  assert.ok(plan.readiness.overallScore >= 0 && plan.readiness.overallScore <= 100)

  // Verify proactive insights are generated
  assert.ok(Array.isArray(plan.insights))
})

test("unifiedPlanEngine: recalculateUnifiedPlan accurately updates deficit and trade-offs under constraints", () => {
  const plan = createInitialUnifiedPlan(DEFAULT_SETUP)
  // Rebalance with constrained scenario: 640k, 230 guests, 4 months
  const updated = recalculateUnifiedPlan(plan, {
    newBudget: 640000,
    newGuests: 230,
    newMonths: 4,
  })

  assert.equal(updated.identity.budget, 640000)
  assert.equal(updated.identity.guests, 230)
  // Food allocation must be 230 * 1500 = 345,000
  const food = updated.categories.find((c) => c.key === "food")
  assert.equal(food?.amount, 345000)

  // Deficit should be detected
  assert.ok(updated.financials.isDeficit)
  assert.ok(updated.insights.some((i) => i.id === "insight-budget-deficit"))
})

test("unifiedPlanEngine: simulateDecisionImpact previews guest count and budget changes", () => {
  const plan = createInitialUnifiedPlan(DEFAULT_SETUP)
  const impact = simulateDecisionImpact(plan, {
    guestDelta: -30, // 200 -> 170
  })

  assert.equal(impact.deltas.spentDelta < 0, true) // Reduced spend
  assert.ok(impact.impactExplanation.includes("45,000")) // 30 * 1500 = 45,000
})

