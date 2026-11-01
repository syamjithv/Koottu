import assert from "node:assert/strict"
import test from "node:test"
import { EventEmitter } from "node:events"
import type { IncomingMessage, ServerResponse } from "node:http"
import {
  parseVendorQuote,
  compareQuoteToPlan,
} from "../core/vendor/vendorEngine.ts"
import { adaptPlan } from "../core/budget/budgetEngine.ts"
import { handleVendorQuoteRequest } from "./vendorQuoteHandler.ts"

function createMockHttp(
  body: string,
  method = "POST",
  headers: Record<string, string> = {},
) {
  const req = new EventEmitter() as unknown as IncomingMessage
  ;(req as any).method = method
  ;(req as any).url = "/api/vendor-quote"
  ;(req as any).headers = { "content-type": "application/json", ...headers }
  ;(req as any).socket = {
    remoteAddress: `127.0.0.${Math.floor(Math.random() * 250)}`,
  }
  ;(req as any)[Symbol.asyncIterator] = async function* () {
    yield Buffer.from(body)
  }

  let statusCode = 200
  let responseData = ""
  const responseHeaders: Record<string, string> = {}

  const res = {
    setHeader: (name: string, value: string) => {
      responseHeaders[name.toLowerCase()] = value
    },
    writeHead: (code: number) => {
      statusCode = code
    },
    end: (chunk?: string) => {
      if (chunk) responseData += chunk
    },
  } as unknown as ServerResponse

  return {
    req,
    res,
    getStatusCode: () => statusCode,
    getBody: () => JSON.parse(responseData || "{}"),
  }
}

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

test("handleVendorQuoteRequest: rejects oversized payload with HTTP 413", async () => {
  const hugePayload = JSON.stringify({
    rawText: "X".repeat(15 * 1024),
  })
  const { req, res, getStatusCode, getBody } = createMockHttp(hugePayload)
  await handleVendorQuoteRequest(req, res)

  assert.equal(getStatusCode(), 413)
  assert.match(getBody().error, /Payload Too Large/i)
})

test("handleVendorQuoteRequest: rejects non-POST method with HTTP 405", async () => {
  const { req, res, getStatusCode, getBody } = createMockHttp("", "GET")
  await handleVendorQuoteRequest(req, res)

  assert.equal(getStatusCode(), 405)
  assert.match(getBody().error, /Method Not Allowed/i)
})

test("handleVendorQuoteRequest: processes valid quotation text and returns HTTP 200", async () => {
  const payload = JSON.stringify({
    rawText:
      "M/s Malabar Sadya Caterers\nTraditional Kerala Feast (230 guests)\nTotal: ₹3,50,000\nAdvance: 40% on booking",
    categoryHint: "food",
    currentPlan: { budget: 640000, guests: 230, months: 4 },
  })
  const { req, res, getStatusCode, getBody } = createMockHttp(payload)
  await handleVendorQuoteRequest(req, res)

  assert.equal(getStatusCode(), 200)
  const body = getBody()
  assert.ok(body.status === "success" || body.status === "fallback")
  assert.equal(body.parsedQuote.vendorName, "Malabar Sadya Caterers")
  assert.ok(body.comparison.variance !== undefined)
})
