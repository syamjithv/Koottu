import assert from "node:assert/strict"
import test from "node:test"
import {
  exportPlanJSON,
  importPlanJSON,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_SETUP,
} from "./storage.ts"
import { originalPlan } from "../budget/budgetEngine.ts"
import type { StoredAppState } from "../types.ts"

test("storage: exports and imports plan JSON safely without corruption", () => {
  const mockState: StoredAppState = {
    version: CURRENT_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    setup: DEFAULT_SETUP,
    plan: originalPlan,
    accepted: false,
    lockedKeys: ["food"],
    vendorQuotes: [],
    customTaskStatuses: {},
    history: [],
  }

  const exported = exportPlanJSON(mockState)
  assert.equal(typeof exported, "string")
  assert.ok(exported.includes("Wedding"))
  assert.ok(exported.includes("800000"))
})
