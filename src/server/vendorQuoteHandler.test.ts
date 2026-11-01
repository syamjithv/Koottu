import assert from "node:assert/strict"
import test from "node:test"
import {
  parseVendorQuote,
  compareQuoteToPlan,
} from "../core/vendor/vendorEngine.ts"
import { adaptPlan } from "../core/budget/budgetEngine.ts"

test("vendorQuoteHandler logic: validates and calculates variance against active plan", () => {
  const quoteText = `Lumière Visual Studios
Wedding Photography Package
Total Rate: ₹85,000 (All-inclusive, GST included)
Booking Token: 50% on booking
Coverage: 2 candid + 2 traditional photographers, 4K film`

  const quote = parseVendorQuote(quoteText, "photo")
  assert.equal(quote.quotedAmount, 85000)
  assert.equal(quote.gstIncluded, true)

  // Compare to active plan where photography is allocated ₹86,000
  const activePlan = adaptPlan(640000, 230, 4)
  const comparison = compareQuoteToPlan(quote, activePlan)

  assert.equal(comparison.categoryAllocated, 86000)
  assert.equal(comparison.variance, -1000) // ₹1,000 savings
  assert.equal(comparison.isOverBudget, false)
  assert.match(comparison.recommendation, /savings/i)
})
