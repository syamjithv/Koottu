/**
 * KOOTTU — Vendor Lifecycle, Comparison & Inquiry Engine
 *
 * Manages the structured vendor pipeline, transparent 3-quote comparisons,
 * and generates cultural inquiry drafts for Kerala vendors.
 */

import type {
  VendorQuote,
  VendorStatus,
  UnifiedVendor,
  CategoryKey,
} from "../types.ts"
import { formatINR } from "../budget/budgetEngine.ts"

export type QuoteComparisonItem = {
  quoteId: string
  vendorName: string
  category: CategoryKey | string
  baseCost: number
  gstPercent: number
  gstAmount: number
  effectiveTotal: number
  advancePercent: number
  advanceAmount: number
  cancellationPolicy: string
  riskFlags: string[]
  includedHighlights: string[]
  budgetAllocated: number
  variance: number // effectiveTotal - budgetAllocated
  isUnderBudget: boolean
  valueScore: number // 0-100 calculated score
  recommendationNote: string
}

export type CategoryComparisonMatrix = {
  category: CategoryKey | string
  categoryAllocated: number
  quotes: QuoteComparisonItem[]
  recommendedQuoteId: string | null
  transparentReasoning: string
}

export function compareCategoryQuotes(
  quotes: VendorQuote[],
  categoryAllocated: number,
): CategoryComparisonMatrix {
  if (quotes.length === 0) {
    return {
      category: "general",
      categoryAllocated,
      quotes: [],
      recommendedQuoteId: null,
      transparentReasoning: "No quotations registered for this category.",
    }
  }

  const category = quotes[0].category

  const comparisonItems: QuoteComparisonItem[] = quotes.map((q) => {
    const baseCost = q.quotedAmount
    const gstPercent = q.gstRatePercent || 0
    // If GST not included, effective total includes GST
    const gstAmount = q.gstIncluded ? 0 : Math.round((baseCost * gstPercent) / 100)
    const effectiveTotal = baseCost + gstAmount
    const advancePercent = q.advancePaymentPercent || 0
    const advanceAmount = Math.round((effectiveTotal * advancePercent) / 100)
    const variance = effectiveTotal - categoryAllocated
    const isUnderBudget = variance <= 0

    // Transparent Value Score (0 to 100)
    // Budget alignment (50 pts), Service completeness (25 pts), Advance friendliness (15 pts), Risk deduction (10 pts)
    let score = 50
    if (variance < 0) {
      // Under budget: bonus up to 20 pts
      const savingsRatio = Math.abs(variance) / Math.max(1, categoryAllocated)
      score += Math.min(20, Math.round(savingsRatio * 40))
    } else if (variance > 0) {
      // Over budget: penalty up to 30 pts
      const overRatio = variance / Math.max(1, categoryAllocated)
      score -= Math.min(30, Math.round(overRatio * 50))
    }

    // Service completeness
    score += Math.min(25, (q.includedServices?.length || 0) * 5)

    // Advance payment friendliness (lower advance % is safer for customer)
    if (advancePercent <= 25) score += 15
    else if (advancePercent <= 40) score += 10
    else score += 5

    // Deduct for risk flags
    score -= (q.riskFlags?.length || 0) * 5
    score = Math.max(0, Math.min(100, score))

    let recommendationNote = ""
    if (isUnderBudget && q.riskFlags.length === 0) {
      recommendationNote = `Strong value: saves ${formatINR(Math.abs(variance))} with transparent terms.`
    } else if (!isUnderBudget) {
      recommendationNote = `Exceeds category budget by ${formatINR(variance)}. Requires budget rebalance.`
    } else {
      recommendationNote = `Competitive rate, but review ${q.riskFlags.length} risk flags.`
    }

    return {
      quoteId: q.id,
      vendorName: q.vendorName,
      category: q.category,
      baseCost,
      gstPercent,
      gstAmount,
      effectiveTotal,
      advancePercent,
      advanceAmount,
      cancellationPolicy: q.cancellationPolicy,
      riskFlags: q.riskFlags,
      includedHighlights: q.includedServices?.slice(0, 3) || [],
      budgetAllocated: categoryAllocated,
      variance,
      isUnderBudget,
      valueScore: score,
      recommendationNote,
    }
  })

  // Sort by Value Score descending
  comparisonItems.sort((a, b) => b.valueScore - a.valueScore)
  const best = comparisonItems[0]

  let transparentReasoning = ""
  if (best) {
    transparentReasoning = `${best.vendorName} ranks highest with an overall value score of ${best.valueScore}/100. Effective cost: ${formatINR(best.effectiveTotal)} (${best.isUnderBudget ? `${formatINR(Math.abs(best.variance))} savings` : `${formatINR(best.variance)} over budget`}).`
  }

  return {
    category,
    categoryAllocated,
    quotes: comparisonItems,
    recommendedQuoteId: best?.quoteId || null,
    transparentReasoning,
  }
}

/**
 * Generate culturally polite, clear vendor inquiry message for WhatsApp or Email.
 */
export function generateVendorInquiryDraft(params: {
  vendorName: string
  category: string
  occasion: string
  date: string
  location: string
  guestCount: number
  budgetEstimate?: number
  specificRequirements?: string
}): string {
  const occasionTitle = params.occasion || "Celebration"
  const locationText = params.location ? `in ${params.location}` : "in Kerala"
  const dateText = params.date || "our upcoming celebration date"

  return `Namaskaram ${params.vendorName},

We are planning our family ${occasionTitle} ${locationText} and are looking to confirm our ${params.category} arrangements.

Here are the key details of our event:
• Occasion: ${occasionTitle}
• Date / Window: ${dateText}
• Expected Guests: ${params.guestCount} pax
• Location: ${params.location || "To be confirmed"}
${params.budgetEstimate ? `• Target Budget Allocated: ${formatINR(params.budgetEstimate)}\n` : ""}${params.specificRequirements ? `• Key Requirements: ${params.specificRequirements}\n` : ""}
Could you please share your availability for this date, along with your package details, GST breakdown, advance booking policy, and cancellation terms?

Looking forward to hearing from you.

Warm regards,
Event Coordinator & Family`
}

