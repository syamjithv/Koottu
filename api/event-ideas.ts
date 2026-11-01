import type { IncomingMessage, ServerResponse } from "node:http"
import { handleEventIdeasRequest } from "../src/server/ideationHandler.ts"

/**
 * Serverless function for creative event ideas.
 * Runs entirely on the server and safely uses process.env.GEMINI_API_KEY.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return handleEventIdeasRequest(req, res)
}

