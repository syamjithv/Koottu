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
