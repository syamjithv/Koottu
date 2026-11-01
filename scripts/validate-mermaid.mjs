import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"

async function validateMermaidDiagrams() {
  const readmePath = path.resolve("README.md")
  const content = fs.readFileSync(readmePath, "utf-8")

  const mermaidRegex = /```mermaid\r?\n([\s\S]*?)```/g
  const diagrams = []
  let match

  while ((match = mermaidRegex.exec(content)) !== null) {
    diagrams.push({
      index: diagrams.length + 1,
      source: match[1].trim(),
    })
  }

  console.log(`Found ${diagrams.length} Mermaid diagram(s) in README.md\n`)
  if (diagrams.length === 0) {
    console.log("No Mermaid diagrams to validate.")
    return
  }

  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const page = await browser.newPage()

  const html = [
    "<!DOCTYPE html>",
    "<html><head>",
    '<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>',
    "<script>mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });</script>",
    "</head><body></body></html>",
  ].join("\n")

  await page.setContent(html)
  await page.waitForFunction(() => typeof window.mermaid !== "undefined" && typeof window.mermaid.parse === "function")

  let allPassed = true

  for (const diag of diagrams) {
    const firstLine = diag.source.split("\n")[0]
    console.log(`--- Validating Diagram #${diag.index} (${firstLine}) ---`)

    const result = await page.evaluate(async (sourceCode) => {
      try {
        const isValid = await window.mermaid.parse(sourceCode)
        return { success: true, isValid }
      } catch (err) {
        return { success: false, error: err.message || String(err) }
      }
    }, diag.source)

    if (result.success) {
      console.log(`[PASS] Diagram #${diag.index} is syntactically valid!\n`)
    } else {
      console.error(`[FAIL] Diagram #${diag.index} failed to parse:`)
      console.error(result.error)
      console.error("\nDiagram Source:\n" + diag.source + "\n")
      allPassed = false
    }
  }

  await browser.close()

  if (!allPassed) {
    console.error("❌ One or more Mermaid diagrams failed validation.")
    process.exit(1)
  } else {
    console.log(`✅ All ${diagrams.length} Mermaid diagrams in README.md are 100% valid!`)
  }
}

validateMermaidDiagrams().catch((err) => {
  console.error("Fatal error during Mermaid validation:", err)
  process.exit(1)
})
