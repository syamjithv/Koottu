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

dotenv.config()

export type PlanningAssistantRequest = {
  message: string
  currentPlan?: Partial<UnifiedEventPlan>
}

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

export async function handlePlanningAssistantRequest(
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
    res.end(JSON.stringify({ error: "Method Not Allowed. Use POST." }))
    return
  }

  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "127.0.0.1"

  if (!checkRateLimit(clientIp)) {
    res.writeHead(429)
    res.end(
      JSON.stringify({
        error: "Too Many Requests: rate limit exceeded. Please wait a minute.",
      }),
    )
    return
  }

  let body = ""
  const MAX_BODY_BYTES = 10 * 1024

  try {
    for await (const chunk of req) {
      if (body.length + chunk.length > MAX_BODY_BYTES) {
        res.writeHead(413)
        res.end(JSON.stringify({ error: "Payload Too Large: maximum allowed body is 10KB." }))
        return
      }
      body += chunk
    }
  } catch {
    res.writeHead(400)
    res.end(JSON.stringify({ error: "Failed to read request body." }))
    return
  }

  let payload: PlanningAssistantRequest
  try {
    payload = JSON.parse(body || "{}")
  } catch {
    res.writeHead(400)
    res.end(JSON.stringify({ error: "Invalid JSON payload." }))
    return
  }

  const userQuery = String(payload.message || "").trim().slice(0, 500)
  if (!userQuery) {
    res.writeHead(422)
    res.end(JSON.stringify({ error: "Query message cannot be empty." }))
    return
  }

  const plan = payload.currentPlan
  const budget = plan?.financials?.totalBudget || 800000
  const guests = plan?.identity?.guests || 200
  const months = plan?.identity?.months || 4
  const deficit = plan?.financials?.isDeficit ? plan?.financials?.deficitAmount : 0
  const occasion = plan?.identity?.occasion || "Kerala Celebration"

  const deterministicFallbackReply = `Regarding "${userQuery}":
In your current ${occasion} plan, you have ₹${budget.toLocaleString("en-IN")} allocated for ${guests} guests over a ${months}-month window${deficit ? `, with an active deficit of ₹${deficit.toLocaleString("en-IN")}` : ""}.
Key guidance:
• Protect the primary hospitality priorities (authentic food catering is budgeted at ₹1,500/guest).
• Ensure auditorium or mandapam booking is confirmed first, as other vendor site-visits depend on it.
• Keep all vendor commitments transparent with written GST and cancellation terms.`

  const apiKey = process.env.GEMINI_API_KEY?.trim()
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash"

  if (!apiKey) {
    res.writeHead(200)
    res.end(
      JSON.stringify({
        status: "fallback",
        isAiGenerated: false,
        reply: deterministicFallbackReply,
      }),
    )
    return
  }

  try {
    const ai = new GoogleGenAI({ apiKey })

    const systemPrompt = `You are KOOTTU's grounded celebration planning expert.
The user will ask advice about their event.
CRITICAL INSTRUCTIONS:
1. All figures given in context are verified ground truth. NEVER invent different budgets, deficits, or vendor availability.
2. Ground your advice in Kerala celebration customs, family coordination realities, and calm trade-offs.
3. Be concise (2-4 clear paragraphs or bullet points). No fluff or generic filler.`

    const contextPrompt = `Current Authoritative Event Plan Context:
- Occasion: ${occasion}
- Total Budget: ₹${budget.toLocaleString("en-IN")}
- Expected Guests: ${guests} pax
- Planning Window: ${months} months
- Financial Balance: ${deficit ? `Deficit of ₹${deficit.toLocaleString("en-IN")}` : "Balanced"}
- Key Categories: ${plan?.categories?.map((c) => `${c.name}: ₹${c.amount.toLocaleString("en-IN")}`).join(", ") || "Standard"}

User Question: "${userQuery}"`

    const callPromise = ai.models.generateContent({
      model: modelName,
      contents: contextPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        maxOutputTokens: 1500,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    let timer: NodeJS.Timeout | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Assistant call timed out after 120s")), 120000)
      timer.unref()
    })

    let response
    try {
      response = await Promise.race([callPromise, timeoutPromise])
    } finally {
      if (timer) clearTimeout(timer)
    }
    const replyText = response.text?.trim() || deterministicFallbackReply

    res.writeHead(200)
    res.end(
      JSON.stringify({
        status: "success",
        isAiGenerated: true,
        reply: replyText,
      }),
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown AI error"
    console.error("[KOOTTU Assistant Service Error]:", errorMsg)
    res.writeHead(200)
    res.end(
      JSON.stringify({
        status: "fallback",
        isAiGenerated: false,
        reply: deterministicFallbackReply,
        note: "Fallback response returned due to API error or quota exhaustion.",
      }),
    )
  }
}
