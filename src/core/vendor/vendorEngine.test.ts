import assert from "node:assert/strict"
import test from "node:test"
import { parseVendorQuote, compareQuoteToPlan } from "./vendorEngine.ts"
import { SAMPLE_QUOTES } from "./sampleQuotes.ts"
import { adaptPlan } from "../budget/budgetEngine.ts"

test("vendorEngine: extracts structured details from raw Sadya catering quotation", () => {
  const sadyaSample = SAMPLE_QUOTES[0]
  const parsed = parseVendorQuote(sadyaSample.rawText, "food")

  assert.match(parsed.vendorName, /Malabar Grand/i)
  assert.equal(parsed.category, "food")
  // Quoted amount should capture 3,50,175 or 3,33,500
  assert.ok(parsed.quotedAmount >= 333500)
  assert.equal(parsed.advancePaymentPercent, 40)
  assert.ok(parsed.riskFlags.length > 0)
})

test("vendorEngine: compares quote against active category budget accurately", () => {
  const plan = adaptPlan(640000, 230, 4) // food is allocated 345,000
  const sadyaSample = SAMPLE_QUOTES[0]
  const parsed = parseVendorQuote(sadyaSample.rawText, "food")
  const comparison = compareQuoteToPlan(parsed, plan)

  assert.equal(comparison.categoryAllocated, 345000)
  assert.equal(typeof comparison.variance, "number")
  assert.ok(comparison.recommendation.length > 10)
})
