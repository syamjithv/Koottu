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

export const STORAGE_KEY = "koottu_plan_v2"
export const CURRENT_SCHEMA_VERSION = 2

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
 * Load persisted app state from localStorage
 */
export function loadStoredAppState(): StoredAppState | null {
  if (typeof window === "undefined" || !window.localStorage) return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
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

    return {
      version: CURRENT_SCHEMA_VERSION,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      setup: parsed.setup || DEFAULT_SETUP,
      plan: parsed.plan,
      accepted: Boolean(parsed.accepted),
      lockedKeys: Array.isArray(parsed.lockedKeys) ? parsed.lockedKeys : [],
      vendorQuotes: Array.isArray(parsed.vendorQuotes)
        ? parsed.vendorQuotes
        : [],
      customTaskStatuses: parsed.customTaskStatuses || {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
    }
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
    saveStoredAppState(parsed)
    return loadStoredAppState()
  } catch {
    return null
  }
}
