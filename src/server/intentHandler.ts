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
    let amt = Number(reduceBudgetMatch[1].replace(/,/g, ""))
    const unit = reduceBudgetMatch[2]?.toLowerCase()
    if (unit === "k") amt *= 1000
    else if (unit === "lakh" || unit === "l") amt *= 100000
    budgetDelta = -amt
  }

  const addBudgetMatch = lower.match(
    /(?:add|increase|raise|expand)\s*(?:budget|spend)?\s*(?:by)?\s*(?:₹|rs\.?)?\s*([0-9,]+)\s*(k|lakh|l)?/i,
  )
  if (addBudgetMatch) {
    let amt = Number(addBudgetMatch[1].replace(/,/g, ""))
    const unit = addBudgetMatch[2]?.toLowerCase()
    if (unit === "k") amt *= 1000
    else if (unit === "lakh" || unit === "l") amt *= 100000
    budgetDelta = amt
  }

  // Check guest count adjustments: e.g. "add 30 guests", "reduce 20 guests"
  const addGuestsMatch = lower.match(
    /(?:add|more|invite)\s*([0-9]+)\s*(?:more)?\s*guests?/i,
  )
  if (addGuestsMatch) {
    guestDelta = Number(addGuestsMatch[1])
  }
  const reduceGuestsMatch = lower.match(
    /(?:reduce|trim|cut|fewer)\s*([0-9]+)\s*guests?/i,
  )
  if (reduceGuestsMatch) {
    guestDelta = -Number(reduceGuestsMatch[1])
  }

  // Check locks
  if (
    /lock\s*(?:photo|photography)/i.test(lower) ||
    /photography.*important/i.test(lower)
  ) {
    lockedCategories.push("photo")
  }
  if (/lock\s*venue/i.test(lower)) {
    lockedCategories.push("venue")
  }
  if (/lock\s*decor/i.test(lower)) {
    lockedCategories.push("decor")
  }
  if (/lock\s*food/i.test(lower) || /keep food/i.test(lower)) {
    lockedCategories.push("food")
  }

  const recognized =
    budgetDelta !== 0 ||
    guestDelta !== 0 ||
    monthsDelta !== 0 ||
    lockedCategories.length > 0

  return {
    recognized,
    summary: recognized
      ? `Interpreted: ${
          budgetDelta !== 0
            ? `Budget ${budgetDelta > 0 ? "+" : ""}${formatINR(budgetDelta)}`
            : ""
        } ${
          guestDelta !== 0
            ? `Guests ${guestDelta > 0 ? "+" : ""}${guestDelta}`
            : ""
        } ${
          lockedCategories.length > 0
            ? `Locked: ${lockedCategories.join(", ")}`
            : ""
        }`
      : "Could not identify specific numerical adjustments from request.",
    budgetDelta,
    guestDelta,
    monthsDelta,
    lockedCategories,
    confidence: recognized ? 0.85 : 0.2,
  }
}

export async function handlePlanIntentRequest(
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

  let body = ""
  try {
    for await (const chunk of req) {
      body += chunk
    }
  } catch {
    res.writeHead(400)
    res.end(JSON.stringify({ error: "Failed to read request body." }))
    return
  }

  let payload: {
    message: string
    currentPlan: Plan
  }

  try {
    payload = JSON.parse(body || "{}")
  } catch {
    res.writeHead(400)
    res.end(JSON.stringify({ error: "Invalid JSON payload." }))
    return
  }

  if (!payload.message || typeof payload.message !== "string") {
    res.writeHead(422)
    res.end(JSON.stringify({ error: "Message string required." }))
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

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey })
      const prompt = `You are KOOTTU's natural language plan interpreter.
The user wants to adjust their celebration plan.
Current State:
- Budget: ₹${current.budget}
- Guests: ${current.guests}
- Months: ${current.months}

User request: "${payload.message}"

Extract the intended numerical changes and category locks.
Return ONLY valid JSON matching this schema:
{
  "recognized": true,
  "summary": "Clear one-sentence description of the interpreted plan changes",
  "budgetDelta": 0, // integer change in INR (e.g. -50000 or +100000), 0 if unchanged
  "guestDelta": 0,  // integer change in guest count (e.g. -30 or +50), 0 if unchanged
  "monthsDelta": 0, // integer change in planning months (e.g. -1 or +2), 0 if unchanged
  "lockedCategories": ["photo"], // array of "venue" | "food" | "decor" | "photo" | "other"
  "confidence": 0.95
}`

      const callPromise = ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.1,
          maxOutputTokens: 400,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      })

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 15000),
      )

      const response = await Promise.race([callPromise, timeoutPromise])
      const aiResult = JSON.parse(response.text || "{}")
      if (
        aiResult.summary &&
        (aiResult.budgetDelta !== undefined ||
          aiResult.guestDelta !== undefined)
      ) {
        intent = {
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

  res.writeHead(200)
  res.end(
    JSON.stringify({
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
    }),
  )
}
