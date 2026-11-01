/**
 * KOOTTU — Shared Server-Side HTTP Utilities
 *
 * Provides standardized request guards, in-memory sliding-window rate limiting,
 * body size protection (10KB guard), safe asynchronous timeout wrappers,
 * and JSON response formatting across all server handlers.
 */

import type { IncomingMessage, ServerResponse } from "node:http"

export const MAX_BODY_BYTES = 10 * 1024 // 10 KB limit to prevent large payload attacks

/**
 * Extracts normalized client IP address considering proxy forwarding headers
 */
export function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim()
  }
  return req.socket?.remoteAddress || "127.0.0.1"
}

/**
 * Creates an in-memory sliding-window rate limiter
 */
export function createRateLimiter(options?: {
  windowMs?: number
  maxRequests?: number
}) {
  const windowMs = options?.windowMs ?? 60 * 1000 // 1 minute window
  const maxRequests = options?.maxRequests ?? 20 // 20 requests per window
  const rateLimitMap = new Map<string, number[]>()

  return {
    check(clientIp: string): boolean {
      const now = Date.now()
      const timestamps = rateLimitMap.get(clientIp) || []
      const validTimestamps = timestamps.filter((t) => now - t < windowMs)
      if (validTimestamps.length >= maxRequests) {
        rateLimitMap.set(clientIp, validTimestamps)
        return false
      }
      validTimestamps.push(now)
      rateLimitMap.set(clientIp, validTimestamps)
      return true
    },
    reset(): void {
      rateLimitMap.clear()
    },
  }
}

/**
 * Sends a structured JSON HTTP response with appropriate Content-Type header
 */
export function sendJson<T>(
  res: ServerResponse,
  statusCode: number,
  payload: T,
): void {
  try {
    res.setHeader("Content-Type", "application/json")
  } catch {
    // Header might already be set in certain environments
  }
  res.writeHead(statusCode)
  res.end(JSON.stringify(payload))
}

/**
 * Guards an endpoint against non-POST requests, responding with HTTP 405
 */
export function enforcePost(
  req: IncomingMessage,
  res: ServerResponse,
): boolean {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method Not Allowed. Use POST." })
    return false
  }
  return true
}

/**
 * Reads and parses JSON request body with hard byte-limit guard.
 * Returns null if the request is oversized, invalid, or unreadable.
 */
export async function readJsonBody<T>(
  req: IncomingMessage,
  res: ServerResponse,
  maxBytes: number = MAX_BODY_BYTES,
): Promise<T | null> {
  // Support serverless environments (e.g. Vercel) where req.body is pre-parsed
  const anyReq = req as unknown as { body?: unknown }
  if (anyReq.body !== undefined && anyReq.body !== null) {
    if (typeof anyReq.body === "object") {
      return anyReq.body as T
    }
    if (typeof anyReq.body === "string") {
      if (anyReq.body.length > maxBytes) {
        sendJson(res, 413, {
          error: "Payload Too Large: maximum allowed body is 10KB.",
        })
        return null
      }
      try {
        return JSON.parse(anyReq.body || "{}") as T
      } catch {
        sendJson(res, 400, { error: "Invalid JSON payload." })
        return null
      }
    }
  }

  let body = ""
  try {
    for await (const chunk of req) {
      if (body.length + chunk.length > maxBytes) {
        sendJson(res, 413, {
          error: "Payload Too Large: maximum allowed body is 10KB.",
        })
        return null
      }
      body += chunk
    }
  } catch {
    sendJson(res, 400, { error: "Failed to read request body." })
    return null
  }

  try {
    return JSON.parse(body || "{}") as T
  } catch {
    sendJson(res, 400, { error: "Invalid JSON payload." })
    return null
  }
}

export const DEFAULT_GEMINI_TIMEOUT_MS = 60 * 1000 // 60s default preserves complex Gemini responses

/**
 * Wraps a promise with a timeout that properly aborts the underlying request,
 * unrefs and clears its timer, preventing Node.js event-loop hangs and memory leaks.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms?: number,
  timeoutMessage: string = "Operation timed out",
  controller?: AbortController,
): Promise<T> {
  const timeoutMs =
    ms ??
    (parseInt(process.env.GEMINI_TIMEOUT_MS || "", 10) ||
      DEFAULT_GEMINI_TIMEOUT_MS)

  let timer: NodeJS.Timeout | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      if (controller && typeof controller.abort === "function") {
        try {
          controller.abort(new Error(timeoutMessage))
        } catch {
          // Ignore abort errors
        }
      }
      reject(new Error(timeoutMessage))
    }, timeoutMs)
    if (typeof timer.unref === "function") {
      timer.unref()
    }
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
