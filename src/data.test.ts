import assert from "node:assert/strict"

import test from "node:test"

import {
  adaptPlan,
  getTimeline,
  isOriginalPlan,
  originalPlan,
  sumPlan,
} from "./data.ts"

test("original plan categories reconcile with planned spending and balance", () => {
  assert.equal(sumPlan(originalPlan), 760000)

  assert.equal(originalPlan.budget - sumPlan(originalPlan), 40000)

  assert.equal(isOriginalPlan(originalPlan), true)
})

test("640k and 230 guests produces the documented constrained proposal", () => {
  const proposal = adaptPlan(640000, 230, 4)

  assert.equal(
    proposal.categories.find((item) => item.key === "food")?.amount,
    345000,
  )

  assert.equal(sumPlan(proposal), 692000)

  assert.equal(proposal.budget - sumPlan(proposal), -52000)
})

test("guest count consistently controls protected food allocation", () => {
  assert.equal(
    adaptPlan(800000, 20, 4).categories.find((item) => item.key === "food")
      ?.amount,
    30000,
  )

  assert.equal(
    adaptPlan(800000, 500, 4).categories.find((item) => item.key === "food")
      ?.amount,
    750000,
  )
})

test("reset scenario values are recognized only as the original plan", () => {
  assert.equal(isOriginalPlan(adaptPlan(800000, 200, 4)), true)

  assert.equal(isOriginalPlan(adaptPlan(800000, 200, 3)), false)
})

test("compressed timeline preserves and clarifies dependencies", () => {
  const normal = getTimeline(4)

  const compressed = getTimeline(2)

  assert.equal(normal[2].dependency, "After guest estimate")

  assert.equal(compressed[3].dependency, "After catering comparison")

  assert.match(compressed[2].due, /Start now/)

  assert.notEqual(compressed[0].due, normal[0].due)
})
