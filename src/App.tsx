import { useEffect, useState } from "react"
import {
  adaptPlan,
  isOriginalPlan,
  originalPlan,
  type Plan,
  type VendorQuote,
  type TaskStatus,
  type Setup,
  loadStoredAppState,
  saveStoredAppState,
  DEFAULT_SETUP,
} from "./data.ts"
import { Landing, SetupFlow, Workspace } from "./components/index.ts"

type Stage = "landing" | "setup" | "workspace"

export default function App() {
  const [initialLoaded] = useState(() => loadStoredAppState())
  const [stage, setStage] = useState<Stage>(() =>
    initialLoaded ? "workspace" : "landing",
  )
  const [setup, setSetup] = useState<Setup>(
    () => initialLoaded?.setup || DEFAULT_SETUP,
  )
  const [plan, setPlan] = useState<Plan>(
    () => initialLoaded?.plan || originalPlan,
  )
  const [accepted, setAccepted] = useState<boolean>(() =>
    Boolean(initialLoaded?.accepted),
  )
  const [lockedKeys, setLockedKeys] = useState<string[]>(
    () => initialLoaded?.lockedKeys || [],
  )
  const [vendorQuotes, setVendorQuotes] = useState<VendorQuote[]>(
    () => initialLoaded?.vendorQuotes || [],
  )
  const [customTaskStatuses, setCustomTaskStatuses] =
    useState<Record<string, TaskStatus>>(
      () => initialLoaded?.customTaskStatuses || {},
    )
  const [taskAssignees, setTaskAssignees] = useState<Record<string, string>>(
    () => initialLoaded?.taskAssignees || {},
  )
  const [acceptedQuotes, setAcceptedQuotes] = useState<Record<string, string>>(
    () => initialLoaded?.acceptedQuotes || {},
  )
  const [contingencyPercent, setContingencyPercent] = useState<number>(() =>
    typeof initialLoaded?.contingencyPercent === "number"
      ? initialLoaded.contingencyPercent
      : 5,
  )

  // Auto-save to localStorage with versioning
  useEffect(() => {
    saveStoredAppState({
      version: 3,
      lastUpdated: new Date().toISOString(),
      setup,
      plan,
      accepted,
      lockedKeys,
      vendorQuotes,
      customTaskStatuses,
      taskAssignees,
      acceptedQuotes,
      contingencyPercent,
      history: [],
    })
  }, [
    setup,
    plan,
    accepted,
    lockedKeys,
    vendorQuotes,
    customTaskStatuses,
    taskAssignees,
    acceptedQuotes,
    contingencyPercent,
  ])

  const handleToggleLock = (key: string) => {
    setLockedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const handleAddQuote = (quote: VendorQuote) => {
    setVendorQuotes((prev) => [quote, ...prev.filter((q) => q.id !== quote.id)])
  }

  const handleAcceptQuote = (quote: VendorQuote) => {
    setAcceptedQuotes((prev) => ({
      ...prev,
      [quote.category]: quote.id,
    }))
  }

  const handleAssignTask = (taskId: string, assignee: string) => {
    setTaskAssignees((prev) => ({
      ...prev,
      [taskId]: assignee,
    }))
  }

  const handleToggleTaskStatus = (taskId: string) => {
    const cycle: Record<TaskStatus, TaskStatus> = {
      "Not started": "In progress",
      "In progress": "Needs review",
      "Needs review": "Completed",
      Completed: "Not started",
    }
    setCustomTaskStatuses((prev) => {
      const current = prev[taskId] || "Not started"
      return { ...prev, [taskId]: cycle[current] }
    })
  }

  const handleResetDemo = () => {
    // Reset to benchmark Kerala Wedding demo: ₹6,40,000, 230 guests, 4 months
    const demoSetup: Setup = {
      occasion: "Wedding",
      date: "4-month planning window",
      months: 4,
      guests: 230,
      location: "Kochi, Kerala",
      budget: 640000,
      priorities: ["Food and catering", "Photography"],
      requirements:
        "Traditional vegetarian sadya feast; protect catering quality.",
    }
    const demoPlan = adaptPlan(640000, 230, 4, ["food"])
    setSetup(demoSetup)
    setPlan(demoPlan)
    setAccepted(false)
    setLockedKeys(["food"])
    setCustomTaskStatuses({})
    setAcceptedQuotes({})
    setContingencyPercent(5)
    setStage("workspace")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (stage === "landing") return <Landing onStart={() => setStage("setup")} />
  if (stage === "setup")
    return (
      <SetupFlow
        value={setup}
        onChange={setSetup}
        onExit={() => setStage("landing")}
        onComplete={() => {
          setPlan(
            adaptPlan(setup.budget, setup.guests, setup.months, lockedKeys),
          )
          setAccepted(false)
          setStage("workspace")
          window.scrollTo(0, 0)
        }}
      />
    )
  return (
    <Workspace
      setup={setup}
      plan={plan}
      accepted={accepted}
      lockedKeys={lockedKeys}
      vendorQuotes={vendorQuotes}
      customTaskStatuses={customTaskStatuses}
      taskAssignees={taskAssignees}
      acceptedQuotes={acceptedQuotes}
      contingencyPercent={contingencyPercent}
      onToggleLock={handleToggleLock}
      onAddQuote={handleAddQuote}
      onAcceptQuote={handleAcceptQuote}
      onToggleStatus={handleToggleTaskStatus}
      onAssignTask={handleAssignTask}
      onUpdateContingency={setContingencyPercent}
      onResetDemo={handleResetDemo}
      onAdapt={() => undefined}
      onHome={() => setStage("landing")}
      onAccept={(next) => {
        setPlan(next)
        setAccepted(!isOriginalPlan(next))
      }}
    />
  )
}
