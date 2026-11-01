/**
 * KOOTTU — Deterministic Vendor Quotation Engine
 *
 * Extracts, parses, audits, and compares vendor quotes against active budget allocations.
 * Computes GST reconciliation (inclusive vs exclusive), advance payment schedules,
 * contract risk flags, and budget variance.
 */

import type {
  VendorQuote,
  VendorQuoteComparison,
  Plan,
  CategoryKey,
} from "../types.ts"
import { formatINR } from "../budget/budgetEngine.ts"

/**
 * Deterministic quote parser: extracts key financial and contractual terms from raw quotation text
 */
export function parseVendorQuote(
  rawText: string,
  categoryHint: CategoryKey = "food",
): VendorQuote {
  const text = rawText.trim()

  // 1. Extract Vendor Name
  let vendorName = "Vendor Quotation"
  const nameMatch =
    text.match(/^(?:M\/s\.?|Vendor:?|Company:?|From:?)\s*([^\n\r]+)/i) ||
    text.match(
      /^([A-Z0-9 &.,'-]{3,40}(?:Catering|Photography|Studios|Decor|Events|Manor|Resort|Planners))/im,
    )
  if (nameMatch) {
    vendorName = nameMatch[1].trim()
  } else {
    const firstLine = text.split("\n")[0].trim()
    if (firstLine.length > 3 && firstLine.length < 50) vendorName = firstLine
  }

  // 2. Extract Category
  let category: CategoryKey = categoryHint
  if (/cater|food|sadya|feast|menu|buffet|lunch|dinner|plate/i.test(text)) {
    category = "food"
  } else if (/photo|candid|album|cinemat|shoot|video|drone/i.test(text)) {
    category = "photo"
  } else if (/decor|mandap|stage|floral|light|flower|backdrop/i.test(text)) {
    category = "decor"
  } else if (/venue|hall|auditorium|resort|lawn|banquet/i.test(text)) {
    category = "venue"
  }

  // 3. Extract Quoted Amount
  let quotedAmount = 0
  const amountMatches = Array.from(
    text.matchAll(
      /(?:₹|rs\.?|inr|total[:\s]*|rate[:\s]*)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|[0-9]{4,8})/gi,
    ),
  )

  if (amountMatches.length > 0) {
    // Look for largest or explicit 'total' amount
    const parsedAmounts = amountMatches
      .map((m) => Number(m[1].replace(/,/g, "")))
      .filter((n) => !isNaN(n) && n >= 5000 && n <= 10000000)
    if (parsedAmounts.length > 0) {
      quotedAmount = Math.max(...parsedAmounts)
    }
  }

  // 4. Extract GST
  let gstRatePercent = 0
  let gstIncluded = false
  if (/gst\s*(?:included|inclusive|incl)/i.test(text)) {
    gstIncluded = true
    gstRatePercent = 18 // standard default
  } else if (/(\d{1,2})%\s*gst/i.test(text)) {
    const rateMatch = text.match(/(\d{1,2})%\s*gst/i)
    gstRatePercent = rateMatch ? Number(rateMatch[1]) : 18
    gstIncluded = /inclusive|included/i.test(text)
  } else if (/gst\s*extra|\+ gst/i.test(text)) {
    gstIncluded = false
    gstRatePercent = 18
  }

  // 5. Extract Advance Payment
  let advancePaymentPercent = 50 // Standard convention
  const advMatch = text.match(/(\d{1,2})%\s*(?:advance|booking|deposit|token)/i)
  if (advMatch) {
    advancePaymentPercent = Number(advMatch[1])
  } else if (
    /token\s*(?:amount|payment)?\s*[:=]?\s*(?:₹|rs\.?)?\s*([0-9,]+)/i.test(text)
  ) {
    const tokenMatch = text.match(
      /token\s*(?:amount|payment)?\s*[:=]?\s*(?:₹|rs\.?)?\s*([0-9,]+)/i,
    )
    if (tokenMatch && quotedAmount > 0) {
      const tokenVal = Number(tokenMatch[1].replace(/,/g, ""))
      advancePaymentPercent = Math.min(
        100,
        Math.round((tokenVal / quotedAmount) * 100),
      )
    }
  }

  const effectiveTotal =
    gstIncluded || gstRatePercent === 0
      ? quotedAmount
      : Math.round(quotedAmount * (1 + gstRatePercent / 100))
  const advanceAmount = Math.round(
    (effectiveTotal * advancePaymentPercent) / 100,
  )

  // 6. Extract Cancellation Policy
  let cancellationPolicy =
    "Standard vendor terms: advance non-refundable within 30 days of event."
  const cancelMatch = text.match(
    /(?:cancellation|refund|reschedule)[^.\n]+(?:\.[^.\n]+)?/i,
  )
  if (cancelMatch) {
    cancellationPolicy = cancelMatch[0].trim()
  }

  // 7. Extract Included Services
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  const includedServices: string[] = []
  for (const line of lines) {
    if (/^[•\-*✓]\s*(.+)/.test(line)) {
      includedServices.push(line.replace(/^[•\-*✓]\s*/, "").slice(0, 80))
    } else if (
      /(?:includes|coverage|package|deliverables):?\s*(.+)/i.test(line)
    ) {
      const match = line.match(
        /(?:includes|coverage|package|deliverables):?\s*(.+)/i,
      )
      if (match) includedServices.push(match[1].slice(0, 80))
    }
    if (includedServices.length >= 6) break
  }

  if (includedServices.length === 0) {
    includedServices.push(
      category === "food"
        ? "Full feast service including serving staff & standard tableware"
        : category === "photo"
          ? "Two lead photographers covering ceremony & reception"
          : "Standard package deliverables as detailed in quotation",
    )
  }

  // 8. Identify Risk Flags & Hidden Traps
  const riskFlags: string[] = []
  if (!gstIncluded && gstRatePercent > 0) {
    riskFlags.push(
      `${gstRatePercent}% GST extra over base quote (+${formatINR(effectiveTotal - quotedAmount)})`,
    )
  }
  if (/overtime|extra hours/i.test(text)) {
    riskFlags.push("Overtime charges apply beyond contract duration")
  }
  if (/non[- ]refundable/i.test(text)) {
    riskFlags.push(
      "Advance payment is strictly non-refundable upon cancellation",
    )
  }
  if (advancePaymentPercent > 50) {
    riskFlags.push(
      `High advance commitment required (${advancePaymentPercent}% upfront)`,
    )
  }
  if (
    /generator|diesel|power/i.test(text) &&
    /extra|chargeable|client/i.test(text)
  ) {
    riskFlags.push("Generator/fuel charges are extra and client-billed")
  }

  return {
    id: `quote-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    vendorName,
    category,
    quotedAmount,
    gstRatePercent,
    gstIncluded,
    advancePaymentPercent,
    advanceAmount,
    cancellationPolicy,
    includedServices,
    riskFlags,
    sourceText: rawText,
    status: "reviewed",
  }
}

/**
 * Compare vendor quote against the category's allocated budget in the active plan
 */
export function compareQuoteToPlan(
  quote: VendorQuote,
  plan: Plan,
): VendorQuoteComparison {
  const category = plan.categories.find((c) => c.key === quote.category)
  const allocated = category ? category.amount : 0

  const effectiveTotal =
    quote.gstIncluded || quote.gstRatePercent === 0
      ? quote.quotedAmount
      : Math.round(quote.quotedAmount * (1 + quote.gstRatePercent / 100))

  const variance = effectiveTotal - allocated
  const variancePercent =
    allocated > 0 ? Math.round((variance / allocated) * 100) : 0
  const isOverBudget = variance > 0

  let recommendation = ""
  if (variance === 0) {
    recommendation = `Quotation matches your ${category?.name} budget of ${formatINR(allocated)} perfectly.`
  } else if (isOverBudget) {
    recommendation = `Quotation exceeds your ${category?.name} allocation by ${formatINR(
      variance,
    )} (${variancePercent}% over budget). Requires absorbing ${formatINR(variance)} from secondary categories.`
  } else {
    recommendation = `Quotation is under budget by ${formatINR(
      Math.abs(variance),
    )} (${Math.abs(variancePercent)}% savings). Frees up room for other commitments.`
  }

  return {
    quote,
    categoryAllocated: allocated,
    variance,
    variancePercent,
    isOverBudget,
    impactOnTotalBalance: -variance,
    recommendation,
  }
}
