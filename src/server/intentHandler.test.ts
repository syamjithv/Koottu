import assert from "node:assert/strict"
import test from "node:test"
import { EventEmitter } from "node:events"
import type { IncomingMessage, ServerResponse } from "node:http"
import {
  parseIntentDeterministically,
  handlePlanIntentRequest,
} from "./intentHandler.ts"

function createMockHttp(
  body: string,
  method = "POST",
  headers: Record<string, string> = {},
) {
  const req = new EventEmitter() as unknown as IncomingMessage
  ;(req as any).method = method
  ;(req as any).url = "/api/plan-intent"
  ;(req as any).headers = { "content-type": "application/json", ...headers }
  ;(req as any).socket = { remoteAddress: `127.0.0.${Math.floor(Math.random() * 250)}` }
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

test("intentHandler: parses budget reduction and category locks deterministically", () => {
  const result = parseIntentDeterministically(
    "Reduce budget by 50,000 and lock photography",
  )
  assert.equal(result.recognized, true)
  assert.equal(result.budgetDelta, -50000)
  assert.ok(result.lockedCategories?.includes("photo"))
})

test("intentHandler: parses guest count increase deterministically", () => {
  const result = parseIntentDeterministically(
    "We want to add 30 more guests for the wedding",
  )
  assert.equal(result.recognized, true)
  assert.equal(result.guestDelta, 30)
})

test("intentHandler: handles unrecognizable queries safely", () => {
  const result = parseIntentDeterministically("Hello what is the weather today")
  assert.equal(result.recognized, false)
  assert.equal(result.budgetDelta, 0)
  assert.equal(result.guestDelta, 0)
})

test("handlePlanIntentRequest: rejects oversized payload with HTTP 413", async () => {
  const hugePayload = JSON.stringify({
    message: "A".repeat(15 * 1024),
  })
  const { req, res, getStatusCode, getBody } = createMockHttp(hugePayload)
  await handlePlanIntentRequest(req, res)

  assert.equal(getStatusCode(), 413)
  assert.match(getBody().error, /Payload Too Large/i)
})

test("handlePlanIntentRequest: rejects non-POST method with HTTP 405", async () => {
  const { req, res, getStatusCode, getBody } = createMockHttp("", "GET")
  await handlePlanIntentRequest(req, res)

  assert.equal(getStatusCode(), 405)
  assert.match(getBody().error, /Method Not Allowed/i)
})

test("handlePlanIntentRequest: processes valid request and returns HTTP 200 with proposedPlan", async () => {
  const payload = JSON.stringify({
    message: "Reduce budget by 50,000 and lock photography",
    currentPlan: { budget: 640000, guests: 230, months: 4 },
  })
  const { req, res, getStatusCode, getBody } = createMockHttp(payload)
  await handlePlanIntentRequest(req, res)

  assert.equal(getStatusCode(), 200)
  const body = getBody()
  assert.equal(body.status, "success")
  assert.equal(body.financials.budget, 590000)
  assert.ok(body.proposedPlan.categories.length > 0)
})
