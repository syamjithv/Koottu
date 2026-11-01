import { test } from "node:test"
import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import type { IncomingMessage, ServerResponse } from "node:http"
import {
  getClientIp,
  createRateLimiter,
  sendJson,
  enforcePost,
  readJsonBody,
  withTimeout,
} from "./serverUtils.ts"

function createMockReq(
  method: string = "POST",
  bodyString: string = "",
  headers: Record<string, string> = {},
): IncomingMessage {
  const req = new EventEmitter() as any
  req.method = method
  req.headers = { "content-type": "application/json", ...headers }
  req.socket = { remoteAddress: "192.168.1.100" }
  req[Symbol.asyncIterator] = async function* () {
    if (bodyString) {
      yield Buffer.from(bodyString)
    }
  }
  return req as IncomingMessage
}

function createMockRes(): {
  res: ServerResponse
  getStatusCode: () => number
  getBody: () => any
} {
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
    getStatusCode: () => statusCode,
    getBody: () => (resBody ? JSON.parse(resBody) : null),
  }
}

test("serverUtils: getClientIp extracts forwarded IP or socket address", () => {
  const reqWithForwarded = createMockReq("POST", "", {
    "x-forwarded-for": "203.0.113.195, 70.41.3.18",
  })
  assert.equal(getClientIp(reqWithForwarded), "203.0.113.195")

  const reqWithoutForwarded = createMockReq("POST", "")
  assert.equal(getClientIp(reqWithoutForwarded), "192.168.1.100")
})

test("serverUtils: createRateLimiter enforces window limit and resets", () => {
  const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 2 })
  assert.equal(limiter.check("client-1"), true)
  assert.equal(limiter.check("client-1"), true)
  assert.equal(limiter.check("client-1"), false) // Exceeded

  // Different client still allowed
  assert.equal(limiter.check("client-2"), true)

  limiter.reset()
  assert.equal(limiter.check("client-1"), true)
})

test("serverUtils: enforcePost rejects non-POST requests with 405", () => {
  const { res, getStatusCode, getBody } = createMockRes()
  const getReq = createMockReq("GET")
  const allowed = enforcePost(getReq, res)

  assert.equal(allowed, false)
  assert.equal(getStatusCode(), 405)
  assert.match(getBody().error, /Method Not Allowed/i)

  const postReq = createMockReq("POST")
  const { res: res2 } = createMockRes()
  assert.equal(enforcePost(postReq, res2), true)
})

test("serverUtils: readJsonBody parses valid JSON payloads", async () => {
  const { res } = createMockRes()
  const req = createMockReq(
    "POST",
    JSON.stringify({ message: "Hello", count: 42 }),
  )
  const parsed = await readJsonBody<{ message: string; count: number }>(req, res)

  assert.deepEqual(parsed, { message: "Hello", count: 42 })
})

test("serverUtils: readJsonBody rejects oversized payloads with 413", async () => {
  const { res, getStatusCode, getBody } = createMockRes()
  const hugeBody = "X".repeat(12 * 1024) // 12 KB
  const req = createMockReq("POST", hugeBody)
  const parsed = await readJsonBody(req, res, 10 * 1024)

  assert.equal(parsed, null)
  assert.equal(getStatusCode(), 413)
  assert.match(getBody().error, /Payload Too Large/i)
})

test("serverUtils: readJsonBody rejects malformed JSON with 400", async () => {
  const { res, getStatusCode, getBody } = createMockRes()
  const req = createMockReq("POST", "MALFORMED_JSON_{")
  const parsed = await readJsonBody(req, res)

  assert.equal(parsed, null)
  assert.equal(getStatusCode(), 400)
  assert.match(getBody().error, /Invalid JSON/i)
})

test("serverUtils: readJsonBody supports pre-parsed req.body in serverless environments", async () => {
  const { res } = createMockRes()
  const req = {
    method: "POST",
    headers: {},
    body: { occasion: "Wedding", budget: 800000 },
  } as unknown as IncomingMessage

  const parsed = await readJsonBody<{ occasion: string; budget: number }>(req, res)
  assert.deepEqual(parsed, { occasion: "Wedding", budget: 800000 })
})

test("serverUtils: withTimeout resolves successfully when promise finishes", async () => {
  const result = await withTimeout(Promise.resolve("data"), 500)
  assert.equal(result, "data")
})

test("serverUtils: withTimeout aborts controller and rejects on expiration", async () => {
  const controller = new AbortController()
  const hangingPromise = new Promise((resolve) => setTimeout(resolve, 5000))

  await assert.rejects(
    async () => {
      await withTimeout(hangingPromise, 50, "Timed out", controller)
    },
    { message: "Timed out" },
  )
  assert.equal(controller.signal.aborted, true)
})
