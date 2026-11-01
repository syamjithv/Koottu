import assert from "node:assert/strict"
import test from "node:test"
import {
  adaptPlan,
  sumPlan,
  formatINR,
  originalPlan,
  FOOD_RATE_PER_GUEST,
} from "./budgetEngine.ts"
import { generateTradeOffScenarios } from "./tradeOffEngine.ts"

test("budgetEngine: integer INR calculations avoid floating point drift", () => {
  const plan = adaptPlan(640000, 230, 4)
  const total = sumPlan(plan)
  assert.equal(Number.isInteger(total), true)
  assert.equal(total, 692000)
  assert.equal(plan.budget - total, -52000)
})

test("budgetEngine: category locks prevent optimizer from modifying locked allocations", () => {
  // Lock photography at ₹1,00,000
  const customAmounts = { photo: 100000 }
  const planWithLock = adaptPlan(640000, 230, 4, ["photo"], customAmounts)

  const photoCat = planWithLock.categories.find((c) => c.key === "photo")
  assert.equal(photoCat?.amount, 100000)
  assert.equal(photoCat?.locked, true)
})

test("tradeOffEngine: generates 3 distinct mathematically verified scenarios for deficit", () => {
  const constrainedPlan = adaptPlan(640000, 230, 4)
  const scenarios = generateTradeOffScenarios(constrainedPlan)

  assert.equal(scenarios.length, 3)

  // Scenario A: Guest Trim (230 -> 200 saves 30 * 1500 = 45,000)
  const scenarioA = scenarios.find((s) => s.id === "guest-trim")
  assert.ok(scenarioA, "Scenario A should exist")
  assert.equal(scenarioA?.deltaGuests, -30)
  assert.equal(scenarioA?.savingsAmount, 45000)
  assert.equal(scenarioA?.remainingDeficit, 7000)
  assert.match(scenarioA!.description, /saves ₹45,000/)
  assert.match(scenarioA!.description, /leaving ₹7,000/)

  // Scenario B: Headcount Protected (230 guests retained, absorbs deficit from flexible categories)
  const scenarioB = scenarios.find((s) => s.id === "category-rebalance")
  assert.ok(scenarioB, "Scenario B should exist")
  assert.equal(scenarioB?.deltaGuests, 0)
  assert.equal(scenarioB?.proposedPlan.guests, 230)
  const foodCatB = scenarioB?.proposedPlan.categories.find(
    (c) => c.key === "food",
  )
  assert.equal(foodCatB?.amount, 345000)
  assert.equal(scenarioB?.isFullyBalanced, true)

  // Scenario C: Balanced Compromise
  const scenarioC = scenarios.find((s) => s.id === "balanced")
  assert.ok(scenarioC, "Scenario C should exist")
  assert.equal(scenarioC?.deltaGuests, -15)
  assert.equal(scenarioC?.isFullyBalanced, true)
})
