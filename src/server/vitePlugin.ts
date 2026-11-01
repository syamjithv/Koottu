import type { Plugin } from "vite"
import { handleApiRequest } from "./recommendationsHandler.ts"
import { handlePlanIntentRequest } from "./intentHandler.ts"
import { handleVendorQuoteRequest } from "./vendorQuoteHandler.ts"

export function recommendationsApiPlugin(): Plugin {
  return {
    name: "koottu-recommendations-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          next()
          return
        }

        // Health check endpoint
        if (req.url === "/api/health" && req.method === "GET") {
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
          return
        }

        // Recommendations endpoint
        if (req.url === "/api/recommendations") {
          await handleApiRequest(req, res)
          return
        }

        // Natural Language Plan Intent endpoint
        if (req.url === "/api/plan-intent") {
          await handlePlanIntentRequest(req, res)
          return
        }

        // Vendor Quote analysis endpoint
        if (req.url === "/api/vendor-quote") {
          await handleVendorQuoteRequest(req, res)
          return
        }

        next()
      })
    },
  }
}
