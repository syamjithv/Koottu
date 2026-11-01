/**
 * KOOTTU — Unified Authoritative Event Planning Model & Engine
 *
 * Implements the single source of truth for celebration planning:
 * binds budget, contingency, vendor commitments, timeline DAG,
 * readiness score, and proactive insights into one deterministic model.
 */

import type {
  UnifiedEventPlan,
  UnifiedFinancials,
  UnifiedCategory,
  Setup,
  Plan,
  VendorQuote,
  ScheduledTask,
} from "../types.ts"
import { adaptPlan, sumPlan, formatINR } from "../budget/budgetEngine.ts"
import { generateTradeOffScenarios } from "../budget/tradeOffEngine.ts"
import {
  analyzeScheduleFeasibility,
  getTimeline,
} from "../timeline/timelineEngine.ts"
import {
  getTemplateById,
  findTemplateByOccasion,
} from "../templates/occasionTemplates.ts"
import { calculateCelebrationReadiness } from "../intelligence/readinessEngine.ts"
import { generateProactiveInsights } from "../insights/insightEngine.ts"
import { SAMPLE_QUOTES } from "../vendor/sampleQuotes.ts"

/**
 * Construct an initial UnifiedEventPlan from user setup answers
 */
export function createInitialUnifiedPlan(
  setup: Setup,
  occasionTemplateId?: string,
): UnifiedEventPlan {
  const template = occasionTemplateId
    ? getTemplateById(occasionTemplateId)
    : findTemplateByOccasion(setup.occasion)

  const rawBudget = setup.budget || template.defaultBudget
  const rawGuests = setup.guests || template.defaultGuests
  const rawMonths = setup.months || template.defaultMonths

  // 5% default contingency reserve
  const contingencyPercent = 5
  const contingencyReserve = Math.round((rawBudget * contingencyPercent) / 100)

  // Initial category allocation with deterministic engine
  const initialPlan = adaptPlan(rawBudget, rawGuests, rawMonths, [])

  // Map categories to UnifiedCategory
  const categories: UnifiedCategory[] = initialPlan.categories.map((c) => ({
    ...c,
    actualSpent: undefined,
    contractedQuoteId: undefined,
    floor: template.categoryFloors[c.key] || 25000,
    perPersonRate: c.key === "food" ? template.foodPerPerson : undefined,
  }))

  const totalAllocated = sumPlan(initialPlan)
  const totalCommitted = totalAllocated + contingencyReserve
  const netBalance = rawBudget - totalCommitted
  const isDeficit = netBalance < 0
  const deficitAmount = isDeficit ? Math.abs(netBalance) : 0

  const financials: UnifiedFinancials = {
    totalBudget: rawBudget,
    totalAllocated,
    totalActualSpent: 0,
    contingencyReserve,
    unallocatedAmount: Math.max(0, netBalance),
    netBalance,
    isDeficit,
    deficitAmount,
    foodPerPerson: template.foodPerPerson,
  }

  // Generate initial tasks from template or timeline engine
  const tasks: ScheduledTask[] = template.defaultTasks.map((t) => ({
    ...t,
    status: t.status || "Not started",
  }))

  const feasibility = analyzeScheduleFeasibility(rawMonths)
  const tradeOffScenarios = generateTradeOffScenarios(initialPlan, [])

  // Map initial sample vendors
  const initialQuotes: VendorQuote[] = SAMPLE_QUOTES.map((sq, idx) => ({
    id: `quote-init-${idx}`,
    vendorName: sq.vendorName,
    category: sq.category,
    quotedAmount: sq.baseCost,
    gstRatePercent: sq.gstPercent,
    gstIncluded: sq.gstIncluded,
    advancePaymentPercent: sq.advancePercent,
    advanceAmount: Math.round((sq.baseCost * sq.advancePercent) / 100),
    cancellationPolicy: sq.cancellationPolicy,
    includedServices: sq.includedServices,
    riskFlags: sq.riskFlags,
    status: "reviewed",
  }))

  const acceptedQuotes: Record<string, string> = {}

  // Calculate readiness score
  const readiness = calculateCelebrationReadiness(
    financials,
    feasibility,
    tasks,
    acceptedQuotes,
  )

  const emptyPlan: UnifiedEventPlan = {
    id: `plan-${Date.now()}`,
    version: 3,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    identity: {
      title: `${setup.occasion || "Celebration"} in ${setup.location || "Kerala"}`,
      occasion: setup.occasion,
      occasionTemplateId: template.id,
      date: setup.date || "",
      months: rawMonths,
      location: setup.location,
      guests: rawGuests,
      budget: rawBudget,
      priorities: setup.priorities,
      requirements: setup.requirements,
    },
    financials,
    contingency: {
      percent: contingencyPercent,
      reserveAmount: contingencyReserve,
      isManual: false,
    },
    categories,
    lockedKeys: [],
    tradeOffScenarios,
    tasks,
    timelineFeasibility: feasibility,
    vendors: [
      {
        id: "vendor-sadya",
        name: "Malabar Heritage Caterers",
        category: "food",
        status: "quote_received",
        quotes: [initialQuotes[0]],
      },
      {
        id: "vendor-photo",
        name: "Lumière Visual Studios",
        category: "photo",
        status: "quote_received",
        quotes: [initialQuotes[1]],
      },
      {
        id: "vendor-decor",
        name: "Aura Floral Designers",
        category: "decor",
        status: "quote_received",
        quotes: [initialQuotes[2]],
      },
    ],
    acceptedQuotes,
    runSheet: template.defaultRunSheet,
    ideas: [],
    readiness,
    insights: [],
    history: [],
    planningStatus: "configured",
  }

  // Generate proactive insights
  emptyPlan.insights = generateProactiveInsights(emptyPlan)
  return emptyPlan
}

