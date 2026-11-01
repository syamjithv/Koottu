import { chromium } from "playwright"
import fs from "node:fs"

async function runAxeAudit() {
  console.log("=================================================");
  console.log("  KOOTTU INDEPENDENT AXE-CORE ACCESSIBILITY AUDIT");
  console.log("=================================================\n");

  console.log("Fetching latest official axe-core (v4.10.2)...");
  const axeRes = await fetch("https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js");
  if (!axeRes.ok) {
    throw new Error("Failed to fetch axe-core: " + axeRes.status);
  }
  const axeSource = await axeRes.text();
  console.log(`Fetched axe-core (${(axeSource.length / 1024).toFixed(1)} KB)\n`);

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const auditResults = [];

  async function auditCurrentView(viewName) {
    console.log(`>>> Auditing view: ${viewName}...`);
    await page.evaluate(axeSource);
    const axeResults = await page.evaluate(async () => {
      // @ts-ignore
      return await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]
        }
      });
    });

    const violations = axeResults.violations;
    console.log(`  Violations found: ${violations.length}`);
    if (violations.length > 0) {
      violations.forEach((v, i) => {
        console.log(`    [${i+1}] ${v.impact?.toUpperCase()}: ${v.id} - ${v.description}`);
        console.log(`        Help: ${v.helpUrl}`);
        console.log(`        Affected nodes: ${v.nodes.length}`);
        v.nodes.slice(0, 3).forEach((n, idx) => {
          console.log(`          Node ${idx+1}: ${n.html}`);
          console.log(`          Failure: ${n.failureSummary}`);
        });
      });
    }
    auditResults.push({
      view: viewName,
      passes: axeResults.passes.length,
      violations: violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map(n => ({ html: n.html, failureSummary: n.failureSummary }))
      }))
    });
    console.log(`  Passes: ${axeResults.passes.length}\n`);
  }

  // 1. Landing Screen
  await page.goto("http://localhost:8443", { waitUntil: "networkidle" });
  await auditCurrentView("1. Landing Screen");

  // 2. Setup Flow - Step 1
  await page.click("text=Plan my celebration");
  await page.waitForTimeout(300);
  await auditCurrentView("2. Setup Flow - Step 1 (Occasion)");

  // Setup Step 2
  await page.click("button:has-text('Wedding')");
  await page.click("text=Continue");
  await page.waitForTimeout(300);
  await auditCurrentView("3. Setup Flow - Step 2 (Guests & Budget)");

  // Setup Step 3
  await page.click("text=Continue");
  await page.waitForTimeout(300);
  await auditCurrentView("4. Setup Flow - Step 3 (Priorities)");

  // Setup Step 4
  await page.click("text=Food and catering");
  await page.click("text=Continue");
  await page.waitForTimeout(300);
  await auditCurrentView("5. Setup Flow - Step 4 (Review)");

  // 3. Workspace
  await page.click("text=Build my celebration plan");
  await page.waitForTimeout(600);
  await auditCurrentView("6. Workspace (Main View)");

  // 4. Adapt Drawer
  await page.click("text=Adapt plan");
  await page.waitForTimeout(400);
  await auditCurrentView("7. Adapt Plan Drawer");

  await browser.close();

  fs.writeFileSync("scripts/axe-audit-results.json", JSON.stringify(auditResults, null, 2));

  console.log("=================================================");
  console.log("  AXE-CORE AUDIT COMPLETE");
  console.log("=================================================");
}

runAxeAudit().catch(err => {
  console.error("Axe audit error:", err);
  process.exit(1);
});

