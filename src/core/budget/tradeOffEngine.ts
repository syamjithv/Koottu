/**
 * KOOTTU — Multi-Scenario Trade-Off Engine
 *
 * Deterministically generates three concrete, mathematically verified alternatives
 * when a plan is in deficit or needs optimization.
 *
 * Scenario A: Guest Count Optimization (saves ₹1,500/guest on catering)
 * Scenario B: Headcount Protected (reallocates unlocked flexible categories)
 * Scenario C: Balanced Compromise (modest guest trim + mild category adjustments)
 */

import type { Plan, TradeOffScenario } from "../types.ts"
import {
  adaptPlan,
  sumPlan,
  formatINR,
  FOOD_RATE_PER_GUEST,
  CATEGORY_FLOORS,
} from "./budgetEngine.ts"

export function generateTradeOffScenarios(
  currentPlan: Plan,
  lockedKeys: string[] = [],
): TradeOffScenario[] {
  const totalAllocated = sumPlan(currentPlan)
  const balance = currentPlan.budget - totalAllocated
  const deficit = balance < 0 ? Math.abs(balance) : 0

  if (deficit === 0) {
    // If no deficit, provide optimization scenarios for reserve buffer or enhancements
    const bufferPlan = adaptPlan(
      currentPlan.budget,
      currentPlan.guests,
      currentPlan.months,
      lockedKeys,
    )
    return [
      {
        id: "balanced",
        title: "Balanced Contingency Reserve",
        badge: "Recommended",
        description: `Plan is currently balanced with ${formatINR(balance)} in uncommitted reserve.`,
        proposedPlan: bufferPlan,
        deltaBudget: 0,
        deltaGuests: 0,
        savingsAmount: 0,
        remainingDeficit: 0,
        isFullyBalanced: true,
        categoryDeltas: {},
        tradeOffSummary:
          "Maintains existing allocations with safe contingency cushion.",
        timelineImpact: "Standard timeline with zero acceleration required.",
      },
    ]
  }

  // --- SCENARIO A: Guest Count Optimization ---
  // Trims guest count by up to 30 guests (saves 30 * 1500 = ₹45,000)
  const guestTrimCount = Math.min(30, Math.max(10, currentPlan.guests - 20))
  const targetGuestsA = currentPlan.guests - guestTrimCount
  const savingsA = guestTrimCount * FOOD_RATE_PER_GUEST
  const remainingDeficitA = Math.max(0, deficit - savingsA)

  const planA = adaptPlan(
    currentPlan.budget,
    targetGuestsA,
    currentPlan.months,
    lockedKeys,
  )

  const catDeltasA: Record<string, number> = {}
  currentPlan.categories.forEach((cat, i) => {
    catDeltasA[cat.key] = planA.categories[i].amount - cat.amount
  })

  const scenarioA: TradeOffScenario = {
    id: "guest-trim",
    title: "Guest List Optimization",
    badge: `Saves ${formatINR(savingsA)}`,
    description: `Trimming guest count from ${currentPlan.guests} to ${targetGuestsA} saves ${formatINR(savingsA)} on catering at ${formatINR(FOOD_RATE_PER_GUEST)}/guest, leaving ${formatINR(remainingDeficitA)} of the ${formatINR(deficit)} deficit.`,
    proposedPlan: planA,
    deltaBudget: 0,
    deltaGuests: -guestTrimCount,
    savingsAmount: savingsA,
    remainingDeficit: remainingDeficitA,
    isFullyBalanced: remainingDeficitA === 0,
    categoryDeltas: catDeltasA,
    tradeOffSummary: `Reduces catering load by ${guestTrimCount} covers while preserving venue and photography commitments.`,
    timelineImpact:
      "Finalize guest estimates within 10 days to confirm updated catering headcount.",
  }

  // --- SCENARIO B: Headcount Protected (Category Rebalance) ---
  // Retains all guests (catering unchanged); rebalances unlocked flexible categories
  const planB = { ...currentPlan }
  const mutableCategories = planB.categories.map((c) => ({ ...c }))

  let unabsorbed = deficit
  // Order of flexible trimming: other essentials -> decor -> photo -> venue
  const trimOrder = ["other", "decor", "photo", "venue"]
  for (const key of trimOrder) {
    if (lockedKeys.includes(key)) continue
    const cat = mutableCategories.find((c) => c.key === key)
    if (!cat) continue
    const floor =
      CATEGORY_FLOORS[(key as keyof typeof CATEGORY_FLOORS)] || 25000
    const availableToTrim = Math.max(0, cat.amount - floor)
    const trimAmount = Math.min(unabsorbed, availableToTrim)
    cat.amount -= trimAmount
    unabsorbed -= trimAmount
    if (unabsorbed <= 0) break
  }

  const catDeltasB: Record<string, number> = {}
  currentPlan.categories.forEach((cat, i) => {
    catDeltasB[cat.key] = mutableCategories[i].amount - cat.amount
  })

  const planBFinal: Plan = {
    ...currentPlan,
    categories: mutableCategories,
  }

  const savingsB = deficit - unabsorbed
  const scenarioB: TradeOffScenario = {
    id: "category-rebalance",
    title: "Headcount Protected",
    badge: "Preserve All Guests",
    description: `Keep all ${currentPlan.guests} guests and protect food at ${formatINR(
      currentPlan.categories.find((c) => c.key === "food")?.amount || 0,
    )}. Absorbs ${formatINR(savingsB)} across secondary flexible categories.`,
    proposedPlan: planBFinal,
    deltaBudget: 0,
    deltaGuests: 0,
    savingsAmount: savingsB,
    remainingDeficit: unabsorbed,
    isFullyBalanced: unabsorbed === 0,
    categoryDeltas: catDeltasB,
    tradeOffSummary:
      "Decor, photography coverage hours, or misc items are trimmed to maintain full attendance.",
    timelineImpact:
      "No guest deadline disruption; renegotiate quotes with decor and misc vendors.",
  }

  // --- SCENARIO C: Balanced Compromise ---
  // Modest guest trim (e.g. 15 guests = ₹22,500) + mild category trim
  const guestTrimC = Math.min(15, Math.max(5, Math.floor(guestTrimCount / 2)))
  const targetGuestsC = currentPlan.guests - guestTrimC
  const guestSavingsC = guestTrimC * FOOD_RATE_PER_GUEST
  const deficitAfterGuestC = Math.max(0, deficit - guestSavingsC)

  const planCBase = adaptPlan(
    currentPlan.budget,
    targetGuestsC,
    currentPlan.months,
    lockedKeys,
  )
  const mutableCategoriesC = planCBase.categories.map((c) => ({ ...c }))

  let unabsorbedC = deficitAfterGuestC
  for (const key of ["other", "decor", "photo"]) {
    if (lockedKeys.includes(key)) continue
    const cat = mutableCategoriesC.find((c) => c.key === key)
    if (!cat) continue
    const floor =
      CATEGORY_FLOORS[(key as keyof typeof CATEGORY_FLOORS)] || 25000
    const availableToTrim = Math.max(0, cat.amount - floor)
    const trimAmount = Math.min(unabsorbedC, availableToTrim)
    cat.amount -= trimAmount
    unabsorbedC -= trimAmount
    if (unabsorbedC <= 0) break
  }

  const catDeltasC: Record<string, number> = {}
  currentPlan.categories.forEach((cat, i) => {
    catDeltasC[cat.key] = mutableCategoriesC[i].amount - cat.amount
  })

  const scenarioC: TradeOffScenario = {
    id: "balanced",
    title: "Balanced Compromise",
    badge: "Balanced",
    description: `Moderate reduction of ${guestTrimC} guests saves ${formatINR(guestSavingsC)}, while gentle category adjustments absorb remaining pressure.`,
    proposedPlan: {
      budget: currentPlan.budget,
      guests: targetGuestsC,
      months: currentPlan.months,
      categories: mutableCategoriesC,
      lockedKeys,
    },
    deltaBudget: 0,
    deltaGuests: -guestTrimC,
    savingsAmount: deficit - unabsorbedC,
    remainingDeficit: unabsorbedC,
    isFullyBalanced: unabsorbedC === 0,
    categoryDeltas: catDeltasC,
    tradeOffSummary:
      "Mild cuts shared between guest count and non-essential decor.",
    timelineImpact:
      "Standard task flow remains viable with minimal vendor friction.",
  }

  return [scenarioA, scenarioB, scenarioC]
}
