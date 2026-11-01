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
import {
  createRateLimiter,
  getClientIp,
  sendJson,
  enforcePost,
  readJsonBody,
  withTimeout,
} from "./serverUtils.ts"

dotenv.config()

export type VendorQuoteRequestPayload = {
  rawText: string
  categoryHint?: CategoryKey
  currentPlan?: {
    budget: number
    guests: number
    months: number
  }
}

const rateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 20 })

export async function handleVendorQuoteRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.writeHead(204)
    res.end()
    return
  }

  if (!enforcePost(req, res)) return

  const clientIp = getClientIp(req)
  if (!rateLimiter.check(clientIp)) {
    sendJson(res, 429, {
      error:
        "Too many requests. Please wait a minute before requesting more quote audits.",
    })
    return
  }

  const payload = await readJsonBody<VendorQuoteRequestPayload>(req, res)
  if (!payload) return

  if (
    !payload.rawText ||
    typeof payload.rawText !== "string" ||
    payload.rawText.trim().length === 0
  ) {
    sendJson(res, 422, {
      error: "Invalid quotation text: rawText is required.",
    })
    return
  }

  // 1. Pure deterministic extraction & parsing
  const parsedQuote = parseVendorQuote(
    payload.rawText,
    payload.categoryHint || "food",
  )

  // 2. Reconcile against active plan
  const planBudget = payload.currentPlan?.budget || 640000
  const planGuests = payload.currentPlan?.guests || 230
  const planMonths = payload.currentPlan?.months || 4
  const activePlan = adaptPlan(planBudget, planGuests, planMonths)

  const comparison = compareQuoteToPlan(parsedQuote, activePlan)

  const apiKey = process.env.GEMINI_API_KEY
  const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash"

  const defaultAdvice = {
    summary: comparison.recommendation,
    tips: [
      "Confirm food tasting and leaf quality 10 days prior to event.",
      "Ensure advance receipt contains explicit clause on date postponement.",
    ],
  }

  // 3. Optional Gemini 3.8 Flash contract risk audit & negotiation advice
  if (!apiKey || apiKey.trim() === "") {
    sendJson(res, 200, {
      status: "fallback",
      isAiGenerated: false,
      parsedQuote,
      comparison,
      aiNegotiationAdvice: defaultAdvice,
      aiAudit: {
        negotiationAdvice: comparison.recommendation,
        riskFlags: parsedQuote.riskFlags,
        isAiGenerated: false,
        source: "deterministic_rules",
      },
    })
    return
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const prompt = `You are KOOTTU's AI Contract Auditor & Kerala Vendor Specialist.
Audit this vendor quotation for an Indian/Kerala celebration:
Vendor: ${parsedQuote.vendorName}
Category: ${parsedQuote.category.toUpperCase()}
Quoted Amount: ₹${parsedQuote.quotedAmount.toLocaleString("en-IN")}
Category Budget Available: ₹${comparison.categoryAllocated.toLocaleString("en-IN")}
Variance: ${
      comparison.isOverBudget
        ? `₹${comparison.variance.toLocaleString("en-IN")} Over Budget`
        : `₹${Math.abs(comparison.variance).toLocaleString("en-IN")} Under Budget`
    }
GST Rate: ${parsedQuote.gstRatePercent}% (${
      parsedQuote.gstIncluded ? "Included" : "Extra"
    })
Advance Payment: ${parsedQuote.advancePaymentPercent}%
Cancellation Policy: ${parsedQuote.cancellationPolicy}
Identified Risk Flags: ${parsedQuote.riskFlags.join("; ") || "None"}

Full Raw Quotation Text:
"""
${payload.rawText.slice(0, 1500)}
"""

CRITICAL INSTRUCTION: You must strictly RESPECT THE DETERMINISTIC FIGURES above. Do NOT alter the quoted amount, variance, or budget numbers.

Provide:
1. "summary": 1-2 sentence assessment of this quotation against Kerala market standards
2. "tips": Array of 2 specific culturally relevant negotiation tips for dealing with vendors in Kerala
3. "riskAnalysis": 2 concise sentences analyzing contractual risks

Output JSON only in this exact format:
{
  "summary": "...",
  "tips": ["Tip 1", "Tip 2"],
  "riskAnalysis": "..."
}`

    const controller = new AbortController()
    const response = await withTimeout(
      ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          abortSignal: controller.signal,
        },
      }),
      undefined,
      "Vendor audit call timed out",
      controller,
    )

    const text = response.text?.trim()
    let aiAdvice = comparison.recommendation
    let aiRisks = parsedQuote.riskFlags
    let aiNegotiationAdvice = defaultAdvice

    if (text) {
      try {
        const cleanJson = text
          .replace(/^```json/im, "")
          .replace(/```$/m, "")
          .trim()
        const parsedAi = JSON.parse(cleanJson)
        if (parsedAi.summary) {
          aiAdvice = `${parsedAi.summary} ${parsedAi.riskAnalysis || ""}`.trim()
          aiNegotiationAdvice = {
            summary: parsedAi.summary,
            tips:
              Array.isArray(parsedAi.tips) && parsedAi.tips.length > 0
                ? parsedAi.tips
                : defaultAdvice.tips,
          }
        }
      } catch {
        // Fall back gracefully to deterministic advice
      }
    }

    sendJson(res, 200, {
      status: "success",
      isAiGenerated: true,
      parsedQuote,
      comparison,
      aiNegotiationAdvice,
      aiAudit: {
        negotiationAdvice: aiAdvice,
        riskFlags: aiRisks,
        isAiGenerated: true,
        source: "gemini",
      },
    })
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err)
    console.error("[KOOTTU Vendor Audit Error]:", errMessage)
    sendJson(res, 200, {
      status: "fallback",
      isAiGenerated: false,
      parsedQuote,
      comparison,
      aiNegotiationAdvice: defaultAdvice,
      aiAudit: {
        negotiationAdvice: comparison.recommendation,
        riskFlags: parsedQuote.riskFlags,
        isAiGenerated: false,
        source: "deterministic_rules_fallback",
        fallbackReason: errMessage.includes("timeout")
          ? "timeout"
          : "api_error",
      },
    })
  }
}
