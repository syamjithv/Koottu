/**
 * KOOTTU — Proactive Event Intelligence Insight Engine
 *
 * Deterministically analyzes the unified event plan across financials,
 * DAG timelines, vendor commitments, and cultural invariants.
 * Generates prioritized, actionable insights with direct UI navigation links.
 */

import type {
  ProactiveInsight,
  UnifiedEventPlan,
} from "../types.ts"
import { formatINR } from "../budget/budgetEngine.ts"

export function generateProactiveInsights(plan: UnifiedEventPlan): ProactiveInsight[] {
  const insights: ProactiveInsight[] = []
  const now = new Date().toISOString()

  // 1. Financial Deficit Analysis (Critical)
  if (plan.financials.isDeficit) {
    insights.push({
      id: "insight-budget-deficit",
      severity: "critical",
      category: "budget",
      title: `Budget Deficit: ${formatINR(plan.financials.deficitAmount)} over ceiling`,
      explanation: `Total planned allocations (${formatINR(plan.financials.totalAllocated)}) and contingency reserve (${formatINR(plan.financials.contingencyReserve)}) exceed the available event budget of ${formatINR(plan.financials.totalBudget)}.`,
      evidence: `Deficit: -${formatINR(plan.financials.deficitAmount)} | Available: ${formatINR(plan.financials.totalBudget)}`,
      recommendedAction: "Review 3 mathematically verified trade-off scenarios in Adapt Plan",
      actionDestination: "#adapt",
      timestamp: now,
      resolved: false,
    })
  }

  // 2. Food Protection Inadequacy (Warning)
  const foodCat = plan.categories.find((c) => c.key === "food")
  const requiredFood = plan.identity.guests * plan.financials.foodPerPerson
  if (foodCat && foodCat.amount < requiredFood) {
    const shortage = requiredFood - foodCat.amount
    insights.push({
      id: "insight-food-shortage",
      severity: "warning",
      category: "cultural",
      title: `Food Allocation Below Kerala Benchmark (${formatINR(shortage)} gap)`,
      explanation: `Traditional Sadya feast requires at least ${formatINR(plan.financials.foodPerPerson)}/guest (${formatINR(requiredFood)} for ${plan.identity.guests} guests). Current allocation is ${formatINR(foodCat.amount)}.`,
      evidence: `Target: ${formatINR(requiredFood)} vs Allocated: ${formatINR(foodCat.amount)}`,
      recommendedAction: "Restore protected food catering or adjust guest headcount",
      actionDestination: "#adapt",
      timestamp: now,
      resolved: false,
    })
  }

  // 3. Contingency Reserve Health (Warning)
  if (plan.contingency.reserveAmount <= 0 && !plan.financials.isDeficit) {
    insights.push({
      id: "insight-contingency-zero",
      severity: "warning",
      category: "budget",
      title: "Zero Contingency Reserve Buffer",
      explanation:
        "Every rupee is allocated with zero reserve cushion. Unexpected price fluctuations or weather contingencies will immediately trigger a deficit.",
      evidence: "Contingency reserve: ₹0 (0%)",
      recommendedAction: "Set a 5% contingency reserve in the budget planner",
      actionDestination: "#budget",
      timestamp: now,
      resolved: false,
    })
  }

  // 4. Timeline Schedule Feasibility (Critical or Warning)
  if (!plan.timelineFeasibility.isFeasible) {
    insights.push({
      id: "insight-timeline-infeasible",
      severity: "critical",
      category: "timeline",
      title: "Schedule Critical Path Exceeds Planning Window",
      explanation: `The sequential dependency path requires ${plan.timelineFeasibility.totalDurationDays} days, but only ${plan.timelineFeasibility.availableDays} days remain before the celebration date.`,
      evidence: `Path duration: ${plan.timelineFeasibility.totalDurationDays}d > Window: ${plan.timelineFeasibility.availableDays}d`,
      recommendedAction: "Compress non-essential task durations or parallelize vendor site visits",
      actionDestination: "#timeline",
      timestamp: now,
      resolved: false,
    })
  } else if (plan.timelineFeasibility.slackDays < 20) {
    insights.push({
      id: "insight-timeline-tight",
      severity: "warning",
      category: "timeline",
      title: `Tight Schedule Feasibility (${plan.timelineFeasibility.slackDays} days buffer)`,
      explanation:
        "The critical path leaves little buffer. Any delay in auditorium inspection or guest list finalization will delay vendor booking.",
      evidence: `Slack days: ${plan.timelineFeasibility.slackDays}d remaining`,
      recommendedAction: "Review critical path milestones and assign task coordinators",
      actionDestination: "#timeline",
      timestamp: now,
      resolved: false,
    })
  }

  // 5. Core Vendor Confirmation Tracking (Warning)
  const coreCategories = ["venue", "food", "photo"]
  for (const catKey of coreCategories) {
    const hasAcceptedQuote = Boolean(plan.acceptedQuotes[catKey])
    if (!hasAcceptedQuote) {
      const cat = plan.categories.find((c) => c.key === catKey)
      const catName = cat?.name || catKey
      insights.push({
        id: `insight-vendor-unconfirmed-${catKey}`,
        severity: "warning",
        category: "vendor",
        title: `Core Vendor Unconfirmed: ${catName}`,
        explanation: `${catName} is a critical milestone category but has no accepted quotation. Availability in Kerala peak season fills quickly.`,
        evidence: `Category: ${catName} | Allocated: ${formatINR(cat?.amount || 0)}`,
        recommendedAction: `Review and compare ${catName} quotations in Vendor section`,
        actionDestination: "#vendors",
        relatedEntityId: catKey,
        timestamp: now,
        resolved: false,
      })
    }
  }

  // 6. Contract Risk Audit (Warning)
  for (const vendor of plan.vendors) {
    for (const quote of vendor.quotes) {
      if (quote.advancePaymentPercent > 50) {
        insights.push({
          id: `insight-contract-advance-${quote.id}`,
          severity: "warning",
          category: "vendor",
          title: `High Advance Payment Terms: ${quote.vendorName} (${quote.advancePaymentPercent}%)`,
          explanation: `${quote.vendorName} requests ${quote.advancePaymentPercent}% upfront deposit (${formatINR(quote.advanceAmount)}), which increases financial exposure before delivery.`,
          evidence: `Advance: ${quote.advancePaymentPercent}% (${formatINR(quote.advanceAmount)})`,
          recommendedAction: "Negotiate milestone-based staggered payment terms (e.g. 25% booking, 50% week-of, 25% settlement)",
          actionDestination: "#vendors",
          relatedEntityId: quote.id,
          timestamp: now,
          resolved: false,
        })
      }
      const riskFlags = quote.riskFlags || []
      if (riskFlags.some((f) => f.toLowerCase().includes("gst extra") || f.toLowerCase().includes("transport"))) {
        insights.push({
          id: `insight-contract-hidden-cost-${quote.id}`,
          severity: "info",
          category: "vendor",
          title: `Hidden Surcharge Alert: ${quote.vendorName}`,
          explanation: `Quotation notes mention external surcharges (e.g. GST 18% extra, generator diesel, transport beyond Kochi limits).`,
          evidence: `Risk tags: ${riskFlags.join(", ")}`,
          recommendedAction: "Request all-inclusive final written quotation before confirmation",
          actionDestination: "#vendors",
          relatedEntityId: quote.id,
          timestamp: now,
          resolved: false,
        })
      }
    }
  }

  // 7. Celebration Readiness Milestone (Success)
  if (plan.readiness.overallScore >= 80 && !plan.financials.isDeficit && plan.timelineFeasibility.isFeasible) {
    insights.push({
      id: "insight-readiness-high",
      severity: "success",
      category: "general",
      title: `Celebration Operating System Balanced (${plan.readiness.overallScore}% Ready)`,
      explanation:
        "Budget reconciles completely, the critical path has positive slack, and priority cultural elements are safeguarded.",
      evidence: `Readiness Score: ${plan.readiness.overallScore}/100`,
      recommendedAction: "Review chronological event-day run sheet or download calendar backup",
      actionDestination: "#runsheet",
      timestamp: now,
      resolved: false,
    })
  }

  // Sort: Critical (0) -> Warning (1) -> Info (2) -> Success (3)
  const severityRank: Record<string, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    success: 3,
  }

  return insights.sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
}
