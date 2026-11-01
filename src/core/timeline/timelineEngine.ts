/**
 * KOOTTU — Deterministic Timeline & DAG Scheduling Engine
 *
 * Implements a true Directed Acyclic Graph (DAG) for celebration planning tasks.
 * Performs topological sorting, cycle detection, Critical Path Method (CPM) analysis,
 * delay propagation, and deterministic timeline feasibility verification.
 */

import type {
  ScheduledTask,
  TimelineFeasibility,
  TaskStatus,
} from "../types.ts"

export const KERALA_CELEBRATION_TASKS: ScheduledTask[] = [
  {
    id: "venue-req",
    title: "Confirm venue requirements & capacity",
    category: "venue",
    due: "This week",
    dueDaysBeforeEvent: 105,
    durationDays: 7,
    status: "In progress",
    dependsOn: [],
  },
  {
    id: "guest-est",
    title: "Finalize guest estimate & family invites",
    category: "general",
    due: "Within 10 days",
    dueDaysBeforeEvent: 95,
    durationDays: 10,
    status: "Needs review",
    dependsOn: [],
  },
  {
    id: "cater-comp",
    title: "Compare catering options (Sadya / Feast)",
    category: "food",
    due: "In 2 weeks",
    dueDaysBeforeEvent: 80,
    durationDays: 14,
    status: "Not started",
    dependsOn: ["guest-est"],
    dependency: "After guest estimate",
  },
  {
    id: "vendor-confirm",
    title: "Confirm essential vendors (Photo & Decor)",
    category: "photo",
    due: "6 weeks before",
    dueDaysBeforeEvent: 42,
    durationDays: 21,
    status: "Not started",
    dependsOn: ["cater-comp", "venue-req"],
    dependency: "After catering comparison",
  },
  {
    id: "budget-review",
    title: "Review final budget & vendor advances",
    category: "other",
    due: "3 weeks before",
    dueDaysBeforeEvent: 21,
    durationDays: 7,
    status: "Not started",
    dependsOn: ["vendor-confirm"],
    dependency: "After vendor confirmations",
  },
  {
    id: "day-coord",
    title: "Day-of coordination & traditional protocol walkthrough",
    category: "general",
    due: "1 week before",
    dueDaysBeforeEvent: 7,
    durationDays: 5,
    status: "Not started",
    dependsOn: ["budget-review"],
    dependency: "After final budget review",
  },
]

/**
 * Detect cycles in the task dependency graph using DFS 3-color algorithm
 */
export function detectCycles(
  tasks: ScheduledTask[],
): {
  hasCycle: boolean
  cyclePath: string[]
} {
  const taskMap = new Map<string, ScheduledTask>()
  tasks.forEach((t) => taskMap.set(t.id, t))

  const visited = new Map<string, "white" | "gray" | "black">()
  tasks.forEach((t) => visited.set(t.id, "white"))

  const path: string[] = []

  function dfs(taskId: string): boolean {
    visited.set(taskId, "gray")
    path.push(taskId)

    const task = taskMap.get(taskId)
    if (task) {
      for (const depId of task.dependsOn) {
        if (!taskMap.has(depId)) continue
        const state = visited.get(depId)
        if (state === "gray") {
          path.push(depId)
          return true // Cycle detected!
        }
        if (state === "white") {
          if (dfs(depId)) return true
        }
      }
    }

    path.pop()
    visited.set(taskId, "black")
    return false
  }

  for (const task of tasks) {
    if (visited.get(task.id) === "white") {
      if (dfs(task.id)) {
        return { hasCycle: true, cyclePath: path }
      }
    }
  }

  return { hasCycle: false, cyclePath: [] }
}

/**
 * Topologically sort tasks based on prerequisites
 */
export function topologicalSort(tasks: ScheduledTask[]): ScheduledTask[] {
  const taskMap = new Map<string, ScheduledTask>()
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()

  tasks.forEach((t) => {
    taskMap.set(t.id, t)
    inDegree.set(t.id, 0)
    adj.set(t.id, [])
  })

  tasks.forEach((t) => {
    t.dependsOn.forEach((depId) => {
      if (adj.has(depId)) {
        adj.get(depId)!.push(t.id)
        inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1)
      }
    })
  })

  const queue: string[] = []
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id)
  })

  const sorted: ScheduledTask[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    const task = taskMap.get(id)!
    sorted.push(task)

    adj.get(id)?.forEach((nextId) => {
      const newDeg = (inDegree.get(nextId) || 1) - 1
      inDegree.set(nextId, newDeg)
      if (newDeg === 0) queue.push(nextId)
    })
  }

  return sorted.length === tasks.length ? sorted : tasks
}

/**
 * Calculate Critical Path Method (CPM) metrics and schedule feasibility
 */
