import {
  adaptPlan,
  sumPlan,
  formatINR,
  generateTradeOffScenarios,
  analyzeScheduleFeasibility,
  propagateTaskDelay,
  parseVendorQuote,
  compareQuoteToPlan,
  SAMPLE_QUOTES,
  exportPlanJSON,
  importPlanJSON,
  DEFAULT_SETUP,
  originalPlan,
} from "../src/data.ts"

async function runQASprint() {
  console.log("====================================================================");
  console.log("  KOOTTU QUALITY ASSURANCE & COMPETITION READINESS SPRINT VERIFIER");
  console.log("====================================================================\n");

  let passedChecks = 0;
  let totalChecks = 0;
  function assertCheck(name, condition, details = "") {
    totalChecks++;
    if (condition) {
      console.log(`[PASS] ${name} ${details ? `(${details})` : ""}`);
      passedChecks++;
    } else {
      console.error(`[FAIL] ${name} ${details ? `FAILED: ${details}` : ""}`);
      throw new Error(`QA Check failed: ${name}`);
    }
  }

  // --- 1. HEALTH ENDPOINT ---
  console.log("--- 1. Testing /api/health ---");
  const healthRes = await fetch("http://localhost:8443/api/health");
  const healthData = await healthRes.json();
  assertCheck("Health Endpoint Status 200", healthRes.status === 200);
  assertCheck("Gemini Configured", healthData.geminiConfigured === true, `Model: ${healthData.model}`);

  // --- 2. BENCHMARK MATHEMATICAL RECONCILIATION ---
  console.log("\n--- 2. Mathematical Reconciliation (640k / 230 guests / 4 months) ---");
  const plan = adaptPlan(640000, 230, 4);
  const spent = sumPlan(plan);
  const balance = 640000 - spent;
  const foodCat = plan.categories.find(c => c.key === "food");

  assertCheck("Total Allocated is exactly ₹6,92,000", spent === 692000, `Got: ${spent}`);
  assertCheck("Deficit is exactly -₹52,000", balance === -52000, `Got: ${balance}`);
  assertCheck("Food & catering is strictly ₹3,45,000 (230 * 1500)", foodCat?.amount === 345000, `Got: ${foodCat?.amount}`);

  // --- 3. ALL THREE TRADE-OFF SCENARIOS ---
  console.log("\n--- 3. Verifying All Three Trade-Off Scenarios ---");
  const scenarios = generateTradeOffScenarios(plan);
  assertCheck("Generates exactly 3 scenarios", scenarios.length === 3);

  // Scenario A: Guest Trim
  const scA = scenarios.find(s => s.id === "guest-trim");
  assertCheck("Scenario A delta guests is -30 (230 -> 200)", scA?.deltaGuests === -30);
  assertCheck("Scenario A savings is ₹45,000", scA?.savingsAmount === 45000);
  assertCheck("Scenario A residual deficit is exactly ₹7,000", scA?.remainingDeficit === 7000);
  assertCheck("Scenario A proposed plan total spend is ₹6,47,000", sumPlan(scA.proposedPlan) === 647000);
  assertCheck("Scenario A is NOT fully balanced (residual deficit exposed)", scA?.isFullyBalanced === false);

  // Scenario B: Headcount Protected
  const scB = scenarios.find(s => s.id === "category-rebalance");
  assertCheck("Scenario B preserves all 230 guests", scB?.proposedPlan.guests === 230);
  assertCheck("Scenario B food remains ₹3,45,000", scB?.proposedPlan.categories.find(c => c.key === "food")?.amount === 345000);
  assertCheck("Scenario B fully balances deficit (₹0 residual)", scB?.remainingDeficit === 0 && scB?.isFullyBalanced === true);
  assertCheck("Scenario B total spend equals budget (₹6,40,000)", sumPlan(scB.proposedPlan) === 640000);

  // Scenario C: Balanced Compromise
  const scC = scenarios.find(s => s.id === "balanced");
  assertCheck("Scenario C trims 15 guests (230 -> 215)", scC?.deltaGuests === -15);
  assertCheck("Scenario C fully balances deficit (₹0 residual)", scC?.remainingDeficit === 0 && scC?.isFullyBalanced === true);
  assertCheck("Scenario C total spend equals budget (₹6,40,000)", sumPlan(scC.proposedPlan) === 640000);

  // --- 4. CATEGORY LOCKS INTEGRITY ---
  console.log("\n--- 4. Category Locks Integrity ---");
  const lockedPlan = adaptPlan(640000, 230, 4, ["photo"]);
  const scLocked = generateTradeOffScenarios(lockedPlan, ["photo"]);
  const scBLocked = scLocked.find(s => s.id === "category-rebalance");
  const photoLocked = scBLocked?.proposedPlan.categories.find(c => c.key === "photo");
  assertCheck("Locked category (photo) never changes amount", photoLocked?.amount === 86000);
  assertCheck("Locked category is marked as locked", photoLocked?.locked === true);

  // --- 5. NATURAL LANGUAGE PLAN INTENT API ---
  console.log("\n--- 5. Testing /api/plan-intent ---");
  const intentRes = await fetch("http://localhost:8443/api/plan-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Reduce budget by 50,000 and lock photography",
      currentPlan: { budget: 640000, guests: 230, months: 4 }
    })
  });
  const intentData = await intentRes.json();
  assertCheck("Intent API status 200", intentRes.status === 200);
  assertCheck("Intent recognizes budget reduction", intentData.intent?.budgetDelta === -50000);
  assertCheck("Intent recognizes photo lock", intentData.intent?.lockedCategories?.includes("photo"));
  assertCheck("Intent recomputes proposed plan budget to ₹5,90,000", intentData.financials?.budget === 590000);

  // --- 6. VENDOR QUOTATION EXTRACTION & AUDIT API ---
  console.log("\n--- 6. Testing /api/vendor-quote ---");
  const sampleSadya = SAMPLE_QUOTES[0];
  const quoteRes = await fetch("http://localhost:8443/api/vendor-quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rawText: sampleSadya.rawText,
      categoryHint: "food",
      currentPlan: { budget: 640000, guests: 230, months: 4 }
    })
  });
  const quoteData = await quoteRes.json();
  assertCheck("Vendor Quote API status 200", quoteRes.status === 200);
  assertCheck("Extracted vendor name", quoteData.parsedQuote?.vendorName?.includes("Malabar"));
  assertCheck("Extracted category food", quoteData.parsedQuote?.category === "food");
  assertCheck("Extracted advance payment % (40%)", quoteData.parsedQuote?.advancePaymentPercent === 40);
  assertCheck("Identified risk flags (e.g. non-refundable/GST extra)", quoteData.parsedQuote?.riskFlags?.length > 0);
  assertCheck("Compared against category budget (₹3,45,000)", quoteData.comparison?.categoryAllocated === 345000);

  // --- 7. TIMELINE DAG, CRITICAL PATH, & FEASIBILITY ---
  console.log("\n--- 7. Timeline DAG, Critical Path, & Feasibility ---");
  const feasibilityNormal = analyzeScheduleFeasibility(4);
  assertCheck("4-month timeline is feasible", feasibilityNormal.isFeasible === true);
  assertCheck("Critical path identified", feasibilityNormal.criticalPathTaskIds.length >= 3);
  assertCheck("Feasibility buffer is positive (51 days)", feasibilityNormal.slackDays > 0, `Slack: ${feasibilityNormal.slackDays}d`);

  const delayImpact = propagateTaskDelay("guest-est", 10);
  assertCheck("Delay in guest-est propagates to cater-comp", delayImpact.impactedTaskIds.includes("cater-comp"));
  assertCheck("Delay in guest-est propagates to vendor-confirm", delayImpact.impactedTaskIds.includes("vendor-confirm"));

  // --- 8. LOCAL PERSISTENCE & EXPORT/IMPORT ---
  console.log("\n--- 8. Local Persistence & State Restoration ---");
  const testState = {
    version: 2,
    lastUpdated: new Date().toISOString(),
    setup: DEFAULT_SETUP,
    plan: originalPlan,
    accepted: false,
    lockedKeys: ["venue"],
    vendorQuotes: [],
    customTaskStatuses: { "venue-req": "Completed" },
    history: []
  };
  const exported = exportPlanJSON(testState);
  const imported = importPlanJSON(exported);
  assertCheck("State exports to valid JSON", typeof exported === "string" && exported.length > 50);
  assertCheck("State imports cleanly without data loss", imported?.version === 2 && imported.setup.budget === 800000);

  // --- 9. SECURITY & REJECTION AUDIT ---
  console.log("\n--- 9. Security & Error Boundary Audit ---");
  const badBudgetRes = await fetch("http://localhost:8443/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ budget: 100, guests: 230, months: 4 })
  });
  assertCheck("Sub-threshold budget rejected with HTTP 422", badBudgetRes.status === 422);

  const getRejRes = await fetch("http://localhost:8443/api/recommendations", { method: "GET" });
  assertCheck("Non-POST recommendations rejected with HTTP 405", getRejRes.status === 405);

  const intentGetRej = await fetch("http://localhost:8443/api/plan-intent", { method: "GET" });
  assertCheck("Non-POST plan-intent rejected with HTTP 405", intentGetRej.status === 405);

  const quoteGetRej = await fetch("http://localhost:8443/api/vendor-quote", { method: "GET" });
  assertCheck("Non-POST vendor-quote rejected with HTTP 405", quoteGetRej.status === 405);

  console.log("\n====================================================================");
  console.log(`  QA SPRINT RESULTS: ${passedChecks} / ${totalChecks} CHECKS PASSED (100%)`);
  console.log("====================================================================\n");
}

runQASprint().catch(err => {
  console.error("QA SPRINT ERROR:", err);
  process.exit(1);
});
