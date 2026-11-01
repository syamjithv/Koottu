/**
 * KOOTTU — Natural Language Plan Intent API Handler
 *
 * Translates conversational plan change requests into structured parameters,
 * evaluates them against the deterministic budget engine, and returns a concrete proposal.
 */

import type { IncomingMessage, ServerResponse } from "node:http"
import { adaptPlan, sumPlan, formatINR, isOriginalPlan } from "../data.ts"
import type { Plan, PlanIntent } from "../core/types.ts"
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

/**
 * Deterministic regex fallback interpreter for offline / fallback mode
 */
export function parseIntentDeterministically(text: string): PlanIntent {
  const lower = text.toLowerCase()
  let budgetDelta = 0
  let guestDelta = 0
  let monthsDelta = 0
  const lockedCategories: string[] = []

  // Check budget adjustments: e.g. "reduce budget by 50,000", "cut 40k", "increase budget by 1 lakh"
  const reduceBudgetMatch = lower.match(
    /(?:reduce|cut|lower|decrease|trim)\s*(?:budget|spend|cost)?\s*(?:by)?\s*(?:₹|rs\.?)?\s*([0-9,]+)\s*(k|lakh|l)?/i,
  )
  if (reduceBudgetMatch) {
    let val = Number.parseFloat(reduceBudgetMatch[1].replace(/,/g, ""))
    const unit = (reduceBudgetMatch[2] || "").toLowerCase()
    if (unit === "k") val *= 1000
    if (unit === "lakh" || unit === "l") val *= 100000
    budgetDelta = -Math.round(val)
  }

  const increaseBudgetMatch = lower.match(
    /(?:increase|add|raise|boost)\s*(?:budget|spend)?\s*(?:by)?\s*(?:₹|rs\.?)?\s*([0-9,]+)\s*(k|lakh|l)?/i,
  )
  if (increaseBudgetMatch) {
    let val = Number.parseFloat(increaseBudgetMatch[1].replace(/,/g, ""))
    const unit = (increaseBudgetMatch[2] || "").toLowerCase()
    if (unit === "k") val *= 1000
    if (unit === "lakh" || unit === "l") val *= 100000
    budgetDelta = Math.round(val)
  }

  // Check guest adjustments: e.g. "add 30 guests", "reduce guests to 200", "remove 20 guests"
  const addGuestsMatch = lower.match(
    /(?:add|increase|more)\s*([0-9]+)\s*(?:guests|people|heads|attendees)?/i,
  )
  if (addGuestsMatch) {
    guestDelta = Number.parseInt(addGuestsMatch[1], 10)
  }

  const reduceGuestsMatch = lower.match(
    /(?:cut|reduce|trim|fewer|less)\s*([0-9]+)\s*(?:guests|people|heads|attendees)?/i,
  )
  if (reduceGuestsMatch) {
    guestDelta = -Number.parseInt(reduceGuestsMatch[1], 10)
  }

  // Check timeline adjustments: e.g. "shorten timeline by 1 month", "need 2 more months"
  const addMonthsMatch = lower.match(
    /(?:add|extend|more)\s*([0-9]+)\s*(?:months?)/i,
  )
  if (addMonthsMatch) {
    monthsDelta = Number.parseInt(addMonthsMatch[1], 10)
  }
  const reduceMonthsMatch = lower.match(
    /(?:shorten|reduce|faster by)\s*([0-9]+)\s*(?:months?)/i,
  )
  if (reduceMonthsMatch) {
    monthsDelta = -Number.parseInt(reduceMonthsMatch[1], 10)
  }

  // Check locks
  if (lower.includes("lock photo") || lower.includes("keep photo")) {
    lockedCategories.push("photo")
  }
  if (lower.includes("lock venue") || lower.includes("keep venue")) {
    lockedCategories.push("venue")
  }
  if (lower.includes("lock food") || lower.includes("keep food")) {
    lockedCategories.push("food")
  }
  if (lower.includes("lock decor") || lower.includes("keep decor")) {
    lockedCategories.push("decor")
  }

  const recognized =
    budgetDelta !== 0 ||
    guestDelta !== 0 ||
    monthsDelta !== 0 ||
    lockedCategories.length > 0

  const summary = recognized
    ? `Adjusting: ${[
        budgetDelta !== 0
          ? `Budget ${budgetDelta > 0 ? "+" : ""}${formatINR(budgetDelta)}`
          : null,
        guestDelta !== 0
          ? `Guests ${guestDelta > 0 ? "+" : ""}${guestDelta}`
          : null,
        monthsDelta !== 0
          ? `Timeline ${monthsDelta > 0 ? "+" : ""}${monthsDelta}mo`
          : null,
        lockedCategories.length > 0
          ? `Locked: ${lockedCategories.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join(" | ")}`
    : "Could not parse clear numerical adjustment from query."

  return {
    rawMessage: text,
    recognized,
    summary,
    budgetDelta,
    guestDelta,
    monthsDelta,
    lockedCategories,
    confidence: recognized ? 0.95 : 0.2,
  }
}

const rateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 20 })

export async function handlePlanIntentRequest(
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
        "Too many requests. Please wait a minute before requesting more interpretations.",
    })
    return
  }

  const payload = await readJsonBody<{ message: string; currentPlan: Plan }>(
    req,
    res,
  )
  if (!payload) return

  if (!payload.message || typeof payload.message !== "string") {
    sendJson(res, 422, { error: "Message string required." })
    return
  }

  const current = payload.currentPlan || {
    budget: 800000,
    guests: 200,
    months: 4,
    categories: [],
  }

  const deterministicIntent = parseIntentDeterministically(payload.message)
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash"

  let intent: PlanIntent = deterministicIntent
  let isAiGenerated = false

  // Try calling Gemini if API key is present
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey })
      const prompt = `You are KOOTTU's natural language intent interpreter for Indian celebration planning.
Analyze this user request to adjust their celebration plan:
"${payload.message}"

Current plan context:
- Budget: ₹${current.budget.toLocaleString("en-IN")}
- Guests: ${current.guests}
- Months: ${current.months}
- Currently locked categories: ${(current.lockedKeys || []).join(", ") || "None"}

Extract any desired adjustments:
- budgetDelta: Number in INR (positive if adding money, negative if reducing, 0 if unchanged)
- guestDelta: Integer (positive if adding guests, negative if reducing, 0 if unchanged)
- monthsDelta: Integer (positive if extending timeline, negative if shortening, 0 if unchanged)
- lockedCategories: Array of category keys to lock ("venue", "food", "decor", "photo", "other")
- summary: A single friendly sentence summarizing the changes
- recognized: boolean

Output strictly valid JSON with this schema, no markdown code block fences:
{
  "recognized": true,
  "summary": "Reducing budget by ₹50,000 and locking Photography",
  "budgetDelta": -50000,
  "guestDelta": 0,
  "monthsDelta": 0,
  "lockedCategories": ["photo"],
  "confidence": 0.95
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
        "Intent call timed out",
        controller,
      )

      const text = response.text?.trim()
      if (text) {
        const cleanJson = text
          .replace(/^```json/im, "")
          .replace(/```$/m, "")
          .trim()
        const aiResult = JSON.parse(cleanJson)
        intent = {
          rawMessage: payload.message,
          recognized: Boolean(aiResult.recognized),
          summary: String(aiResult.summary),
          budgetDelta: Number(aiResult.budgetDelta) || 0,
          guestDelta: Number(aiResult.guestDelta) || 0,
          monthsDelta: Number(aiResult.monthsDelta) || 0,
          lockedCategories: Array.isArray(aiResult.lockedCategories)
            ? aiResult.lockedCategories
            : [],
          confidence: Number(aiResult.confidence) || 0.9,
        }
        isAiGenerated = true
      }
    } catch {
      // Fallback to deterministic intent
    }
  }

  // Calculate PROPOSED PLAN using deterministic budget engine
  const targetBudget = Math.max(
    300000,
    current.budget + (intent.budgetDelta || 0),
  )
  const targetGuests = Math.max(
    20,
    Math.min(500, current.guests + (intent.guestDelta || 0)),
  )
  const targetMonths = Math.max(
    1,
    Math.min(12, current.months + (intent.monthsDelta || 0)),
  )
  const lockedKeys = Array.from(
    new Set([
      ...(current.lockedKeys || []),
      ...(intent.lockedCategories || []),
    ]),
  )

  const proposedPlan = adaptPlan(
    targetBudget,
    targetGuests,
    targetMonths,
    lockedKeys,
  )
  const totalAllocated = sumPlan(proposedPlan)
  const balance = targetBudget - totalAllocated

  sendJson(res, 200, {
    status: "success",
    isAiGenerated,
    intent,
    proposedPlan,
    financials: {
      budget: targetBudget,
      guests: targetGuests,
      months: targetMonths,
      totalAllocated,
      balance,
      isDeficit: balance < 0,
    },
  })
}
