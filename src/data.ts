export type Category = {
  key: string
  name: string
  amount: number
  priority?: boolean
}

export type Plan = {
  budget: number
  guests: number
  months: number
  categories: Category[]
}

export const originalPlan: Plan = {
  budget: 800000,
  guests: 200,
  months: 4,
  categories: [
    { key: "venue", name: "Venue", amount: 180000 },
    { key: "food", name: "Food & catering", amount: 300000, priority: true },
    { key: "decor", name: "Decorations", amount: 90000 },
    { key: "photo", name: "Photography", amount: 110000 },
    { key: "other", name: "Other essentials", amount: 80000 },
  ],
}

export function getTimeline(months: number) {
  const compressed = months < 3
  return [
    {
      title: "Confirm venue requirements",
      due: compressed ? "Within 3 days" : "This week",
      status: "In progress",
    },
    {
      title: "Finalize guest estimate",
      due: compressed ? "Within 5 days" : "Within 10 days",
      status: "Needs review",
    },
    {
      title: "Compare catering options",
      due: compressed ? "Start now — complete in 1 week" : "In 2 weeks",
      status: "Not started",
      dependency: "After guest estimate",
    },
    {
      title: "Confirm essential vendors",
      due: compressed ? "Within 2 weeks" : "6 weeks before",
      status: "Not started",
      dependency: "After catering comparison",
    },
    {
      title: "Review final budget",
      due: "3 weeks before",
      status: "Not started",
      dependency: "After vendor confirmations",
    },
  ]
}

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)

export function adaptPlan(
  budget: number,
  guests: number,
  months: number,
): Plan {
  const foodPerGuest = 1500
  const food = guests * foodPerGuest
  const pressure =
    Math.max(0, 800000 - budget) + Math.max(0, guests - 200) * 1200
  const categories = [
    {
      key: "venue",
      name: "Venue",
      amount: pressure > 100000 ? 165000 : 180000,
    },
    { key: "food", name: "Food & catering", amount: food, priority: true },
    {
      key: "decor",
      name: "Decorations",
      amount: Math.max(28000, 90000 - pressure * 0.32),
    },
    {
      key: "photo",
      name: "Photography",
      amount: Math.max(80000, 110000 - pressure * 0.12),
    },
    {
      key: "other",
      name: "Other essentials",
      amount: Math.max(65000, 80000 - pressure * 0.06),
    },
  ].map((category) => ({
    ...category,
    amount: Math.round(category.amount / 1000) * 1000,
  }))

  return { budget, guests, months, categories }
}

export const sumPlan = (plan: Plan) =>
  plan.categories.reduce((sum, item) => sum + item.amount, 0)

export const isOriginalPlan = (plan: Plan) =>
  plan.budget === originalPlan.budget &&
  plan.guests === originalPlan.guests &&
  plan.months === originalPlan.months

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
    categories: Array<{
      key: string
      name: string
      amount: number
      priority?: boolean
    }>
    timelineTasks: Array<{
      title: string
      due: string
      status: string
      dependency?: string
    }>
    isCompressed: boolean
  }
  recommendations: RecommendationData
  error?: string
  note?: string
}
