import { useState } from "react"
import { Brand } from "./Brand.tsx"
import { occasions, priorityOptions } from "./constants.ts"
import type { Setup } from "../data.ts"
import { formatINR } from "../data.ts"

export function SetupFlow({
  value,
  onChange,
  onComplete,
  onExit,
}: {
  value: Setup
  onChange: (next: Setup) => void
  onComplete: () => void
  onExit: () => void
}) {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<"forward" | "back">("forward")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const update = <K extends keyof Setup>(key: K, next: Setup[K]) => {
    if (error) setError("")
    onChange({ ...value, [key]: next })
  }
  const valid =
    step === 1
      ? !!value.occasion
      : step === 2
        ? value.guests >= 20 && value.guests <= 500 && value.budget >= 300000
        : step === 3
          ? value.priorities.length > 0
          : true
  const next = () => {
    if (!valid) {
      setError(
        step === 1
          ? "Choose an occasion to continue."
          : step === 2
            ? "Enter 20–500 guests and a budget of at least ₹3,00,000."
            : "Choose at least one priority.",
      )
      return
    }
    setError("")
    setDirection("forward")
    setStep((current) => Math.min(4, current + 1))
  }
  const togglePriority = (priority: string) =>
    update(
      "priorities",
      value.priorities.includes(priority)
        ? value.priorities.filter((item) => item !== priority)
        : value.priorities.length < 3
          ? [...value.priorities, priority]
          : value.priorities,
    )

  const handleFinish = () => {
    if (submitting) return
    setSubmitting(true)
    onComplete()
  }

  return (
    <div className="setup-shell">
      <header className="setup-nav">
        <button
          className="brand-button"
          onClick={onExit}
          aria-label="Back to KOOTTU home"
        >
          <Brand />
        </button>
        <span>Celebration setup</span>
      </header>
      <div
        className="setup-progress"
        role="progressbar"
        aria-label="Setup progress"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuetext={`Step ${step} of 4`}
      >
        <span style={{ width: `${step * 25}%` }} />
      </div>
      <main className="setup-main">
        <div className="step-label">
          <span>0{step}</span> / 04
        </div>
        {step === 1 && (
          <section
            key={`step-${step}`}
            className={`setup-step step-${direction}`}
          >
            <span className="kicker">Let’s begin</span>
            <h1>
              What are we
              <br />
              <em>celebrating?</em>
            </h1>
            <p>
              Choose the occasion that best fits. You can make the plan your own
              in the next steps.
            </p>
            <div className="occasion-grid">
              {occasions.map((occasion, index) => (
                <button
                  key={occasion}
                  className={
                    value.occasion === occasion ? "choice selected" : "choice"
                  }
                  onClick={() => update("occasion", occasion)}
                >
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <span>{occasion}</span>
                  <b>{value.occasion === occasion ? "✓" : "↗"}</b>
                </button>
              ))}
            </div>
          </section>
        )}
        {step === 2 && (
          <section
            key={`step-${step}`}
            className={`setup-step step-${direction}`}
          >
            <span className="kicker">The practical details</span>
            <h1>
              Give the plan
              <br />
              <em>its shape.</em>
            </h1>
            <p>
              Estimates are welcome. KOOTTU is designed to adapt as details
              become clearer.
            </p>
            <div className="form-grid">
              <label>
                <span>
                  Event month <small>Optional</small>
                </span>
                <input
                  type="month"
                  value={value.date}
                  onChange={(e) => update("date", e.target.value)}
                />
              </label>
              <label>
                <span>Planning window</span>
                <select
                  value={value.months}
                  onChange={(e) => update("months", Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 8, 12].map((month) => (
                    <option value={month} key={month}>
                      {month} month{month > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Expected guests</span>
                <input
                  type="number"
                  min="20"
                  max="500"
                  value={value.guests}
                  onChange={(e) => update("guests", Number(e.target.value))}
                />
              </label>
              <label>
                <span>
                  Location or preferred area <small>Optional</small>
                </span>
                <input
                  placeholder="e.g. Kochi"
                  value={value.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </label>
              <label className="budget-input">
                <span>Total planning budget</span>
                <div>
                  <b>₹</b>
                  <input
                    type="number"
                    min="300000"
                    step="10000"
                    value={value.budget}
                    onChange={(e) => update("budget", Number(e.target.value))}
                  />
                </div>
                <small>{formatINR(value.budget)}</small>
              </label>
            </div>
          </section>
        )}
        {step === 3 && (
          <section
            key={`step-${step}`}
            className={`setup-step step-${direction}`}
          >
            <span className="kicker">Your priorities</span>
            <h1>
              What matters
              <br />
              <em>most?</em>
            </h1>
            <p>
              Choose up to three priorities. These stay visible when the plan
              needs to make a trade-off.
            </p>
            <div className="priority-grid">
              {priorityOptions.map((priority, index) => (
                <button
                  key={priority}
                  className={
                    value.priorities.includes(priority)
                      ? "priority-choice selected"
                      : "priority-choice"
                  }
                  onClick={() => togglePriority(priority)}
                >
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <span>{priority}</span>
                  <b>
                    {value.priorities.includes(priority)
                      ? "Selected"
                      : "Choose"}
                  </b>
                </button>
              ))}
            </div>
            <label className="requirements">
              <span>
                Anything we should never compromise on? <small>Optional</small>
              </span>
              <textarea
                rows={4}
                value={value.requirements}
                onChange={(e) => update("requirements", e.target.value)}
                placeholder="Share traditions, accessibility needs, family requirements, or anything else that matters."
              />
            </label>
          </section>
        )}
        {step === 4 && (
          <section
            key={`step-${step}`}
            className={`setup-step review-step step-${direction}`}
          >
            <span className="kicker">Ready to plan</span>
            <h1>
              One celebration.
              <br />
              <em>Your requirements.</em>
            </h1>
            <p>
              Review the starting point. This prototype uses transparent,
              deterministic planning rules — not a live AI or vendor search.
            </p>
            <div className="review-sheet">
              <div className="review-title">
                <span>{value.occasion}</span>
                <strong>
                  {value.date || `${value.months}-month planning window`}
                </strong>
              </div>
              <div className="review-facts">
                <div>
                  <small>Guests</small>
                  <b>{value.guests}</b>
                </div>
                <div>
                  <small>Budget</small>
                  <b>{formatINR(value.budget)}</b>
                </div>
                <div>
                  <small>Area</small>
                  <b>{value.location || "To be chosen"}</b>
                </div>
              </div>
              <div className="review-priorities">
                <small>Protected priorities</small>
                {value.priorities.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              {value.requirements && (
                <blockquote>“{value.requirements}”</blockquote>
              )}
              <button
                className="edit-link"
                onClick={() => {
                  setDirection("back")
                  setStep(1)
                }}
              >
                Edit my answers
              </button>
            </div>
          </section>
        )}
        {error && (
          <div className="setup-error" role="alert" aria-live="assertive">
            <span aria-hidden="true">⚠ </span>
            {error}
          </div>
        )}
        <footer className="setup-actions">
          <button
            className="button quiet"
            disabled={step === 1}
            onClick={() => {
              setError("")
              setDirection("back")
              setStep((current) => Math.max(1, current - 1))
            }}
          >
            ← Back
          </button>
          {step < 4 ? (
            <button className="button primary green" onClick={next}>
              Continue <span>→</span>
            </button>
          ) : (
            <button
              className="button primary green"
              disabled={submitting}
              onClick={handleFinish}
            >
              {submitting ? "Preparing plan..." : "Build my celebration plan →"}
            </button>
          )}
        </footer>
      </main>
    </div>
  )
}

