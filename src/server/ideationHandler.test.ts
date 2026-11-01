import { test } from "node:test"
import assert from "node:assert/strict"
import { handleEventIdeasRequest } from "./ideationHandler.ts"
import { handlePlanningAssistantRequest } from "./assistantHandler.ts"
import { EventEmitter } from "node:events"
import type { IncomingMessage, ServerResponse } from "node:http"

function createMockReq(method: string, bodyObj?: any): IncomingMessage {
  const req = new EventEmitter() as any
  req.method = method
  req.headers = { "content-type": "application/json" }
  req.socket = { remoteAddress: "127.0.0.1" }
  const jsonStr = bodyObj !== undefined ? JSON.stringify(bodyObj) : ""
  req[Symbol.asyncIterator] = async function* () {
    yield Buffer.from(jsonStr)
  }
  return req as IncomingMessage
}

function createMockRes(): { res: ServerResponse; getOutput: () => { statusCode: number; body: any } } {
  let statusCode = 200
  let resBody = ""
  const res = {
    setHeader: () => {},
    writeHead: (code: number) => {
      statusCode = code
    },
    end: (chunk?: string) => {
      if (chunk) resBody += chunk
    },
  } as unknown as ServerResponse

  return {
    res,
    getOutput: () => ({
      statusCode,
      body: resBody ? JSON.parse(resBody) : null,
    }),
  }
}

test("handleEventIdeasRequest: returns 405 for non-POST", async () => {
  const req = createMockReq("GET")
  const { res, getOutput } = createMockRes()
  await handleEventIdeasRequest(req, res)
  assert.equal(getOutput().statusCode, 405)
})

test("handleEventIdeasRequest: returns valid ideas (fallback or AI)", async () => {
  const req = createMockReq("POST", {
    occasion: "Kerala Wedding",
    budget: 800000,
    guests: 200,
  })
  const { res, getOutput } = createMockRes()
  await handleEventIdeasRequest(req, res)
  const output = getOutput()
  assert.equal(output.statusCode, 200)
  assert.ok(Array.isArray(output.body.ideas))
  assert.ok(output.body.ideas.length >= 1)
})

test("handlePlanningAssistantRequest: returns grounded advice", async () => {
  const req = createMockReq("POST", {
    message: "What is the recommended photography booking timeline in Kochi?",
    currentPlan: {
      identity: { occasion: "Wedding", budget: 800000, guests: 200, months: 4 },
      financials: { totalBudget: 800000, isDeficit: false },
    },
  })
  const { res, getOutput } = createMockRes()
  await handlePlanningAssistantRequest(req, res)
  const output = getOutput()
  assert.equal(output.statusCode, 200)
  assert.ok(typeof output.body.reply === "string")
  assert.ok(output.body.reply.length > 20)
})
