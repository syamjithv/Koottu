import assert from "node:assert/strict"
import test from "node:test"
import { EventEmitter } from "node:events"
import { adaptPlan, getTimeline } from "../data.ts"
import {
  generateDeterministicFallback,
  handleApiRequest,
} from "./recommendationsHandler.ts"
import type { IncomingMessage, ServerResponse } from "node:http"

test("deterministic fallback arithmetic: 230 to 200 guests saves 45,000 leaving 7,000 of 52,000 deficit", () => {
  const plan = adaptPlan(640000, 230, 4)
  const recs = generateDeterministicFallback(plan, 4, {
    occasion: "Wedding",
    location: "Kochi",
    priorities: ["Food and catering"],
  })

  assert.equal(
    recs.headline,
    "The current constraints cannot all be satisfied.",
  )
  assert.match(recs.analysis, /52,000 deficit/)
  // Verify exact math in decisions
  const guestDecision = recs.decisions.find((d) => d.includes("230 to 200"))
  assert.ok(guestDecision, "Guest reduction decision should be present")
  assert.match(guestDecision!, /saves ₹45,000/)
  assert.match(guestDecision!, /leaving ₹7,000 of the ₹52,000 deficit/)
})

test("deterministic fallback timeline checks task dependencies", () => {
  const normalPlan = adaptPlan(800000, 200, 4)
  const normalRecs = generateDeterministicFallback(normalPlan, 4)
  assert.match(normalRecs.timelineNote, /depends on guest estimate/i)

  const compressedPlan = adaptPlan(800000, 200, 2)
  const compressedRecs = generateDeterministicFallback(compressedPlan, 2)
  assert.match(compressedRecs.timelineNote, /compressed timeline/i)
  assert.match(compressedRecs.timelineNote, /depends on guest estimate/i)
  assert.match(compressedRecs.timelineNote, /vendor/i)
})

// Helper to mock IncomingMessage and ServerResponse for testing handleApiRequest
function createMockHttp(
  body: string,
  method = "POST",
  headers: Record<string, string> = {},
) {
  const req = new EventEmitter() as unknown as IncomingMessage
  ;(req as any).method = method
  ;(req as any).url = "/api/recommendations"
  ;(req as any).headers = { "content-type": "application/json", ...headers }
  ;(req as any).socket = { remoteAddress: "127.0.0.1" }
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
    getRawBody: () => responseData,
  }
}

test("handleApiRequest validates ground-truth calculations and returns HTTP 200", async () => {
  const origKey = process.env.GEMINI_API_KEY
  process.env.GEMINI_API_KEY = ""
  try {
    const payload = JSON.stringify({
      budget: 640000,
      guests: 230,
      months: 4,
      context: {
        occasion: "Wedding",
        location: "Kochi",
        priorities: ["Food and catering"],
      },
    })

    const { req, res, getStatusCode, getBody } = createMockHttp(payload)
    await handleApiRequest(req, res)

    assert.equal(getStatusCode(), 200)
    const body = getBody()
    assert.ok(body.groundTruth, "Should include server-calculated ground truth")
    assert.equal(body.groundTruth.totalAllocated, 692000)
    assert.equal(body.groundTruth.balance, -52000)
    assert.equal(body.groundTruth.isDeficit, true)
    assert.ok(
      body.recommendations.decisions.some((d: string) =>
        d.includes("saves ₹45,000"),
      ),
    )
  } finally {
    process.env.GEMINI_API_KEY = origKey
  }
})

test("handleApiRequest rejects out-of-range budget with HTTP 422", async () => {
  const payload = JSON.stringify({ budget: 100, guests: 200, months: 4 })
  const { req, res, getStatusCode, getBody } = createMockHttp(payload)
  await handleApiRequest(req, res)

  assert.equal(getStatusCode(), 422)
  assert.match(getBody().error, /Budget must be a number/i)
})

test("handleApiRequest rejects out-of-range guest count with HTTP 422", async () => {
  const payload = JSON.stringify({ budget: 800000, guests: 10, months: 4 })
  const { req, res, getStatusCode, getBody } = createMockHttp(payload)
  await handleApiRequest(req, res)

  assert.equal(getStatusCode(), 422)
  assert.match(getBody().error, /Guests must be an integer between 20 and 500/i)
})
