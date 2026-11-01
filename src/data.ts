/**
 * KOOTTU — Domain & Engine Facade
 *
 * Re-exports core budget, timeline, vendor, and persistence domain engines.
 * Ensures strict backward compatibility with existing tests and server handlers.
 */

export * from "./core/types.ts"
export * from "./core/budget/budgetEngine.ts"
export * from "./core/budget/tradeOffEngine.ts"
export * from "./core/timeline/timelineEngine.ts"
export * from "./core/vendor/vendorEngine.ts"
export * from "./core/vendor/sampleQuotes.ts"
export * from "./core/persistence/storage.ts"
export * from "./core/templates/occasionTemplates.ts"
export * from "./core/insights/insightEngine.ts"
export * from "./core/intelligence/readinessEngine.ts"
export * from "./core/budget/stressTestEngine.ts"
export * from "./core/vendor/vendorLifecycleEngine.ts"
export * from "./core/timeline/runSheetEngine.ts"
export * from "./core/plan/unifiedPlanEngine.ts"
export * from "./core/ideation/culturalIdeas.ts"
