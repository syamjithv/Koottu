import type { IncomingMessage, ServerResponse } from "node:http"

export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
): void {
  res.setHeader("Content-Type", "application/json")
  res.writeHead(200)
  res.end(
    JSON.stringify({
      status: "ok",
      service: "koottu-gemini-api",
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      model: process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash",
      time: new Date().toISOString(),
    }),
  )
}
