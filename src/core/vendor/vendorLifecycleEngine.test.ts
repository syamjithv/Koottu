import { test } from "node:test"
import assert from "node:assert/strict"
import { compareCategoryQuotes, generateVendorInquiryDraft } from "./vendorLifecycleEngine.ts"
import type { VendorQuote } from "../types.ts"

test("vendorLifecycleEngine: transparently ranks quotes by value score considering GST and advance", () => {
  const quoteA: VendorQuote = {
    id: "q-1",
    vendorName: "Affordable Sadya",
    category: "food",
    quotedAmount: 300000,
    gstRatePercent: 18,
    gstIncluded: false, // 300k + 18% = 354k
    advancePaymentPercent: 50,
    advanceAmount: 177000,
    cancellationPolicy: "Strict non-refundable",
    riskFlags: ["High advance", "GST extra"],
    includedServices: ["Sadya 24 items"],
    status: "reviewed",
  }

  const quoteB: VendorQuote = {
    id: "q-2",
    vendorName: "Heritage Feast Kochi",
    category: "food",
    quotedAmount: 330000,
    gstRatePercent: 5,
    gstIncluded: true, // 330k all-inclusive
    advancePaymentPercent: 25,
    advanceAmount: 82500,
    cancellationPolicy: "Full refund up to 30 days prior",
    riskFlags: [],
    includedServices: ["Sadya 28 items", "Payasam counter", "Banana leaf setup"],
    status: "reviewed",
  }

  const comparison = compareCategoryQuotes([quoteA, quoteB], 345000)

  // Heritage Feast should rank higher because it is all-inclusive (330k < 354k) and has lower advance % (25% vs 50%)
  assert.equal(comparison.recommendedQuoteId, "q-2")
  assert.equal(comparison.quotes[0].quoteId, "q-2")
  assert.equal(comparison.quotes[0].effectiveTotal, 330000)
  assert.equal(comparison.quotes[1].effectiveTotal, 354000)
  assert.ok(comparison.quotes[0].valueScore > comparison.quotes[1].valueScore)
})

test("vendorLifecycleEngine: generates respectful Kerala vendor inquiry draft", () => {
  const draft = generateVendorInquiryDraft({
    vendorName: "Lumière Studios",
    category: "Photography",
    occasion: "Kerala Wedding",
    date: "15 December 2026",
    location: "Kochi",
    guestCount: 200,
    budgetEstimate: 85000,
  })

  assert.ok(draft.includes("Namaskaram Lumière Studios"))
  assert.ok(draft.includes("Kerala Wedding"))
  assert.ok(draft.includes("200 pax"))
  assert.ok(draft.includes("₹85,000"))
})

