/**
 * KOOTTU — Vendor Quote Analysis API Handler
 *
 * Evaluates vendor quotation text using deterministic parsing and optional
 * Gemini 3.8 Flash intelligence for contract risk auditing & negotiation strategy.
 */

import type { IncomingMessage, ServerResponse } from "node:http"
import { parseVendorQuote, compareQuoteToPlan, adaptPlan } from "../data.ts"
import type { CategoryKey } from "../core/types.ts"
import { GoogleGenAI } from "@google/genai"
import * as dotenv from "dotenv"

dotenv.config()

// Basic in-memory rate limiting safeguard for local development / single-instance nodes
// NOTE: In distributed or multi-instance production environments, distributed stores (e.g. Redis) are required.
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 20

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(clientIp) || []
  const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (valid.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(clientIp, valid)
    return false
  }
  valid.push(now)
  rateLimitMap.set(clientIp, valid)
  return true
}

export async function handleVendorQuoteRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  res.setHeader("Content-Type", "application/json")
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== "POST") {
    res.writeHead(405)
    res.end(JSON.stringify({ error: "Method Not Allowed" }))
    return
  }

  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown"
  if (!checkRateLimit(clientIp)) {
    res.writeHead(429)
    res.end(
      JSON.stringify({
        error: "Too many requests. Please wait a minute before requesting more quote audits.",
      }),
    )
    return
  }

  // Enforce 10KB request size limit
  const MAX_BYTES = 10 * 1024
  let body = ""
  let receivedBytes = 0

  try {
    for await (const chunk of req) {
      receivedBytes += chunk.length
      if (receivedBytes > MAX_BYTES) {
        res.writeHead(413)
        res.end(
          JSON.stringify({
            error: "Payload Too Large: maximum allowed body is 10KB.",
          }),
        )
        return
      }
      body += chunk
    }
  } catch {
    res.writeHead(400)
    res.end(JSON.stringify({ error: "Failed to read request body." }))
    return
  }

  let payload: {
    rawText: string
    categoryHint?: CategoryKey
    currentPlan?: {
      budget: number
      guests: number
      months: number
    }
  }

  try {
    payload = JSON.parse(body || "{}")
  } catch {
    res.writeHead(400)
    res.end(JSON.stringify({ error: "Invalid JSON payload." }))
    return
  }

  if (
    !payload.rawText ||
    typeof payload.rawText !== "string" ||
    payload.rawText.trim().length < 5
  ) {
    res.writeHead(422)
    res.end(
      JSON.stringify({
        error: "Quotation text must be provided (minimum 5 characters).",
      }),
    )
    return
  }

  // 1. Perform deterministic extraction
  const parsedQuote = parseVendorQuote(
    payload.rawText,
    payload.categoryHint || "food",
  )
  const activePlan = payload.currentPlan
    ? adaptPlan(
        payload.currentPlan.budget,
        payload.currentPlan.guests,
        payload.currentPlan.months,
      )
    : adaptPlan(800000, 200, 4)
  const comparison = compareQuoteToPlan(parsedQuote, activePlan)

  const apiKey = process.env.GEMINI_API_KEY?.trim()
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash"

  // Deterministic response if no API key
  if (!apiKey) {
    res.writeHead(200)
    res.end(
      JSON.stringify({
        status: "success",
        isAiGenerated: false,
        parsedQuote,
        comparison,
        aiNegotiationAdvice: {
          summary: "Deterministic quote breakdown complete.",
          tips: [
            "Clarify if payment terms allow 10-15% retention until final service delivery.",
            "Confirm backup generator fuel and serving team uniform expenses are all-inclusive.",
          ],
        },
      }),
    )
    return
  }

  // Enrich with Gemini 3.8 Flash contract intelligence
  try {
    const ai = new GoogleGenAI({ apiKey })
    const prompt = `You are KOOTTU's celebration vendor specialist in Kerala.
Analyze this vendor quote for a celebration:
Vendor: ${parsedQuote.vendorName}
Category: ${parsedQuote.category}
Quoted Amount: ₹${parsedQuote.quotedAmount}
GST: ${
      parsedQuote.gstIncluded
        ? "Included"
        : `${parsedQuote.gstRatePercent}% Extra`
    }
Advance: ${parsedQuote.advancePaymentPercent}% (₹${parsedQuote.advanceAmount})
Included: ${parsedQuote.includedServices.join(", ")}
Identified Risks: ${parsedQuote.riskFlags.join("; ") || "None"}
Category Budget in Plan: ₹${comparison.categoryAllocated}
Variance: ${
      comparison.isOverBudget
        ? `Over budget by ₹${comparison.variance}`
        : `Savings of ₹${Math.abs(comparison.variance)}`
    }

Provide a concise JSON analysis:
{
  "summary": "1-2 sentence assessment of this quotation against Kerala market standards",
  "tips": [
    "Specific culturally relevant negotiation tip 1",
    "Specific contract protection tip 2"
  ]
}`

    const callPromise = ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 600,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 15000),
    )

    const response = await Promise.race([callPromise, timeoutPromise])
    const aiJson = JSON.parse(response.text || "{}")

    res.writeHead(200)
    res.end(
      JSON.stringify({
        status: "success",
        isAiGenerated: true,
        parsedQuote,
        comparison,
        aiNegotiationAdvice: {
          summary: aiJson.summary || comparison.recommendation,
          tips:
            Array.isArray(aiJson.tips) && aiJson.tips.length > 0
              ? aiJson.tips
              : [
                  "Confirm food tasting and leaf quality 10 days prior to event.",
                  "Ensure advance receipt contains explicit clause on date postponement.",
                ],
        },
      }),
    )
  } catch {
    // Graceful fallback to deterministic analysis
    res.writeHead(200)
    res.end(
      JSON.stringify({
        status: "fallback",
        isAiGenerated: false,
        parsedQuote,
        comparison,
        aiNegotiationAdvice: {
          summary: comparison.recommendation,
          tips: [
            "Request itemized bill specifying exact staff count and plate guarantee.",
            "Verify whether generator fuel or transport charges are billed separately.",
          ],
        },
      }),
    )
  }
}
