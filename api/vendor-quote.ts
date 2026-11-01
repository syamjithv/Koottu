import type { IncomingMessage, ServerResponse } from "node:http"
import { handleVendorQuoteRequest } from "../src/server/vendorQuoteHandler.ts"

/**
 * Serverless Function handler for vendor quote auditing and budget variance.
 * Runs server-side and routes safely to Gemini 3.8 Flash or deterministic fallback.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return handleVendorQuoteRequest(req, res)
}
