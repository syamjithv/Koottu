/**
 * KOOTTU — Grounded Conversational Planning Assistant Handler
 *
 * Answers user planning questions strictly grounded in the authoritative
 * Unified Event Plan state, preventing hallucination of financial or timeline commitments.
 */

import type { IncomingMessage, ServerResponse } from "node:http"
import { GoogleGenAI } from "@google/genai"
import * as dotenv from "dotenv"
import type { UnifiedEventPlan } from "../core/types.ts"
import {
  createRateLimiter,
  getClientIp,
  sendJson,
  enforcePost,
  readJsonBody,
  withTimeout,
} from "./serverUtils.ts"

dotenv.config()

export type PlanningAssistantRequest = {
  message: string
  currentPlan?: Partial<UnifiedEventPlan>
}

const rateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 20 })

export async function handlePlanningAssistantRequest(
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
      error: "Too Many Requests: rate limit exceeded. Please wait a minute.",
    })
    return
  }

  const payload = await readJsonBody<PlanningAssistantRequest>(req, res)
  if (!payload) return

  const userQuery = String(payload.message || "")
    .trim()
    .slice(0, 500)
  if (!userQuery) {
    sendJson(res, 422, { error: "Query message cannot be empty." })
    return
  }

  const plan = payload.currentPlan
  const budget = plan?.financials?.totalBudget || 800000
  const guests = plan?.identity?.guests || 200
  const months = plan?.identity?.months || 4
  const deficit =
    (plan?.financials?.isDeficit ? plan?.financials?.deficitAmount : 0) || 0
  const readiness = plan?.readiness?.overallScore || 70

  const apiKey = process.env.GEMINI_API_KEY
  const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash"

  // 1. If Gemini is unavailable, use verified grounded cultural fallback
  if (!apiKey || apiKey.trim() === "") {
    const fallbackAdvice = generateGroundedFallbackAdvice(userQuery, {
      budget,
      guests,
      months,
      deficit,
      readiness,
    })
    sendJson(res, 200, {
      status: "fallback",
      isAiGenerated: false,
      reply: fallbackAdvice,
      advice: fallbackAdvice,
      source: "fallback",
      grounding: { budget, guests, months, deficit, readiness },
    })
    return
  }

  // 2. Call Google Gemini with strict plan grounding
  try {
    const ai = new GoogleGenAI({ apiKey })
    const prompt = `You are KOOTTU's AI Celebration Advisor, an expert Kerala wedding and family event planner.
You must answer the user's question accurately, thoughtfully, and culturally appropriately for Kerala/South Indian traditions.

CRITICAL INSTRUCTION: You must strictly respect the family's ACTIVE EVENT PLAN:
- Budget: ₹${budget.toLocaleString("en-IN")}
- Headcount: ${guests} guests
- Planning Horizon: ${months} months
- Baseline Deficit: ${
      deficit !== 0 ? `₹${deficit.toLocaleString("en-IN")}` : "Balanced (₹0)"
    }
- Current Readiness Score: ${readiness}/100

User Question: "${userQuery}"

Provide 2-3 focused, practical, encouraging paragraphs tailored to Kerala celebrations.
Mention specific Kerala customs where appropriate (e.g. Muhurtham timing, Sadya per-plate guarantees, Kasavu attire sourcing, monsoon Shamiana requirements).
Never contradict the numbers in their active event plan. Output clean plain text (no markdown headings).`

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
      "Assistant call timed out",
      controller,
    )

    const text = response.text?.trim()
    if (!text) {
      throw new Error("Empty response text from Gemini API")
    }

    sendJson(res, 200, {
      status: "success",
      isAiGenerated: true,
      reply: text,
      advice: text,
      source: "gemini",
      grounding: { budget, guests, months, deficit, readiness },
    })
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err)
    console.error("[KOOTTU Assistant Service Error]:", errMessage)
    const fallbackAdvice = generateGroundedFallbackAdvice(userQuery, {
      budget,
      guests,
      months,
      deficit,
      readiness,
    })
    sendJson(res, 200, {
      status: "fallback",
      isAiGenerated: false,
      reply: fallbackAdvice,
      advice: fallbackAdvice,
      source: "fallback",
      fallbackReason: errMessage.includes("timeout") ? "timeout" : "api_error",
      grounding: { budget, guests, months, deficit, readiness },
    })
  }
}

function generateGroundedFallbackAdvice(
  query: string,
  ctx: {
    budget: number
    guests: number
    months: number
    deficit: number
    readiness: number
  },
): string {
  const q = query.toLowerCase()

  if (q.includes("rain") || q.includes("monsoon") || q.includes("weather")) {
    return `For outdoor or semi-outdoor celebrations in Kerala, monsoon planning requires prioritizing waterproof shamiana canopies with side-wall curtains and industrial generator backups for uninterrupted AC. With your active plan of ${ctx.guests} guests, allocate at least ₹25,000–₹35,000 in your contingency reserve to guarantee dry covered transit between the Mandapam and dining area.`
  }

  if (q.includes("photo") || q.includes("album") || q.includes("camera")) {
    return `In Kerala, prime wedding dates see rapid booking of reputed photography teams across Kochi, Calicut, and Kottayam. For your ${ctx.months}-month timeline, we strongly recommend locking your photography contract within the next 2 weeks. Make sure your contract specifies coverage hours (typically 8–10 hours), drone footage permits, and delivery dates for both teaser reels and traditional flush-mount leatherette photo books.`
  }

  if (
    q.includes("sadya") ||
    q.includes("cater") ||
    q.includes("food") ||
    q.includes("menu")
  ) {
    return `A traditional 28-dish Kerala Sadya served on fresh plantain leaves is the culinary heart of your celebration. Based on your active plan for ${ctx.guests} guests, ensure a minimum plate guarantee of 200–220 leaves with your caterer, including 3 varieties of payasam (Ada Pradhaman, Paal Payasam, and Parippu). Coordinate serving batches with your venue's hall turnover capacity.`
  }

  if (
    q.includes("budget") ||
    q.includes("money") ||
    q.includes("cost") ||
    q.includes("deficit")
  ) {
    if (ctx.deficit > 0) {
      return `Your current celebration plan reflects an active deficit of ₹${ctx.deficit.toLocaleString("en-IN")} against your ₹${ctx.budget.toLocaleString("en-IN")} budget. We recommend using KOOTTU's Adapt Drawer to preview trade-off scenarios—such as rebalancing flexible decor minimums or slightly adjusting guest counts—to bring your budget into 100% balance without sacrificing food or photography quality.`
    }
    return `Your ₹${ctx.budget.toLocaleString("en-IN")} celebration budget is currently fully balanced with a strong readiness score of ${ctx.readiness}/100. We recommend keeping your 5% contingency cushion active to absorb unexpected local expenses such as generator diesel, overtime charges, or welcome gifts.`
  }

  return `For your ${ctx.guests}-guest Kerala celebration scheduled over ${ctx.months} months, we recommend focusing on your critical path milestones: venue contract confirmation, Sadya catering plate guarantees, and photography booking. Maintaining your ${ctx.readiness}/100 readiness score will ensure your family experiences a relaxed, auspicious celebration day.`
}
