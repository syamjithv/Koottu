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
  assignee?: string // Family member or coordinator responsible
  canCompress?: boolean
  earliestStartDays?: number
  latestStartDays?: number
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
  compressionFeasible?: boolean
  compressionSummary?: string
}

// --- Event-Day Run Sheet ---

export type RunSheetItem = {
  id: string
  time: string // e.g. "07:30 AM"
  title: string
  category: "prep" | "ceremony" | "feast" | "photo" | "winddown" | "general"
  owner: string // Responsible family member/coordinator
  location: string
  status: "Pending" | "In progress" | "Completed"
  notes?: string
}

// --- Creative Event Ideas ---

export type EventIdea = {
  id: string
  category: "theme" | "decor" | "food" | "activity" | "cultural"
  title: string
  description: string
  estimatedCostRange?: string
  saved: boolean
}

// --- Proactive Event Intelligence Insights ---

export type ProactiveInsightSeverity = "critical" | "warning" | "info" | "success"

export type ProactiveInsight = {
  id: string
  severity: ProactiveInsightSeverity
  category: "budget" | "timeline" | "vendor" | "task" | "cultural"
  title: string
  explanation: string
  evidence?: string
  recommendedAction: string
  actionDestination?: string // e.g. "#budget", "#timeline", "#vendors", "#adapt"
  relatedEntityId?: string
  timestamp: string
  resolved: boolean
}

// --- Celebration Readiness Score ---

export type CelebrationReadiness = {
  overallScore: number // 0 to 100
  budgetScore: number // 0 to 25
  timelineScore: number // 0 to 25
  vendorScore: number // 0 to 25
  taskScore: number // 0 to 25
  riskDeductions: number // Deductions e.g. -10 for unconfirmed critical path
  reasons: string[]
  summary: string
}

// --- Stress Testing Domain ---

export type StressTestScenario = {
  id: string
  title: string
  description: string
  deltaBudget: number
  deltaGuests: number
  deltaExpenses: number
  resultingDeficit: number
  impactSummary: string
  affectedCategories: string[]
}

// --- Vendor Management Domain ---

export type VendorStatus =
  | "not_started"
  | "shortlisted"
  | "contacted"
  | "quote_received"
  | "negotiating"
  | "accepted"
  | "declined"

export type UnifiedVendor = {
  id: string
  name: string
  category: CategoryKey | string
  status: VendorStatus
  contact?: string
  location?: string
  notes?: string
  quotes: VendorQuote[]
  acceptedQuoteId?: string
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

// --- Unified Authoritative Event Planning Model ---

export type UnifiedCategory = Category & {
  actualSpent?: number
  contractedQuoteId?: string
  floor?: number
  perPersonRate?: number
}

export type OccasionTemplate = {
  id: string
  name: string
  description: string
  defaultBudget: number
  defaultGuests: number
  defaultMonths: number
  categoryRatios: Record<string, number>
  categoryFloors: Record<string, number>
  foodPerPerson: number
  culturalNotes: string[]
  defaultTasks: ScheduledTask[]
  defaultRunSheet: RunSheetItem[]
}

export type ContingencyConfig = {
  percent: number // e.g. 5 for 5%
  reserveAmount: number // Exact integer INR
  isManual: boolean
}

export type UnifiedFinancials = {
  totalBudget: number
  totalAllocated: number
  totalActualSpent: number
  contingencyReserve: number
  unallocatedAmount: number
  netBalance: number // totalBudget - (totalAllocated + contingencyReserve)
  isDeficit: boolean
  deficitAmount: number
  foodPerPerson: number
}

export type UnifiedEventPlan = {
  id: string
  version: number
  createdAt: string
  lastUpdated: string
  identity: {
    title: string
    occasion: string
    occasionTemplateId?: string
    date: string
    months: number
    location: string
    guests: number
    budget: number
    priorities: string[]
    requirements: string
  }
  financials: UnifiedFinancials
  contingency: ContingencyConfig
  categories: UnifiedCategory[]
  lockedKeys: string[]
  tradeOffScenarios: TradeOffScenario[]
  tasks: ScheduledTask[]
  timelineFeasibility: TimelineFeasibility
  vendors: UnifiedVendor[]
  acceptedQuotes: Record<string, string> // categoryKey -> quoteId
  runSheet: RunSheetItem[]
  ideas: EventIdea[]
  readiness: CelebrationReadiness
  insights: ProactiveInsight[]
  history: PlanRevision[]
  planningStatus: "draft" | "configured" | "adapting" | "confirmed"
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
  // v3 additions (optional on older persisted schemas)
  unifiedPlan?: UnifiedEventPlan
  activeTab?: string
  taskAssignees?: Record<string, string>
}