/**
 * Re-evaluate and reconcile the complete unified plan deterministically
 */
export function recalculateUnifiedPlan(
  plan: UnifiedEventPlan,
  options?: {
    preserveCategoryAmounts?: boolean
    newBudget?: number
    newGuests?: number
    newMonths?: number
    newLockedKeys?: string[]
    newContingencyPercent?: number
  },
): UnifiedEventPlan {
  const budget = options?.newBudget ?? plan.identity.budget
  const guests = options?.newGuests ?? plan.identity.guests
  const months = options?.newMonths ?? plan.identity.months
  const lockedKeys = options?.newLockedKeys ?? plan.lockedKeys
  const contingencyPercent =
    options?.newContingencyPercent ?? plan.contingency.percent

  // Deterministic contingency reserve
  const contingencyReserve = Math.round((budget * contingencyPercent) / 100)

  // Recalculate category allocations
  let updatedCategories: UnifiedCategory[]
  if (options?.preserveCategoryAmounts) {
    updatedCategories = plan.categories.map((c) => ({
      ...c,
      locked: lockedKeys.includes(c.key),
    }))
  } else {
    const rawAdapted = adaptPlan(budget, guests, months, lockedKeys)
    updatedCategories = rawAdapted.categories.map((c) => {
      const existing = plan.categories.find((old) => old.key === c.key)
      return {
        ...c,
        locked: lockedKeys.includes(c.key),
        floor: existing?.floor || 25000,
        actualSpent: existing?.actualSpent,
        contractedQuoteId: existing?.contractedQuoteId,
        perPersonRate:
          c.key === "food" ? plan.financials.foodPerPerson : undefined,
      }
    })
  }

  // Update actual expenditure from accepted quotes
  let totalActualSpent = 0
  for (const cat of updatedCategories) {
    const acceptedQuoteId = plan.acceptedQuotes[cat.key]
    if (acceptedQuoteId) {
      // Find quote in vendors
      let quoteCost: number | undefined
      for (const v of plan.vendors) {
        const match = v.quotes.find((q) => q.id === acceptedQuoteId)
        if (match) {
          quoteCost =
            match.quotedAmount +
            (match.gstIncluded
              ? 0
              : Math.round(
                  (match.quotedAmount * (match.gstRatePercent || 0)) / 100,
                ))
          break
        }
      }
      if (quoteCost !== undefined) {
        cat.actualSpent = quoteCost
        cat.contractedQuoteId = acceptedQuoteId
        totalActualSpent += quoteCost
      }
    }
  }

  const totalAllocated = updatedCategories.reduce((sum, c) => sum + c.amount, 0)
  const totalCommitted = totalAllocated + contingencyReserve
  const netBalance = budget - totalCommitted
  const isDeficit = netBalance < 0
  const deficitAmount = isDeficit ? Math.abs(netBalance) : 0

  const financials: UnifiedFinancials = {
    totalBudget: budget,
    totalAllocated,
    totalActualSpent,
    contingencyReserve,
    unallocatedAmount: Math.max(0, netBalance),
    netBalance,
    isDeficit,
    deficitAmount,
    foodPerPerson: plan.financials.foodPerPerson,
  }

  // Recalculate timeline feasibility
  const feasibility = analyzeScheduleFeasibility(months)

  // Recalculate trade-off scenarios
  const currentPlanView: Plan = {
    budget,
    guests,
    months,
    categories: updatedCategories,
    lockedKeys,
  }
  const tradeOffScenarios = generateTradeOffScenarios(
    currentPlanView,
    lockedKeys,
  )

  // Recalculate Readiness Score
  const readiness = calculateCelebrationReadiness(
    financials,
    feasibility,
    plan.tasks,
    plan.acceptedQuotes,
  )

  const updatedPlan: UnifiedEventPlan = {
    ...plan,
    lastUpdated: new Date().toISOString(),
    identity: {
      ...plan.identity,
      budget,
      guests,
      months,
    },
    contingency: {
      percent: contingencyPercent,
      reserveAmount: contingencyReserve,
      isManual: false,
    },
    financials,
    categories: updatedCategories,
    lockedKeys,
    tradeOffScenarios,
    timelineFeasibility: feasibility,
    readiness,
    insights: [],
  }

  // Recalculate proactive insights
  updatedPlan.insights = generateProactiveInsights(updatedPlan)
  return updatedPlan
}

