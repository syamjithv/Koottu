// Comprehensive End-to-End Verification of KOOTTU Gemini Integration

async function runVerification() {
  console.log("=================================================")
  console.log("  KOOTTU GEMINI API END-TO-END VERIFICATION")
  console.log("=================================================\n")

  // 1. Health check
  console.log("--- TEST 1: Backend Health Check ---")
  const healthRes = await fetch("http://localhost:8443/api/health")
  const health = await healthRes.json()
  console.log("Health Response:", health)
  if (health.status !== "ok" || !health.geminiConfigured) {
    throw new Error("Health check failed or Gemini not configured!")
  }
  console.log("PASS: Backend is running and Gemini is configured.\n")

  // 2. Real Gemini Request for Constrained Scenario
  console.log("--- TEST 2: Real Gemini API Call (Constrained Scenario) ---")
  console.log("Input: Budget ₹6,40,000 | Guests 230 | Months 4")
  const startTime = Date.now()

  const recRes = await fetch("http://localhost:8443/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      budget: 640000,
      guests: 230,
      months: 4,
      context: {
        occasion: "Wedding celebration",
        location: "Kochi, Kerala",
        priorities: ["Food & catering", "Photography"],
        requirements: "Traditional vegetarian feast",
      },
    }),
  })

  const durationMs = Date.now() - startTime
  console.log(
    `Server responded in ${(durationMs / 1000).toFixed(1)}s with HTTP ${recRes.status}`,
  )

  if (recRes.status !== 200) {
    throw new Error(`API returned non-200 status: ${recRes.status}`)
  }

  const data = await recRes.json()
  console.log("\nFull Server Response:")
  console.log(JSON.stringify(data, null, 2))

  // 3. Mathematical & Deterministic Ground Truth Verification
  console.log("\n--- TEST 3: Ground Truth Mathematical Consistency ---")
  const gt = data.groundTruth
  const rec = data.recommendations

  if (gt.budget !== 640000)
    throw new Error(`Budget mismatch: expected 640000, got ${gt.budget}`)
  if (gt.totalAllocated !== 692000)
    throw new Error(
      `Total allocated mismatch: expected 692000, got ${gt.totalAllocated}`,
    )
  if (gt.balance !== -52000)
    throw new Error(`Balance mismatch: expected -52000, got ${gt.balance}`)
  if (gt.isDeficit !== true) throw new Error("Expected isDeficit to be true")

  const food = gt.categories.find((c) => c.key === "food")
  if (!food || food.amount !== 345000) {
    throw new Error(
      `Protected food cost mismatch: expected 345000, got ${food?.amount}`,
    )
  }
  console.log(
    "PASS: Authoritative calculations preserved exactly (₹6,92,000 allocated, ₹52,000 deficit).",
  )

  // 4. Recommendation Content Verification
  console.log("\n--- TEST 4: Content & Arithmetic in Recommendations ---")
  console.log("Status:", data.status)
  console.log("Is AI Generated:", data.isAiGenerated)
  console.log("Headline:", rec.headline)
  console.log("Analysis:", rec.analysis)
  console.log("Protected Insight:", rec.protectedInsight)
  console.log("Trade-offs:", rec.tradeOffs)
  console.log("Decisions:", rec.decisions)
  console.log("Timeline Note:", rec.timelineNote)

  // Check ₹45,000 savings & ₹7,000 deficit in decisions
  const decisionsText = rec.decisions.join(" ")
  const has45k =
    decisionsText.includes("45,000") || decisionsText.includes("45000")
  const has7k =
    decisionsText.includes("7,000") || decisionsText.includes("7000")
  const has52k =
    decisionsText.includes("52,000") ||
    decisionsText.includes("52000") ||
    rec.analysis.includes("52,000")

  console.log(
    `- Mentions ₹45,000 saving (30 guests * 1500): ${has45k ? "YES" : "NO"}`,
  )
  console.log(`- Mentions ₹7,000 remaining deficit: ${has7k ? "YES" : "NO"}`)
  console.log(`- Mentions ₹52,000 total deficit: ${has52k ? "YES" : "NO"}`)

  // Check timeline dependency mention
  const hasDependencyCheck =
    rec.timelineNote.toLowerCase().includes("cater") ||
    rec.timelineNote.toLowerCase().includes("guest") ||
    rec.timelineNote.toLowerCase().includes("vendor")
  console.log(
    `- References concrete task dependencies: ${
      hasDependencyCheck ? "YES" : "NO"
    }`,
  )

  // 5. Input Validation & Error Handling
  console.log("\n--- TEST 5: Input Validation & Security Safeguards ---")
  // Test invalid budget
  const invalidRes = await fetch("http://localhost:8443/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ budget: 10000, guests: 230, months: 4 }),
  })
  console.log(
    `Sub-threshold budget rejection: HTTP ${invalidRes.status} (Expected: 422)`,
  )

  // Test invalid method
  const getRes = await fetch("http://localhost:8443/api/recommendations", {
    method: "GET",
  })
  console.log(`GET method rejection: HTTP ${getRes.status} (Expected: 405)`)

  console.log("\n=================================================")
  console.log("  ALL END-TO-END VERIFICATION CHECKS COMPLETED")
  console.log("=================================================")
}

runVerification().catch((err) => {
  console.error("FATAL E2E ERROR:", err)
  process.exit(1)
})
