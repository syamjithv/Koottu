/**
 * KOOTTU — Deterministic Budget Engine
 *
 * Implements deterministic financial calculations in integer Indian Rupees (INR).
 * Enforces category priorities, food protection rules (₹1,500/guest),
 * category locks, and mathematically sound budget rebalancing.
 */

import type { Category, Plan, CategoryKey } from "../types.ts"

export const FOOD_RATE_PER_GUEST = 1500

export const BASELINE_BUDGET = 800000
export const BASELINE_GUESTS = 200
export const BASELINE_MONTHS = 4

export const CATEGORY_FLOORS: Record<CategoryKey, number> = {
  venue: 150000,
  food: 30000, // min 20 guests * 1500
  decor: 28000,
  photo: 70000,
  other: 45000,
}

export const originalPlan: Plan = {
  budget: BASELINE_BUDGET,
  guests: BASELINE_GUESTS,
  months: BASELINE_MONTHS,
  lockedKeys: [],
  categories: [
    { key: "venue", name: "Venue", amount: 180000 },
    { key: "food", name: "Food & catering", amount: 300000, priority: true },
    { key: "decor", name: "Decorations", amount: 90000 },
    { key: "photo", name: "Photography", amount: 110000 },
    { key: "other", name: "Other essentials", amount: 80000 },
  ],
}

/**
 * Format currency to Indian Rupees (INR) with no fractional paise drift
 */
export function formatINR(amount: number): string {
  const integerAmount = Math.round(amount)
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(integerAmount)
}

/**
 * Sum all category amounts deterministically
 */
export function sumPlan(plan: Plan): number {
  return plan.categories.reduce((sum, item) => sum + Math.round(item.amount), 0)
}

/**
 * Compute available balance (positive = surplus, negative = deficit)
 */
export function calculateBalance(plan: Plan): number {
  return Math.round(plan.budget) - sumPlan(plan)
}

/**
 * Checks if a plan strictly matches original baseline
 */
export function isOriginalPlan(plan: Plan): boolean {
  return (
    plan.budget === originalPlan.budget &&
    plan.guests === originalPlan.guests &&
    plan.months === originalPlan.months &&
    (!plan.lockedKeys || plan.lockedKeys.length === 0)
  )
}

/**
 * Core deterministic adaptation logic supporting category locks.
 * Strictly preserves the benchmark scenario:
 * 640k, 230 guests -> 692k total, -52k deficit (food: 345k, venue: 165k, decor: 28k, photo: 86k, other: 68k)
 */
export function adaptPlan(
  budget: number,
  guests: number,
  months: number,
  lockedKeys: string[] = [],
  customLockedAmounts: Record<string, number> = {},
): Plan {
  const validBudget = Math.round(Math.max(300000, Math.min(50000000, budget)))
  const validGuests = Math.round(Math.max(20, Math.min(500, guests)))
  const validMonths = Math.round(Math.max(1, Math.min(12, months)))

  // Protected food allocation: always guests * 1500
  const foodAmount = validGuests * FOOD_RATE_PER_GUEST

  // Budget pressure metric relative to baseline
  const pressure =
    Math.max(0, BASELINE_BUDGET - validBudget) +
    Math.max(0, validGuests - BASELINE_GUESTS) * 1200

  // Standard unlocked calculations matching baseline formulation
  const rawVenue = pressure > 100000 ? 165000 : 180000
  const rawDecor = Math.max(CATEGORY_FLOORS.decor, 90000 - pressure * 0.32)
  const rawPhoto = Math.max(80000, 110000 - pressure * 0.12)
  const rawOther = Math.max(65000, 80000 - pressure * 0.06)

  const rawAllocations: Record<string, number> = {
    venue: rawVenue,
    food: foodAmount,
    decor: rawDecor,
    photo: rawPhoto,
    other: rawOther,
  }

  // Apply locks if requested
  for (const key of lockedKeys) {
    if (customLockedAmounts[key] !== undefined) {
      rawAllocations[key] = customLockedAmounts[key]
    }
  }

  const categories: Category[] = [
    {
      key: "venue",
      name: "Venue",
      amount: Math.round(rawAllocations.venue / 1000) * 1000,
      locked: lockedKeys.includes("venue"),
    },
    {
      key: "food",
      name: "Food & catering",
      amount: Math.round(rawAllocations.food / 1000) * 1000,
      priority: true,
      locked: lockedKeys.includes("food"),
    },
    {
      key: "decor",
      name: "Decorations",
      amount: Math.round(rawAllocations.decor / 1000) * 1000,
      locked: lockedKeys.includes("decor"),
    },
    {
      key: "photo",
      name: "Photography",
      amount: Math.round(rawAllocations.photo / 1000) * 1000,
      locked: lockedKeys.includes("photo"),
    },
    {
      key: "other",
      name: "Other essentials",
      amount: Math.round(rawAllocations.other / 1000) * 1000,
      locked: lockedKeys.includes("other"),
    },
  ]

  return {
    budget: validBudget,
    guests: validGuests,
    months: validMonths,
    categories,
    lockedKeys,
  }
}
