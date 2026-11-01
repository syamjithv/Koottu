/**
 * KOOTTU — Celebration Readiness Score Engine
 *
 * Deterministically evaluates celebration preparation on a 0–100 scale
 * across four distinct 25-point pillars: Budget Health, Timeline Slack,
 * Vendor Confirmation, and Task Execution, with risk deductions.
 */

import type {
  CelebrationReadiness,
  UnifiedFinancials,
  TimelineFeasibility,
  ScheduledTask,
} from "../types.ts"

export function calculateCelebrationReadiness(
  financials: UnifiedFinancials,
  timeline: TimelineFeasibility,
  tasks: ScheduledTask[],
  acceptedQuotes: Record<string, string>,
): CelebrationReadiness {
  const reasons: string[] = []

  // Pillar 1: Budget Health (0–25 points)
  let budgetScore = 25
  if (financials.isDeficit) {
    const deficitRatio = financials.deficitAmount / Math.max(1, financials.totalBudget)
    const deduction = Math.min(25, Math.max(5, Math.round(deficitRatio * 100)))
    budgetScore = Math.max(0, 25 - deduction)
    reasons.push(
      `Budget: -${deduction} pts for unresolved deficit of ₹${financials.deficitAmount.toLocaleString("en-IN")}.`,
    )
  } else if (financials.contingencyReserve <= 0) {
    budgetScore = 20
    reasons.push("Budget: 20/25 pts. Balanced, but lacks a contingency reserve buffer.")
  } else {
    budgetScore = 25
    reasons.push("Budget: 25/25 pts. Allocations reconcile with contingency cushion.")
  }

  // Pillar 2: Timeline Feasibility & Slack (0–25 points)
  let timelineScore = 25
  if (!timeline.isFeasible) {
    timelineScore = 0
    reasons.push("Timeline: 0/25 pts. Sequential critical path exceeds remaining planning window.")
  } else if (timeline.slackDays >= 30) {
    timelineScore = 25
    reasons.push(`Timeline: 25/25 pts. Robust feasibility with +${timeline.slackDays} days buffer.`)
  } else if (timeline.slackDays >= 15) {
    timelineScore = 18
    reasons.push(`Timeline: 18/25 pts. Feasible with moderate slack (+${timeline.slackDays} days).`)
  } else {
    timelineScore = 10
    reasons.push(`Timeline: 10/25 pts. Tight critical path (+${timeline.slackDays} days slack).`)
  }

  // Pillar 3: Vendor Confirmations (0–25 points)
  // Venue (9 pts), Food (9 pts), Photo (7 pts)
  let vendorScore = 0
  const venueConfirmed = Boolean(acceptedQuotes["venue"])
  const foodConfirmed = Boolean(acceptedQuotes["food"])
  const photoConfirmed = Boolean(acceptedQuotes["photo"])

  if (venueConfirmed) vendorScore += 9
  if (foodConfirmed) vendorScore += 9
  if (photoConfirmed) vendorScore += 7

  if (vendorScore === 25) {
    reasons.push("Vendors: 25/25 pts. All core cultural categories (Venue, Food, Photo) confirmed.")
  } else {
    const missing: string[] = []
    if (!venueConfirmed) missing.push("Venue")
    if (!foodConfirmed) missing.push("Food")
    if (!photoConfirmed) missing.push("Photo")
    reasons.push(
      `Vendors: ${vendorScore}/25 pts. Unconfirmed core commitments: ${missing.join(", ")}.`,
    )
  }

  // Pillar 4: Task Progress (0–25 points)
  let taskScore = 0
  if (tasks.length > 0) {
    const completedCount = tasks.filter((t) => t.status === "Completed").length
    const inProgressCount = tasks.filter((t) => t.status === "In progress").length
    const rawRatio = (completedCount * 1.0 + inProgressCount * 0.5) / tasks.length
    taskScore = Math.round(rawRatio * 25)
    reasons.push(
      `Tasks: ${taskScore}/25 pts (${completedCount} completed, ${inProgressCount} in progress of ${tasks.length} total).`,
    )
  }

  // Risk Deductions (up to -20 points)
  let riskDeductions = 0
  if (timeline.cycleDetected) {
    riskDeductions -= 15
    reasons.push("Risk: -15 pts for circular task dependencies in timeline DAG.")
  }

  const overallScore = Math.max(
    0,
    Math.min(100, budgetScore + timelineScore + vendorScore + taskScore + riskDeductions),
  )

  let summary = ""
  if (overallScore >= 80) {
    summary = "High Celebration Readiness. Core commitments and scheduling are securely in place."
  } else if (overallScore >= 55) {
    summary = "Moderate Readiness. Key decisions remain open (budget trade-offs or vendor confirmations)."
  } else {
    summary = "Early / Constrained Stage. Crucial financial or venue commitments require resolution."
  }

  return {
    overallScore,
    budgetScore,
    timelineScore,
    vendorScore,
    taskScore,
    riskDeductions,
    reasons,
    summary,
  }
}

