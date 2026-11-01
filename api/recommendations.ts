import type { IncomingMessage, ServerResponse } from "node:http"
import { handleApiRequest } from "../src/server/recommendationsHandler.ts"

/**
 * Serverless Function handler for Vercel / Netlify production deployments.
 * This runs entirely on the server and safely accesses process.env.GEMINI_API_KEY.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return handleApiRequest(req, res)
}
