/**
 * KOOTTU — Server-Side Creative Event Ideation Handler
 *
 * Generates culturally authentic, budget-aware ideas using Google Gemini 3.8 Flash
 * with deterministic fallback to the Kerala Cultural Ideas catalog.
 */

import type { IncomingMessage, ServerResponse } from "node:http"
import { GoogleGenAI } from "@google/genai"
import * as dotenv from "dotenv"
import type { EventIdea } from "../core/types.ts"
import { DEFAULT_CULTURAL_IDEAS } from "../core/ideation/culturalIdeas.ts"

dotenv.config()

export type IdeationRequest = {
  occasion?: string
  location?: string
  budget?: number
  guests?: number
  categoryHint?: "theme" | "decor" | "food" | "activity" | "cultural"
  preferences?: string
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

export async function handleEventIdeasRequest(
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

  let payload: IdeationRequest
  try {
    payload = JSON.parse(body || "{}")
  } catch {
    res.writeHead(400)
    res.end(JSON.stringify({ error: "Invalid JSON payload." }))
    return
  }

  const occasion = (payload.occasion || "Kerala Celebration").slice(0, 100)
  const location = (payload.location || "Kochi, Kerala").slice(0, 100)
  const budget = Math.max(100000, Number(payload.budget) || 800000)
  const guests = Math.max(20, Math.min(1000, Number(payload.guests) || 200))
  const preferences = (payload.preferences || "").slice(0, 300)
  const categoryHint = payload.categoryHint

  const apiKey = process.env.GEMINI_API_KEY?.trim()
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash"

  // Filter fallback based on categoryHint if provided
  const fallbackIdeas = categoryHint
    ? DEFAULT_CULTURAL_IDEAS.filter((i) => i.category === categoryHint)
    : DEFAULT_CULTURAL_IDEAS

  if (!apiKey) {
    res.writeHead(200)
    res.end(
      JSON.stringify({
        status: "fallback",
        isAiGenerated: false,
        ideas: fallbackIdeas,
        note: "GEMINI_API_KEY not configured. Returned deterministic cultural ideas catalog.",
      }),
    )
    return
  }

  try {
    const ai = new GoogleGenAI({ apiKey })

    const systemPrompt = `You are KOOTTU's Kerala celebration creative strategist.
Suggest authentic, tasteful, culturally respectful event ideas tailored to the budget, guest count, and Indian/Kerala traditions.
Do NOT invent unrealistic prices or complex gadgets. Focus on high emotional value and warm hospitality.
Return ONLY valid JSON matching this schema:
{
  "ideas": [
    {
      "id": "idea-1",
      "category": "theme" | "decor" | "food" | "activity" | "cultural",
      "title": "Short descriptive title",
      "description": "2-3 sentences explaining the concept and cultural significance",
      "estimatedCostRange": "e.g. Included in Decor floor / ₹5,000 - ₹10,000 add-on",
      "saved": false
    }
  ]
}`

    const userPrompt = `Generate 4 creative ideas for this celebration:
- Occasion: ${occasion}
- Location: ${location}
- Available Budget: ₹${budget.toLocaleString("en-IN")}
- Expected Guests: ${guests} pax
${categoryHint ? `- Focus Category: ${categoryHint}\n` : ""}${preferences ? `- Host Notes / Preferences: ${preferences}\n` : ""}`

    const callPromise = ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    let timer: NodeJS.Timeout | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Ideation Gemini API timed out after 120s")), 120000)
      timer.unref()
    })

    let response
    try {
      response = await Promise.race([callPromise, timeoutPromise])
    } finally {
      if (timer) clearTimeout(timer)
    }
    const responseText = response.text || ""

    let parsedIdeas: EventIdea[] = fallbackIdeas
    let isAi = false

    try {
      const match = responseText.match(/\{[\s\S]*\}/)
      if (match) {
        const raw = JSON.parse(match[0])
        if (Array.isArray(raw.ideas) && raw.ideas.length > 0) {
          parsedIdeas = raw.ideas.map((item: Partial<EventIdea>, idx: number) => ({
            id: `idea-ai-${idx}-${Date.now()}`,
            category: item.category || "cultural",
            title: String(item.title || "Cultural Idea"),
            description: String(item.description || ""),
            estimatedCostRange: item.estimatedCostRange || "Estimate on request",
            saved: false,
          }))
          isAi = true
        }
      }
    } catch {
      parsedIdeas = fallbackIdeas
    }

    res.writeHead(200)
    res.end(
      JSON.stringify({
        status: isAi ? "success" : "fallback",
        isAiGenerated: isAi,
        ideas: parsedIdeas,
      }),
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown AI error"
    console.error("[KOOTTU Ideation Service Error]:", errorMsg)
    res.writeHead(200)
    res.end(
      JSON.stringify({
        status: "fallback",
        isAiGenerated: false,
        ideas: fallbackIdeas,
        note: "Fallback ideas served due to API error or quota exhaustion.",
      }),
    )
  }
}
