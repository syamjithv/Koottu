import assert from "node:assert/strict"
import test from "node:test"
import { parseIntentDeterministically } from "./intentHandler.ts"

test("intentHandler: parses budget reduction and category locks deterministically", () => {
  const result = parseIntentDeterministically(
    "Reduce budget by 50,000 and lock photography",
  )
  assert.equal(result.recognized, true)
  assert.equal(result.budgetDelta, -50000)
  assert.ok(result.lockedCategories?.includes("photo"))
})

test("intentHandler: parses guest count increase deterministically", () => {
  const result = parseIntentDeterministically(
    "We want to add 30 more guests for the wedding",
  )
  assert.equal(result.recognized, true)
  assert.equal(result.guestDelta, 30)
})

test("intentHandler: handles unrecognizable queries safely", () => {
  const result = parseIntentDeterministically("Hello what is the weather today")
  assert.equal(result.recognized, false)
  assert.equal(result.budgetDelta, 0)
  assert.equal(result.guestDelta, 0)
})
