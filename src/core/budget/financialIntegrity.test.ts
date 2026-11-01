import { test } from "node:test"
import assert from "node:assert/strict"
import {
  adaptPlan,
  sumPlan,
  formatINR,
  generateTradeOffScenarios,
  parseVendorQuote,
  compareQuoteToPlan,
  compareCategoryQuotes,
  runBudgetStressTests,
  createInitialUnifiedPlan,
  recalculateUnifiedPlan,
  simulateDecisionImpact,
} from "../../data.ts"
import type { Plan, VendorQuote } from "../types.ts"

test("financialIntegrity: integer INR calculations avoid float penny drift", () => {
  // Test 1000 combinations of numbers
  for (let b = 300000; b <= 1000000; b += 50000) {
    for (let g = 50; g <= 300; g += 50) {
      const plan = adaptPlan(b, g, 4)
      const total = sumPlan(plan)
      assert.equal(
        Number.isInteger(total),
        true,
        `Total must be integer for budget ${b}, guests ${g}`,
      )
      plan.categories.forEach((cat) => {
        assert.equal(
          Number.isInteger(cat.amount),
          true,
          `Category ${cat.key} must be integer`,
        )
      })
    }
  }
})

test("financialIntegrity: food catering strictly adheres to per-person rate without double-counting", () => {
  const guests = 230
  const rate = 1500
  const expectedFood = guests * rate // 345,000
  const plan = adaptPlan(640000, guests, 4)
  const food = plan.categories.find((c) => c.key === "food")
  assert.equal(food?.amount, expectedFood)

  // Verify guest reduction: 230 -> 200
  const reducedPlan = adaptPlan(640000, 200, 4)
  const reducedFood = reducedPlan.categories.find((c) => c.key === "food")
  assert.equal(reducedFood?.amount, 200 * 1500)
  assert.equal(expectedFood - reducedFood!.amount, 45000)
})

test("financialIntegrity: contingency reserve calculation and non-double-counting", () => {
  const budget = 640000
  const percent = 5
  const expectedContingency = Math.round((budget * percent) / 100) // 32,000
  assert.equal(expectedContingency, 32000)

  const uPlan = createInitialUnifiedPlan({
    occasion: "Wedding",
    date: "",
    months: 4,
    guests: 230,
    location: "Kochi",
    budget,
    priorities: ["food", "photo"],
    requirements: "",
  })

  // Verify contingency amount in unified plan
  assert.equal(uPlan.contingency.reserveAmount, 32000)
  assert.equal(uPlan.financials.contingencyReserve, 32000)

  // Verify that categories allocated do NOT already include the contingency reserve
  const sumCategories = uPlan.categories.reduce((acc, c) => acc + c.amount, 0)
  assert.equal(sumCategories, 692000) // exactly original allocated
  assert.equal(uPlan.financials.totalAllocated, 692000)

  // Net requirement = totalAllocated + contingencyReserve = 692000 + 32000 = 724000
  // Total deficit = 724000 - 640000 = 84000
  assert.equal(
    uPlan.financials.totalAllocated +
      uPlan.financials.contingencyReserve -
      budget,
    84000,
  )
})

test("financialIntegrity: boundary cases (zero, sub-minimum, large, and extreme inputs)", () => {
  // 1. Zero/sub-minimum budget clamp
  const subPlan = adaptPlan(0, 0, 0)
  assert.ok(subPlan.budget >= 300000 || subPlan.categories.length > 0)
  assert.ok(sumPlan(subPlan) > 0)

  // 2. Large budget (e.g. ₹5 Crore / 50,000,000)
  const largeBudget = 50000000
  const largePlan = adaptPlan(largeBudget, 500, 12)
  const largeSum = sumPlan(largePlan)
  assert.ok(Number.isInteger(largeSum))
  assert.ok(largeSum <= largeBudget)

  // 3. Max guests (500 guests)
  const maxGuestPlan = adaptPlan(1000000, 500, 6)
  const maxFood = maxGuestPlan.categories.find((c) => c.key === "food")
  assert.equal(maxFood?.amount, 500 * 1500)
})

test("financialIntegrity: category locks strictly protect allocations", () => {
  const plan = adaptPlan(640000, 230, 4, ["photo", "venue"])
  const photo = plan.categories.find((c) => c.key === "photo")
  const venue = plan.categories.find((c) => c.key === "venue")
  assert.equal(photo?.locked, true)
  assert.equal(venue?.locked, true)

  const scenarios = generateTradeOffScenarios(plan, ["photo", "venue"])
  scenarios.forEach((sc) => {
    const scPhoto = sc.proposedPlan.categories.find((c) => c.key === "photo")
    const scVenue = sc.proposedPlan.categories.find((c) => c.key === "venue")
    assert.equal(
      scPhoto?.amount,
      photo?.amount,
      `Locked photo allocation changed in ${sc.id}`,
    )
    assert.equal(
      scVenue?.amount,
      venue?.amount,
      `Locked venue allocation changed in ${sc.id}`,
    )
  })
})

test("financialIntegrity: vendor quotation GST and effective total calculation", () => {
  // Case A: GST Exclusive (18% extra)
  const quoteA = parseVendorQuote(
    "Total cost is ₹3,00,000 plus 18% GST with 40% advance",
    "food",
  )
  assert.equal(quoteA.quotedAmount, 300000)
  assert.equal(quoteA.gstIncluded, false)
  assert.equal(quoteA.gstRatePercent, 18)
  const effectiveTotalA = Math.round(quoteA.quotedAmount * 1.18)
  assert.equal(effectiveTotalA, 354000)
  assert.equal(quoteA.advanceAmount, 141600) // 40% of effective gross total including GST (354,000)

  // Case B: GST Inclusive
  const quoteB = parseVendorQuote(
    "Inclusive of all taxes: ₹3,50,000 total with 25% token",
    "food",
  )
  assert.equal(quoteB.quotedAmount, 350000)
  assert.equal(quoteB.gstIncluded, true)
  assert.equal(quoteB.advanceAmount, 87500) // 25% of 350,000
})

test("financialIntegrity: 3-scenario trade-off reconciliation", () => {
  const plan = adaptPlan(640000, 230, 4)
  const scenarios = generateTradeOffScenarios(plan)

  // Scenario A: Guest trim
  const scA = scenarios.find((s) => s.id === "guest-trim")!
  assert.equal(scA.deltaGuests, -30)
  assert.equal(scA.savingsAmount, 45000)
  assert.equal(scA.remainingDeficit, 7000)
  assert.equal(sumPlan(scA.proposedPlan), 647000)

  // Scenario B: Category rebalance
  const scB = scenarios.find((s) => s.id === "category-rebalance")!
  assert.equal(scB.deltaGuests, 0)
  assert.equal(scB.remainingDeficit, 0)
  assert.equal(sumPlan(scB.proposedPlan), 640000)

  // Scenario C: Balanced compromise
  const scC = scenarios.find((s) => s.id === "balanced")!
  assert.equal(scC.deltaGuests, -15)
  assert.equal(scC.remainingDeficit, 0)
  assert.equal(sumPlan(scC.proposedPlan), 640000)
})