export function analyzeScheduleFeasibility(
  months: number,
  tasks: ScheduledTask[] = KERALA_CELEBRATION_TASKS,
): TimelineFeasibility {
  const availableDays = months * 30
  const { hasCycle } = detectCycles(tasks)

  if (hasCycle) {
    return {
      isFeasible: false,
      totalDurationDays: Infinity,
      availableDays,
      slackDays: -Infinity,
      criticalPathTaskIds: [],
      cycleDetected: true,
      conflicts: ["Circular dependency detected in tasks graph."],
      summary: "Invalid schedule: circular dependencies present.",
    }
  }

  // Calculate earliest finish times across DAG
  const earliestFinish = new Map<string, number>()
  const taskMap = new Map<string, ScheduledTask>()
  tasks.forEach((t) => taskMap.set(t.id, t))

  const sorted = topologicalSort(tasks)

  // Compressed durations if months < 3
  const isCompressed = months < 3
  const effectiveDurations = new Map<string, number>()
  tasks.forEach((t) => {
    const dur = isCompressed
      ? Math.max(3, Math.ceil(t.durationDays * 0.55))
      : t.durationDays
    effectiveDurations.set(t.id, dur)
  })

  sorted.forEach((task) => {
    let maxDepFinish = 0
    task.dependsOn.forEach((depId) => {
      maxDepFinish = Math.max(maxDepFinish, earliestFinish.get(depId) || 0)
    })
    earliestFinish.set(
      task.id,
      maxDepFinish + (effectiveDurations.get(task.id) || 7),
    )
  })

  let totalDurationDays = 0
  earliestFinish.forEach((finish) => {
    totalDurationDays = Math.max(totalDurationDays, finish)
  })

  // Identify Critical Path tasks (tasks on longest chain)
  const criticalPathTaskIds: string[] = []
  let currentMax = totalDurationDays
  const reversed = [...sorted].reverse()

  for (const task of reversed) {
    const taskFinish = earliestFinish.get(task.id) || 0
    if (taskFinish === currentMax) {
      criticalPathTaskIds.unshift(task.id)
      let maxPrev = 0
      task.dependsOn.forEach((depId) => {
        maxPrev = Math.max(maxPrev, earliestFinish.get(depId) || 0)
      })
      currentMax = maxPrev
    }
  }

  const slackDays = availableDays - totalDurationDays
  const isFeasible = slackDays >= 0

  const conflicts: string[] = []
  if (!isFeasible) {
    conflicts.push(
      `Total sequential path (${totalDurationDays} days) exceeds available ${months}-month window (${availableDays} days) by ${Math.abs(
        slackDays,
      )} days.`,
    )
  }

  const summary = isFeasible
    ? `Schedule is feasible with ${slackDays} days of buffer across the ${totalDurationDays}-day critical path.`
    : `Schedule compression alert: Sequential tasks require ${totalDurationDays} days but only ${availableDays} days available.`

  return {
    isFeasible,
    totalDurationDays,
    availableDays,
    slackDays,
    criticalPathTaskIds,
    cycleDetected: false,
    conflicts,
    summary,
  }
}

/**
 * Propagate delay: when a task is delayed by X days, recalculate projected downstream impacts
 */
export function propagateTaskDelay(
  delayedTaskId: string,
  delayDays: number,
  tasks: ScheduledTask[] = KERALA_CELEBRATION_TASKS,
): {
  impactedTaskIds: string[]
  totalFinalDelay: number
} {
  if (delayDays <= 0) return { impactedTaskIds: [], totalFinalDelay: 0 }

  const adj = new Map<string, string[]>()
  tasks.forEach((t) => adj.set(t.id, []))
  tasks.forEach((t) => {
    t.dependsOn.forEach((depId) => {
      adj.get(depId)?.push(t.id)
    })
  })

  const impacted = new Set<string>()
  const queue = [delayedTaskId]

  while (queue.length > 0) {
    const current = queue.shift()!
    const downstream = adj.get(current) || []
    downstream.forEach((nxt) => {
      if (!impacted.has(nxt)) {
        impacted.add(nxt)
        queue.push(nxt)
      }
    })
  }

  return {
    impactedTaskIds: Array.from(impacted),
    totalFinalDelay: delayDays,
  }
}

/**
 * Formats timeline tasks for UI consumption with compression & critical path flags
 */
export function getTimeline(
  months: number,
  customStatuses: Record<string, TaskStatus> = {},
): ScheduledTask[] {
  const compressed = months < 3
  const feasibility = analyzeScheduleFeasibility(months)

  return KERALA_CELEBRATION_TASKS.map((task) => {
    const isCritical = feasibility.criticalPathTaskIds.includes(task.id)
    const status = customStatuses[task.id] || task.status

    let dueLabel = task.due
    if (compressed) {
      if (task.id === "venue-req") dueLabel = "Within 3 days"
      else if (task.id === "guest-est") dueLabel = "Within 5 days"
      else if (task.id === "cater-comp")
        dueLabel = "Start now — complete in 1 week"
      else if (task.id === "vendor-confirm") dueLabel = "Within 2 weeks"
      else if (task.id === "budget-review") dueLabel = "3 weeks before"
      else if (task.id === "day-coord") dueLabel = "3 days before"
    }

    return {
      ...task,
      due: dueLabel,
      status,
      isCriticalPath: isCritical,
      isUrgent: compressed && isCritical,
      isFeasible: feasibility.isFeasible,
    }
  })
}
