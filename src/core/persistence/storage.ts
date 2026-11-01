/**
 * KOOTTU — Local-First Persistence & State Recovery
 *
 * Implements resilient browser local storage with schema versioning,
 * automatic migration, import/export portability, and corruption recovery.
 */

import type {
  StoredAppState,
  Setup,
  Plan,
  VendorQuote,
  TaskStatus,
} from "../types.ts"
import { originalPlan, adaptPlan } from "../budget/budgetEngine.ts"

export const STORAGE_KEY = "koottu_plan_v3"
export const LEGACY_STORAGE_KEY = "koottu_plan_v2"
export const CURRENT_SCHEMA_VERSION = 3

export const DEFAULT_SETUP: Setup = {
  occasion: "Wedding",
  date: "",
  months: 4,
  guests: 200,
  location: "Kochi",
  budget: 800000,
  priorities: ["Food and catering", "Guest experience"],
  requirements: "Keep food quality high and retain essential arrangements.",
}

/**
 * Load persisted app state from localStorage with v2 -> v3 automatic migration
 */
export function loadStoredAppState(): StoredAppState | null {
  if (typeof window === "undefined" || !window.localStorage) return null

  try {
    let raw = window.localStorage.getItem(STORAGE_KEY)
    let migratedFromV2 = false

    // Check legacy v2 key if v3 is not found
    if (!raw) {
      raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
      if (raw) migratedFromV2 = true
    }

    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return null

    // Schema validation and recovery
    if (parsed.version !== CURRENT_SCHEMA_VERSION) {
      console.info(
        "[KOOTTU Storage]: Migrating stored state to schema version",
        CURRENT_SCHEMA_VERSION,
      )
      parsed.version = CURRENT_SCHEMA_VERSION
    }

    // Ensure valid Plan structure
    if (!parsed.plan || !Array.isArray(parsed.plan.categories)) {
      parsed.plan = adaptPlan(
        parsed.setup?.budget || DEFAULT_SETUP.budget,
        parsed.setup?.guests || DEFAULT_SETUP.guests,
        parsed.setup?.months || DEFAULT_SETUP.months,
      )
    }

    const migratedState: StoredAppState = {
      version: CURRENT_SCHEMA_VERSION,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      setup: parsed.setup || DEFAULT_SETUP,
      plan: parsed.plan,
      accepted: Boolean(parsed.accepted),
      lockedKeys: Array.isArray(parsed.lockedKeys) ? parsed.lockedKeys : [],
      vendorQuotes: Array.isArray(parsed.vendorQuotes) ? parsed.vendorQuotes : [],
      customTaskStatuses: parsed.customTaskStatuses || {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
      taskAssignees: parsed.taskAssignees || {},
      unifiedPlan: parsed.unifiedPlan,
    }

    // If migrated from v2, save immediately to v3 key
    if (migratedFromV2) {
      saveStoredAppState(migratedState)
    }

    return migratedState
  } catch (err) {
    console.warn(
      "[KOOTTU Storage]: Failed to parse local state, recovering defaults",
      err,
    )
    return null
  }
}

/**
 * Persist app state to localStorage
 */
export function saveStoredAppState(state: StoredAppState): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false

  try {
    const payload: StoredAppState = {
      ...state,
      version: CURRENT_SCHEMA_VERSION,
      lastUpdated: new Date().toISOString(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch (err) {
    console.error("[KOOTTU Storage]: Failed to save state to localStorage", err)
    return false
  }
}

/**
 * Reset state to default demonstration scenario
 */
export function clearStoredAppState(): void {
  if (typeof window === "undefined" || !window.localStorage) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage clear error
  }
}

/**
 * Export plan and quotes to JSON for evaluators / backup
 */
export function exportPlanJSON(state: StoredAppState): string {
  return JSON.stringify(state, null, 2)
}

/**
 * Import plan from JSON string
 */
export function importPlanJSON(jsonStr: string): StoredAppState | null {
  try {
    const parsed = JSON.parse(jsonStr)
    if (!parsed.setup || !parsed.plan) return null
    if (typeof window !== "undefined" && window.localStorage) {
      saveStoredAppState(parsed)
      return loadStoredAppState()
    }
    // Return parsed directly in non-browser/test environments
    return parsed as StoredAppState
  } catch {
    return null
  }
}

/**
 * Generate a clean, structured printable celebration summary for elders and coordinators
 */
export function generatePrintableCelebrationSummary(state: StoredAppState): string {
  const s = state.setup
  const p = state.plan
  const totalAllocated = p.categories.reduce((acc, c) => acc + c.amount, 0)
  const balance = s.budget - totalAllocated

  return `=====================================================================
KOOTTU — CELEBRATION MASTER PLAN SUMMARY
Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
=====================================================================

EVENT OVERVIEW
• Occasion: ${s.occasion}
• Location: ${s.location || "Kerala"}
• Planning Window: ${s.months} months${s.date ? ` (Event Date: ${s.date})` : ""}
• Expected Attendance: ${s.guests} guests
• Total Available Budget: ₹${s.budget.toLocaleString("en-IN")}
• Total Planned Allocations: ₹${totalAllocated.toLocaleString("en-IN")}
• Net Financial Balance: ${balance < 0 ? `Deficit of ₹${Math.abs(balance).toLocaleString("en-IN")} (Requires Trade-Off)` : `Cushion of ₹${balance.toLocaleString("en-IN")}`}

PROTECTED PRIORITIES & REQUIREMENTS
• Priorities: ${s.priorities.join(", ") || "Hospitality & Traditional Feast"}
• Host Notes: "${s.requirements || "Preserve authentic cultural standards."}"

FINANCIAL ALLOCATION BREAKDOWN
${p.categories
  .map(
    (c) =>
      `• ${c.name.padEnd(24, " ")}: ₹${c.amount.toLocaleString("en-IN")}${c.locked ? " [LOCKED]" : ""}${c.priority ? " [PROTECTED]" : ""}`,
  )
  .join("\n")}

VENDOR STATUS & COMMITMENTS
${
  state.vendorQuotes.length > 0
    ? state.vendorQuotes
        .map(
          (q) =>
            `• ${q.category.toUpperCase().padEnd(10, " ")} | ${q.vendorName} | Quoted: ₹${q.quotedAmount.toLocaleString("en-IN")} (${q.gstIncluded ? "GST Included" : `+${q.gstRatePercent}% GST`}) | Status: ${q.status.toUpperCase()}`,
        )
        .join("\n")
    : "• No external vendor quotations registered yet."
}

KEY TIMELINE MILESTONES
${Object.entries(state.customTaskStatuses)
  .map(([taskId, status]) => `• ${taskId}: ${status}`)
  .join("\n") || "• Timeline tasks in progress according to CPM Critical Path."}

=====================================================================
KOOTTU • Make room for what matters • Deterministic Event Intelligence
=====================================================================`
}

