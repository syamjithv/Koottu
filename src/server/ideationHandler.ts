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
import {
  createRateLimiter,
  getClientIp,
  sendJson,
  enforcePost,
  readJsonBody,
  withTimeout,
} from "./serverUtils.ts"

dotenv.config()

export type IdeationRequest = {
  occasion?: string
  location?: string
  budget?: number
  guests?: number
  categoryHint?: "theme" | "decor" | "food" | "activity" | "cultural"
  preferences?: string
}

const rateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 20 })

export async function handleEventIdeasRequest(
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

  const payload = await readJsonBody<IdeationRequest>(req, res)
  if (!payload) return

  const occasion = payload.occasion || "Kerala Wedding"
  const location = payload.location || "Kochi, Kerala"
  const budget = payload.budget || 800000
  const guests = payload.guests || 200
  const categoryHint = payload.categoryHint

  const apiKey = process.env.GEMINI_API_KEY
  const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash"

  // 1. If Gemini is unavailable, use verified Kerala catalog fallback
  if (!apiKey || apiKey.trim() === "") {
    const fallbackIdeas = getFilteredFallbackIdeas(categoryHint, budget)
    sendJson(res, 200, {
      ideas: fallbackIdeas,
      source: "fallback",
      context: { occasion, location, budget, guests },
    })
    return
  }

  // 2. Call Google Gemini with cultural prompt
  try {
    const ai = new GoogleGenAI({ apiKey })
    const prompt = `You are an expert cultural consultant for Indian and Kerala celebrations (Weddings, Engagements, Housewarmings).
Suggest 3 to 5 authentic, creative, culturally elevated ideas for the following event:
Occasion: ${occasion}
Location: ${location}
Budget: ₹${budget}
Guests: ${guests}
${categoryHint ? `Target Category: ${categoryHint}` : ""}

Return a JSON array of objects with the exact structure:
[
  {
    "id": "idea-1",
    "title": "Short title",
    "category": "theme" | "decor" | "food" | "activity" | "cultural",
    "description": "Culturally nuanced description explaining why this is meaningful and authentic for a Kerala celebration",
    "estimatedCostMin": number (INR),
    "estimatedCostMax": number (INR),
    "culturalSignificance": "Why this honors tradition or delights family guests",
    "practicalTip": "Actionable advice for vendor execution or timing",
    "tags": ["tag1", "tag2"]
  }
]
Output ONLY valid JSON. No conversational text or markdown code fences.`

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
      "Ideation call timed out",
      controller,
    )

    const text = response.text?.trim()
    if (!text) {
      throw new Error("Empty response text from Gemini API")
    }

    let parsedIdeas: EventIdea[]
    try {
      const cleanJson = text
        .replace(/^```json/im, "")
        .replace(/```$/m, "")
        .trim()
      parsedIdeas = JSON.parse(cleanJson)
      if (!Array.isArray(parsedIdeas) || parsedIdeas.length === 0) {
        throw new Error("Response was not an array of ideas")
      }
    } catch {
      console.warn(
        "[KOOTTU] Failed to parse Gemini ideas JSON. Using deterministic catalog.",
      )
      parsedIdeas = getFilteredFallbackIdeas(categoryHint, budget)
    }

    sendJson(res, 200, {
      ideas: parsedIdeas,
      source: "gemini",
      context: { occasion, location, budget, guests },
    })
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err)
    console.error("[KOOTTU Ideation Service Error]:", errMessage)
    const fallbackIdeas = getFilteredFallbackIdeas(categoryHint, budget)
    sendJson(res, 200, {
      ideas: fallbackIdeas,
      source: "fallback",
      fallbackReason: errMessage.includes("timeout") ? "timeout" : "api_error",
      context: { occasion, location, budget, guests },
    })
  }
}

function getFilteredFallbackIdeas(
  categoryHint?: string,
  _budget?: number,
): EventIdea[] {
  let ideas = DEFAULT_CULTURAL_IDEAS

  if (categoryHint) {
    const filtered = ideas.filter((idea) => idea.category === categoryHint)
    if (filtered.length > 0) ideas = filtered
  }

  return ideas.slice(0, 4)
}