/**
 * Decision Impact Preview — Simulate the ripple effect of a proposed decision
 */
export type DecisionImpactResult = {
  description: string
  before: {
    budget: number
    guests: number
    spent: number
    balance: number
    isDeficit: boolean
    readinessScore: number
    feasible: boolean
  }
  after: {
    budget: number
    guests: number
    spent: number
    balance: number
    isDeficit: boolean
    readinessScore: number
    feasible: boolean
  }
  deltas: {
    budgetDelta: number
    spentDelta: number
    balanceDelta: number
    readinessScoreDelta: number
    slackDeltaDays: number
  }
  impactExplanation: string
  recommendation: string
}

export function simulateDecisionImpact(
  plan: UnifiedEventPlan,
  proposed: {
    budgetDelta?: number
    guestDelta?: number
    monthsDelta?: number
    lockedKeys?: string[]
    acceptQuote?: { category: string; quoteId: string; amount: number }
  },
): DecisionImpactResult {
  const newBudget = plan.identity.budget + (proposed.budgetDelta || 0)
  const newGuests = plan.identity.guests + (proposed.guestDelta || 0)
  const newMonths = Math.max(
    1,
    Math.min(12, plan.identity.months + (proposed.monthsDelta || 0)),
  )
  const newLockedKeys = proposed.lockedKeys || plan.lockedKeys

  // Clone and test proposed plan
  const simulated = recalculateUnifiedPlan(plan, {
    newBudget,
    newGuests,
    newMonths,
    newLockedKeys,
  })

  if (proposed.acceptQuote) {
    simulated.acceptedQuotes[proposed.acceptQuote.category] =
      proposed.acceptQuote.quoteId
  }

  const beforeSpent =
    plan.financials.totalAllocated + plan.financials.contingencyReserve
  const afterSpent =
    simulated.financials.totalAllocated +
    simulated.financials.contingencyReserve

  const balanceDelta =
    simulated.financials.netBalance - plan.financials.netBalance
  const readinessDelta =
    simulated.readiness.overallScore - plan.readiness.overallScore
  const slackDelta =
    simulated.timelineFeasibility.slackDays - plan.timelineFeasibility.slackDays

  let impactExplanation = ""
  if (proposed.guestDelta && proposed.guestDelta !== 0) {
    const foodChange =
      Math.abs(proposed.guestDelta) * plan.financials.foodPerPerson
    impactExplanation += `${
      proposed.guestDelta > 0 ? "Adding" : "Reducing"
    } ${Math.abs(proposed.guestDelta)} guests changes food catering cost by ${formatINR(foodChange)}. `
  }
  if (proposed.budgetDelta && proposed.budgetDelta !== 0) {
    impactExplanation += `Budget ceiling shifted by ${formatINR(proposed.budgetDelta)}. `
  }
  if (balanceDelta < 0) {
    impactExplanation += `Leaves ${formatINR(Math.abs(balanceDelta))} less cushion. `
  } else if (balanceDelta > 0) {
    impactExplanation += `Frees up ${formatINR(balanceDelta)} in additional budget room. `
  }

  let recommendation = ""
  if (simulated.financials.isDeficit) {
    recommendation = `Caution: this decision triggers a ${formatINR(simulated.financials.deficitAmount)} deficit. Apply a trade-off scenario to absorb it.`
  } else if (readinessDelta > 0) {
    recommendation = `Recommended: strengthens celebration readiness by +${readinessDelta} points.`
  } else {
    recommendation =
      "Acceptable: remains within approved financial and scheduling boundaries."
  }

  return {
    description: "Decision Impact Simulation",
    before: {
      budget: plan.identity.budget,
      guests: plan.identity.guests,
      spent: beforeSpent,
      balance: plan.financials.netBalance,
      isDeficit: plan.financials.isDeficit,
      readinessScore: plan.readiness.overallScore,
      feasible: plan.timelineFeasibility.isFeasible,
    },
    after: {
      budget: newBudget,
      guests: newGuests,
      spent: afterSpent,
      balance: simulated.financials.netBalance,
      isDeficit: simulated.financials.isDeficit,
      readinessScore: simulated.readiness.overallScore,
      feasible: simulated.timelineFeasibility.isFeasible,
    },
    deltas: {
      budgetDelta: newBudget - plan.identity.budget,
      spentDelta: afterSpent - beforeSpent,
      balanceDelta,
      readinessScoreDelta: readinessDelta,
      slackDeltaDays: slackDelta,
    },
    impactExplanation,
    recommendation,
  }
}
