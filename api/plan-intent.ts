import type { IncomingMessage, ServerResponse } from "node:http"
import { handlePlanIntentRequest } from "../src/server/intentHandler.ts"

/**
 * Serverless Function handler for natural language plan change interpretation.
 * Runs server-side and routes safely to Gemini 3.8 Flash or deterministic fallback.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return handlePlanIntentRequest(req, res)
}
