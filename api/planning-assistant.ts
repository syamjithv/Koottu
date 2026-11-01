import type { IncomingMessage, ServerResponse } from "node:http"
import { handlePlanningAssistantRequest } from "../src/server/assistantHandler.ts"

/**
 * Serverless function for grounded conversational planning assistance.
 * Runs entirely on the server and safely uses process.env.GEMINI_API_KEY.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return handlePlanningAssistantRequest(req, res)
}
