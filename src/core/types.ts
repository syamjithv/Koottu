/**
 * KOOTTU — Core Domain Models & Types
 * Unified, strictly typed models for celebration planning, deterministic calculations,
 * timeline DAG scheduling, vendor quote analysis, and AI recommendations.
 */

export type CategoryKey = "venue" | "food" | "decor" | "photo" | "other"

export type Category = {
  key: CategoryKey | string
  name: string
  amount: number
  priority?: boolean
  locked?: boolean
  notes?: string
}

export type Plan = {
  budget: number
  guests: number
  months: number
  categories: Category[]
  lockedKeys?: string[]
}

export type Setup = {
  occasion: string
  date: string
  months: number
  guests: number
  location: string
  budget: number
  priorities: string[]
  requirements: string
}

export type Stage = "landing" | "setup" | "workspace"

// --- Timeline & Scheduling Domain ---

export type TaskStatus = "In progress" | "Needs review" | "Not started" | "Completed"

export type ScheduledTask = {
  id: string
  title: string
  category: CategoryKey | "general"
  due: string
  dueDaysBeforeEvent: number // Days relative to event date (0 = event day)
  durationDays: number
  status: TaskStatus
  dependsOn: string[] // Task IDs that must finish before this begins
  dependency?: string
  isCriticalPath?: boolean
  isUrgent?: boolean
  isFeasible?: boolean
}

export type TimelineFeasibility = {
  isFeasible: boolean
  totalDurationDays: number
  availableDays: number
  slackDays: number
  criticalPathTaskIds: string[]
  cycleDetected: boolean
  conflicts: string[]
  summary: string
}

// --- Trade-Off Scenarios ---

export type TradeOffScenario = {
  id: "guest-trim" | "category-rebalance" | "balanced" | "custom"
  title: string
  badge: string
  description: string
  proposedPlan: Plan
  deltaBudget: number
  deltaGuests: number
  savingsAmount: number
  remainingDeficit: number
  isFullyBalanced: boolean
  categoryDeltas: Record<string, number>
  tradeOffSummary: string
  timelineImpact: string
}

// --- Vendor Quotation Domain ---

export type VendorQuote = {
  id: string
  vendorName: string
  category: CategoryKey
  quotedAmount: number
  gstRatePercent: number // e.g. 18 for 18%
  gstIncluded: boolean
  advancePaymentPercent: number // e.g. 50%
  advanceAmount: number
  cancellationPolicy: string
  includedServices: string[]
  additionalChargesNotes?: string
  riskFlags: string[]
  quoteDate?: string
  validUntil?: string
  sourceText?: string
  status: "draft" | "reviewed" | "shortlisted" | "accepted" | "declined"
}

export type VendorQuoteComparison = {
  quote: VendorQuote
  categoryAllocated: number
  variance: number // quoted - allocated (positive = over budget, negative = savings)
  variancePercent: number
  isOverBudget: boolean
  impactOnTotalBalance: number
  recommendation: string
}

// --- Natural Language Plan Intent ---

export type PlanIntent = {
  recognized: boolean
  summary: string
  budgetDelta?: number
  guestDelta?: number
  monthsDelta?: number
  lockedCategories?: string[]
  unlockedCategories?: string[]
  priorityAdditions?: string[]
  confidence: number
}

// --- AI Recommendations ---

export type RecommendationData = {
  headline: string
  analysis: string
  protectedInsight: string
  tradeOffs: string
  decisions: string[]
  timelineNote: string
}

export type RecommendationResponse = {
  status: "success" | "fallback" | "error"
  isAiGenerated: boolean
  groundTruth: {
    budget: number
    guests: number
    months: number
    totalAllocated: number
    balance: number
    isDeficit: boolean
    categories: Category[]
    timelineTasks: ScheduledTask[]
    isCompressed: boolean
    feasibility?: TimelineFeasibility
    scenarios?: TradeOffScenario[]
  }
  recommendations: RecommendationData
  error?: string
  note?: string
}

// --- Audit History & Persistence ---

export type PlanRevision = {
  id: string
  timestamp: string
  label: string
  plan: Plan
  acceptedBy: string
}

export type StoredAppState = {
  version: number
  lastUpdated: string
  setup: Setup
  plan: Plan
  accepted: boolean
  lockedKeys: string[]
  vendorQuotes: VendorQuote[]
  customTaskStatuses: Record<string, TaskStatus>
  history: PlanRevision[]
}
