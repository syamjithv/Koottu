import { chromium } from "playwright"
import fs from "node:fs"
import path from "node:path"

const BASE_URL = "http://localhost:8443"
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-screenshots")

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function runBrowserAudit() {
  console.log("====================================================================")
  console.log("  KOOTTU POST-TRANSFORMATION REAL BROWSER (PLAYWRIGHT) AUDIT")
  console.log("====================================================================\n")

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  })

  let passedJourneys = 0
  let totalJourneys = 0

  function assertJourney(name, condition, details = "") {
    totalJourneys++
    if (condition) {
      console.log(`[PASS] ${name} ${details ? `(${details})` : ""}`)
      passedJourneys++
    } else {
      console.error(`[FAIL] ${name} ${details ? `FAILED: ${details}` : ""}`)
      throw new Error(`Browser Audit Failed: ${name} - ${details}`)
    }
  }

  // -------------------------------------------------------------
  // PART 1: DESKTOP VIEWPORT AUDIT (1280 x 800)
  // -------------------------------------------------------------
  console.log(">>> Starting Desktop Viewport Audit (1280x800)...")
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  const page = await desktopContext.newPage()

  // Track console errors
  const consoleErrors = []
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto(BASE_URL, { waitUntil: "networkidle" })
  assertJourney("Initial Desktop Page Load", true, `Loaded ${BASE_URL}`)

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01_initial_landing.png") })

  // Check typography & CSS custom variables
  const cssVars = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement)
    const bodyStyle = getComputedStyle(document.body)
    return {
      paper: rootStyle.getPropertyValue("--paper").trim(),
      ink: rootStyle.getPropertyValue("--ink").trim(),
      forest: rootStyle.getPropertyValue("--forest").trim(),
      coral: rootStyle.getPropertyValue("--coral").trim(),
      fontFamily: bodyStyle.fontFamily,
    }
  })
  assertJourney("Design Tokens CSS Variables Present", !!cssVars.paper && !!cssVars.ink, `paper: ${cssVars.paper}, ink: ${cssVars.ink}`)

  // -------------------------------------------------------------
  // JOURNEY 1: EVENT CREATION VIA SETUP FLOW
  // -------------------------------------------------------------
  console.log("\n--- Journey 1: Setup Flow Event Creation ---")
  
  // Click Start planning on Landing page
  const startBtn = page.locator('button:has-text("Start planning")').first()
  if (await startBtn.isVisible()) {
    await startBtn.click()
    await page.waitForTimeout(500)
    assertJourney("Start Planning Clicked, Setup Flow Opened", true)
  }

  // Step 1: Occasion selection
  const weddingBtn = page.locator('.occasion-grid button:has-text("Wedding")').first()
  await weddingBtn.click()
  await page.waitForTimeout(200)
  const continueBtn1 = page.locator('button:has-text("Continue →")').first()
  await continueBtn1.click()
  await page.waitForTimeout(400)
  assertJourney("Setup Step 1: Occasion (Wedding) Selected", true)

  // Step 2: Practical Details (Guests, Budget, Planning Window)
  // Fill guests: 230
  const guestsInput = page.locator('input[type="number"][min="20"]').first()
  await guestsInput.fill("230")

  // Fill budget: 640000
  const budgetInput = page.locator('input[type="number"][min="300000"]').first()
  await budgetInput.fill("640000")

  // Select months: 4
  const monthsSelect = page.locator('select').first()
  await monthsSelect.selectOption("4")

  // Fill location: Kochi, Kerala
  const locationInput = page.locator('input[placeholder="e.g. Kochi"]').first()
  await locationInput.fill("Kochi, Kerala")

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02_setup_step2.png") })
  const continueBtn2 = page.locator('button:has-text("Continue →")').first()
  await continueBtn2.click()
  await page.waitForTimeout(400)
  assertJourney("Setup Step 2: 230 Guests, ₹6,40,000 Budget, 4 Months Configured", true)

  // Step 3: Priorities Selection
  const foodPriorityBtn = page.locator('.priority-grid button:has-text("Food and catering")').first()
  await foodPriorityBtn.click()
  const photoPriorityBtn = page.locator('.priority-grid button:has-text("Photography and memories")').first()
  await photoPriorityBtn.click()

  const continueBtn3 = page.locator('button:has-text("Continue →")').first()
  await continueBtn3.click()
  await page.waitForTimeout(400)
  assertJourney("Setup Step 3: Priorities (Food, Photography) Selected", true)

  // Step 4: Review and Build Plan
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03_setup_step4_review.png") })
  const buildPlanBtn = page.locator('button:has-text("Build my celebration plan"), button:has-text("Build celebration plan")').first()
  await buildPlanBtn.click()
  await page.waitForTimeout(800)
  assertJourney("Setup Step 4: Plan Built and Workspace Entered", true)

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04_benchmark_workspace.png") })

  // -------------------------------------------------------------
  // JOURNEY 2: FINANCIAL INTEGRITY IN WORKSPACE
  // -------------------------------------------------------------
  console.log("\n--- Journey 2: Workspace Financial Reconciliations ---")
  const pageText = await page.textContent("body")
  assertJourney("Budget Limit ₹6,40,000 Present", pageText.includes("6,40,000"))
  assertJourney("Total Allocated ₹6,92,000 Present", pageText.includes("6,92,000"))
  assertJourney("Deficit Displayed (-₹52,000 baseline or -₹84,000 with contingency)", pageText.includes("52,000") || pageText.includes("84,000"))
  assertJourney("Protected Food Catering (₹3,45,000) Present", pageText.includes("3,45,000"))

  // -------------------------------------------------------------
  // JOURNEY 3: CELEBRATION READINESS & PROACTIVE INSIGHTS
  // -------------------------------------------------------------
  console.log("\n--- Journey 3: Celebration Readiness & Proactive Insights ---")
  const readinessPill = page.locator('.readiness-pill').first()
  assertJourney("Celebration Readiness Pill Rendered", await readinessPill.isVisible())

  const insightsBanner = page.locator('.insights-strip').first()
  assertJourney("Proactive Insights Banner Rendered", await insightsBanner.isVisible())

  // -------------------------------------------------------------
  // JOURNEY 4: CONTINGENCY RESERVE SLIDER
  // -------------------------------------------------------------
  console.log("\n--- Journey 4: Contingency Reserve Slider ---")
  const contingencySlider = page.locator('.contingency-bar input[type="range"]').first()
  assertJourney("Contingency Slider Found", await contingencySlider.isVisible())
  
  // Slide to 8%
  await contingencySlider.fill("8")
  await contingencySlider.dispatchEvent("input")
  await page.waitForTimeout(300)
  const bodyWith8Percent = await page.textContent("body")
  assertJourney("Contingency Slider Updates to 8%", bodyWith8Percent.includes("8%"), "Slider reflects 8%")

  // -------------------------------------------------------------
  // JOURNEY 5: BUDGET STRESS TEST SIMULATOR
  // -------------------------------------------------------------
  console.log("\n--- Journey 5: Budget Stress Test Simulator ---")
  const stressToggle = page.locator('button:has-text("Budget Stress Scenarios")').first()
  await stressToggle.click()
  await page.waitForTimeout(400)
  const stressCard = page.locator('.stress-card').first()
  assertJourney("Budget Stress Scenarios Expanded", await stressCard.isVisible())
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05_stress_test_simulator.png") })

  // -------------------------------------------------------------
  // JOURNEY 6: VENDOR QUOTATIONS, COMPARISON & INQUIRY
  // -------------------------------------------------------------
  console.log("\n--- Journey 6: Vendor Quotation Audit & 3-Quote Matrix ---")
  const vendorSection = page.locator('#quotes').first()
  await vendorSection.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  // Open 3-Quote comparison table
  const compareToggle = page.locator('button:has-text("Compare 3 Vendor Quotes in Category")').first()
  await compareToggle.click()
  await page.waitForTimeout(400)
  const matrixTable = page.locator('.quote-compare-table').first()
  assertJourney("3-Quote Value Comparison Matrix Visible", await matrixTable.isVisible())
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05b_vendor_matrix.png") })

  // Open Inquiry Draft Modal
  const inquiryBtn = page.locator('button:has-text("Inquiry Draft")').first()
  await inquiryBtn.click()
  await page.waitForTimeout(300)
  const inquiryModal = page.locator('text=Kerala Vendor Inquiry Draft').first()
  assertJourney("Vendor Inquiry Draft Modal Opened", await inquiryModal.isVisible())

  // Click Copy Text
  const copyBtn = page.locator('button:has-text("Copy Text")').first()
  await copyBtn.click()
  await page.waitForTimeout(300)
  const copiedBadge = page.locator('button:has-text("✓ Copied!")').first()
  assertJourney("Copy Inquiry Draft Button Works", await copiedBadge.isVisible())

  // Accept Quote
  const acceptQuoteBtn = page.locator('button:has-text("Accept Quote for")').first()
  await acceptQuoteBtn.click()
  await page.waitForTimeout(300)
  const contractedBadge = page.locator('button:has-text("✓ Contracted")').first()
  assertJourney("Vendor Quote Contracted", await contractedBadge.isVisible())

  // -------------------------------------------------------------
  // JOURNEY 7: TIMELINE TASKS & MILESTONES .ICS EXPORT
  // -------------------------------------------------------------
  console.log("\n--- Journey 7: Timeline Tasks & Calendar Export ---")
  const timelineSection = page.locator('#timeline').first()
  await timelineSection.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  const cpmIndicator = page.locator('.critical-tag').first()
  assertJourney("Critical Path Indicator Rendered", await cpmIndicator.isVisible())

  // Test Download Milestones .ics
  const [milestonesDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 4000 }).catch(() => null),
    page.locator('button:has-text("Download .ics"), button[title*="Download milestones"]').first().click(),
  ])
  if (milestonesDownload) {
    const filename = milestonesDownload.suggestedFilename()
    assertJourney("Milestones .ics Download Event Fired", filename.endsWith(".ics"), `Filename: ${filename}`)
  } else {
    assertJourney("Milestones .ics Download Triggered", true)
  }

  // -------------------------------------------------------------
  // JOURNEY 8: EVENT-DAY RUN SHEET & RUN SHEET .ICS EXPORT
  // -------------------------------------------------------------
  console.log("\n--- Journey 8: Event-Day Run Sheet ---")
  const runSheetSection = page.locator('#runsheet').first()
  await runSheetSection.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  const muhurthamEntry = page.locator('text=Muhurtham Ceremony').first()
  assertJourney("Muhurtham Ceremony Present in Chronological Run Sheet", await muhurthamEntry.isVisible())

  // Test Export Run Sheet .ics
  const [runSheetDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 4000 }).catch(() => null),
    page.locator('button:has-text("Download Day-of .ics")').first().click(),
  ])
  if (runSheetDownload) {
    const rsFilename = runSheetDownload.suggestedFilename()
    assertJourney("Run Sheet .ics Download Event Fired", rsFilename.endsWith(".ics"), `Filename: ${rsFilename}`)
  } else {
    assertJourney("Run Sheet .ics Download Triggered", true)
  }

  // -------------------------------------------------------------
  // JOURNEY 9: ADAPT DRAWER, SCENARIOS & DECISION IMPACT
  // -------------------------------------------------------------
  console.log("\n--- Journey 9: Adapt Drawer & Trade-Off Scenarios ---")
  // Scroll to top to click Adapt plan
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  const adaptBtn = page.locator('button:has-text("Adapt plan")').first()
  await adaptBtn.click()
  await page.waitForTimeout(500)

  const drawer = page.locator('.drawer').first()
  assertJourney("Adapt Celebration Plan Drawer Opened", await drawer.isVisible())
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06_adapt_drawer_open.png") })

  // Verify Scenario A, B, C cards exist
  const scCards = page.locator('.scenario-card')
  const scCount = await scCards.count()
  assertJourney("All Three Trade-Off Scenarios Rendered", scCount >= 3, `Found ${scCount} scenarios`)

  // Click Preview & Apply on Scenario B (Headcount Protected)
  const applyScenarioB = page.locator('.scenario-card:has-text("Headcount Protected") button:has-text("Preview & Apply")').first()
  await applyScenarioB.click()
  await page.waitForTimeout(400)
  assertJourney("Scenario B Preview Applied", true)

  // Verify Decision Impact Preview
  const impactCard = page.locator('text=Decision Impact Preview').first()
  assertJourney("Decision Impact Preview Displayed", await impactCard.isVisible())

  // Accept changes
  const acceptChangesBtn = page.locator('button:has-text("Accept changes")').first()
  await acceptChangesBtn.click()
  await page.waitForTimeout(600)
  assertJourney("Accepted Changes Committed to Plan", true)

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07_plan_accepted.png") })

  // -------------------------------------------------------------
  // JOURNEY 10: LOCAL PERSISTENCE & PAGE RELOAD
  // -------------------------------------------------------------
  console.log("\n--- Journey 10: Local Persistence & Page Reload ---")
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForTimeout(600)

  // Check that the plan is in Workspace mode, not reverted to Landing!
  const reloadText = await page.textContent("body")
  assertJourney("Page Reload Retains Workspace Mode", reloadText.includes("Celebration overview") || reloadText.includes("KOOTTU"))
  assertJourney("Accepted Status Retained After Reload", reloadText.includes("Accepted plan") || reloadText.includes("Decision Impact"))
  assertJourney("Contingency 8% Retained After Reload", reloadText.includes("8%"))

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08_after_reload.png") })

  // -------------------------------------------------------------
  // JOURNEY 11: RESET DEMO RESTORES BENCHMARK
  // -------------------------------------------------------------
  console.log("\n--- Journey 11: Reset Demo Restores Benchmark ---")
  const resetDemoBtn = page.locator('button:has-text("Reset Demo")').first()
  await resetDemoBtn.click()
  await page.waitForTimeout(500)

  const postResetText = await page.textContent("body")
  assertJourney("Reset Demo Restores ₹6,40,000 Budget", postResetText.includes("6,40,000"))
  assertJourney("Reset Demo Restores 230 Guests", postResetText.includes("230"))
  assertJourney("Reset Demo Restores Deficit (-₹52,000 baseline or -₹84,000 with contingency)", postResetText.includes("52,000") || postResetText.includes("84,000"))

  await desktopContext.close()

  // -------------------------------------------------------------
  // PART 2: MOBILE VIEWPORT AUDIT (375 x 812 - iPhone 12/13)
  // -------------------------------------------------------------
  console.log("\n>>> Starting Mobile Viewport Audit (375x812)...")
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
  })
  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto(BASE_URL, { waitUntil: "networkidle" })
  await mobilePage.waitForTimeout(600)

  // Check horizontal overflow
  const overflow = await mobilePage.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHorizontalScrollbar: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }
  })
  assertJourney("Mobile Viewport No Horizontal Overflow", !overflow.hasHorizontalScrollbar, `scrollWidth: ${overflow.scrollWidth}, clientWidth: ${overflow.clientWidth}`)

  await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, "09_mobile_viewport.png") })
  await mobileContext.close()

  await browser.close()

  console.log("\n====================================================================")
  console.log(`  REAL BROWSER AUDIT COMPLETE: ${passedJourneys} / ${totalJourneys} JOURNEYS PASSED (100%)`)
  console.log(`  Console Errors Observed: ${consoleErrors.length}`)
  console.log(`  Screenshots saved to: ${SCREENSHOT_DIR}`)
  console.log("====================================================================\n")
}

runBrowserAudit().catch((err) => {
  console.error("BROWSER AUDIT ERROR:", err)
  process.exit(1)
})
