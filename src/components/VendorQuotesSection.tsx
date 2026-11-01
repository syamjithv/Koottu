import { useState, useMemo } from "react"
import type { Plan, VendorQuote, CategoryKey } from "../data.ts"
import {
  SAMPLE_QUOTES,
  parseVendorQuote,
  compareQuoteToPlan,
  compareCategoryQuotes,
  generateVendorInquiryDraft,
  formatINR,
} from "../data.ts"
import { VendorInquiryModal } from "./VendorInquiryModal.tsx"
import { VendorComparisonMatrix } from "./VendorComparisonMatrix.tsx"

export function VendorQuotesSection({
  plan,
  quotes,
  acceptedQuotes = {},
  onAddQuote,
  onAcceptQuote,
}: {
  plan: Plan
  quotes: VendorQuote[]
  acceptedQuotes?: Record<string, string>
  onAddQuote: (quote: VendorQuote) => void
  onAcceptQuote?: (quote: VendorQuote) => void
}) {
  const [activeSampleIdx, setActiveSampleIdx] = useState<number>(0)
  const [rawText, setRawText] = useState(SAMPLE_QUOTES[0].rawText)
  const [categoryHint, setCategoryHint] = useState<CategoryKey>("food")
  const [analyzedQuote, setAnalyzedQuote] = useState<VendorQuote>(() =>
    parseVendorQuote(SAMPLE_QUOTES[0].rawText, "food"),
  )
  const [aiAdvice, setAiAdvice] = useState<{
    summary: string
    tips: string[]
  } | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [showComparisonMatrix, setShowComparisonMatrix] = useState(false)
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [copiedDraft, setCopiedDraft] = useState(false)

  const comparison = useMemo(
    () => compareQuoteToPlan(analyzedQuote, plan),
    [analyzedQuote, plan],
  )

  const catAllocated = useMemo(() => {
    return plan.categories.find((c) => c.key === categoryHint)?.amount || 300000
  }, [plan, categoryHint])

  const sampleQuotesObjects = useMemo<VendorQuote[]>(() => {
    return SAMPLE_QUOTES.map((sq, i) => ({
      id: `sample-q-${i}`,
      vendorName: sq.vendorName,
      category: sq.category,
      quotedAmount: sq.baseCost,
      gstRatePercent: sq.gstPercent,
      gstIncluded: sq.gstIncluded,
      advancePaymentPercent: sq.advancePercent,
      advanceAmount: Math.round((sq.baseCost * sq.advancePercent) / 100),
      cancellationPolicy: sq.cancellationPolicy,
      riskFlags: sq.riskFlags,
      includedServices: sq.includedServices,
      status: "reviewed",
    }))
  }, [])

  const matrix = useMemo(() => {
    return compareCategoryQuotes(sampleQuotesObjects, catAllocated)
  }, [sampleQuotesObjects, catAllocated])

  const inquiryDraft = useMemo(() => {
    return generateVendorInquiryDraft({
      vendorName: analyzedQuote.vendorName,
      category: analyzedQuote.category.toUpperCase(),
      occasion: "Celebration",
      date: `${plan.months}-month planning window`,
      location: "Kochi, Kerala",
      guestCount: plan.guests,
      budgetEstimate: catAllocated,
    })
  }, [analyzedQuote, plan, catAllocated])

  const handleSelectSample = (idx: number) => {
    setActiveSampleIdx(idx)
    const sample = SAMPLE_QUOTES[idx]
    setRawText(sample.rawText)
    setCategoryHint(sample.category)
    const parsed = parseVendorQuote(sample.rawText, sample.category)
    setAnalyzedQuote(parsed)
    setAiAdvice(null)
  }

  const handleAudit = async () => {
    setLoadingAi(true)
    try {
      const res = await fetch("/api/vendor-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          categoryHint,
          currentPlan: {
            budget: plan.budget,
            guests: plan.guests,
            months: plan.months,
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.parsedQuote) {
          setAnalyzedQuote(data.parsedQuote)
          onAddQuote(data.parsedQuote)
        }
        if (data.aiNegotiationAdvice) setAiAdvice(data.aiNegotiationAdvice)
      }
    } catch {
      // Deterministic fallback already active
    } finally {
      setLoadingAi(false)
    }
  }

  const handleCopyInquiry = () => {
    navigator.clipboard?.writeText(inquiryDraft)
    setCopiedDraft(true)
    window.setTimeout(() => setCopiedDraft(false), 2000)
  }

  const isAccepted = acceptedQuotes[analyzedQuote.category] === analyzedQuote.id

  return (
    <section className="workspace-section vendor-section" id="quotes">
      <div className="section-heading">
        <div>
          <span className="kicker">
            Vendor intelligence · Kerala market rates
          </span>
          <h2>Audit quotes against verified allocations.</h2>
        </div>
        <span className="prototype-label">
          Deterministic GST & contract risk extraction
        </span>
      </div>
      <div className="vendor-layout">
        <div>
          <small
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              color: "var(--muted)",
            }}
          >
            Load realistic Kerala celebration quote:
          </small>
          <div className="sample-quote-picker">
            {SAMPLE_QUOTES.map((sample, idx) => (
              <button
                key={sample.title}
                type="button"
                className={`sample-btn ${
                  activeSampleIdx === idx ? "is-active" : ""
                }`}
                onClick={() => handleSelectSample(idx)}
              >
                {sample.title}
              </button>
            ))}
          </div>
          <textarea
            className="quote-textarea"
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value)
              setAnalyzedQuote(parseVendorQuote(e.target.value, categoryHint))
            }}
            placeholder="Paste vendor contract or quotation text here..."
          />
          <div className="quote-actions-row">
            <span style={{ fontSize: 10, color: "var(--muted)" }}>
              Category: <b>{analyzedQuote.category.toUpperCase()}</b>
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="insight-action-btn"
                aria-expanded={showInquiryModal}
                aria-controls="vendor-inquiry-box"
                onClick={() => setShowInquiryModal(!showInquiryModal)}
              >
                💬 {showInquiryModal ? "Hide" : "Inquiry Draft"}
              </button>
              <button
                type="button"
                className="button primary green"
                style={{ padding: "9px 15px", fontSize: 11 }}
                disabled={loadingAi}
                onClick={handleAudit}
              >
                {loadingAi
                  ? "✦ Auditing contract..."
                  : "✦ Audit with Gemini 3.8 Flash"}
              </button>
            </div>
          </div>

          {showInquiryModal && (
            <VendorInquiryModal
              inquiryDraft={inquiryDraft}
              copiedDraft={copiedDraft}
              onCopyInquiry={handleCopyInquiry}
            />
          )}

          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className="scenario-apply-btn"
              aria-expanded={showComparisonMatrix}
              aria-controls="quote-comparison-matrix"
              style={{ width: "100%", padding: "7px 10px" }}
              onClick={() => setShowComparisonMatrix(!showComparisonMatrix)}
            >
              {showComparisonMatrix
                ? "▲ Hide Comparison"
                : "📊 Compare 3 Vendor Quotes in Category"}
            </button>
          </div>
        </div>

        <div className="quote-audit-card">
          <div className="quote-audit-header">
            <div>
              <span className="kicker">{analyzedQuote.category} quotation</span>
              <h3>{analyzedQuote.vendorName}</h3>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 6,
              }}
            >
              <span
                className={`variance-badge ${
                  comparison.isOverBudget ? "over-budget" : "under-budget"
                }`}
              >
                {comparison.isOverBudget
                  ? `+${formatINR(comparison.variance)} Over Budget`
                  : `${formatINR(Math.abs(comparison.variance))} Under Budget`}
              </span>
              {onAcceptQuote && (
                <button
                  type="button"
                  className="insight-action-btn"
                  style={{
                    background: isAccepted ? "var(--forest)" : "none",
                    color: isAccepted ? "#fff" : "var(--ink)",
                    borderColor: isAccepted ? "var(--forest)" : "var(--line)",
                  }}
                  onClick={() => onAcceptQuote(analyzedQuote)}
                >
                  {isAccepted
                    ? "✓ Contracted"
                    : `Accept Quote for ${analyzedQuote.category} →`}
                </button>
              )}
            </div>
          </div>

          <div className="quote-stats-grid">
            <div>
              <small>Quoted Base</small>
              <strong>{formatINR(analyzedQuote.quotedAmount)}</strong>
            </div>
            <div>
              <small>GST Status</small>
              <strong style={{ fontSize: 16 }}>
                {analyzedQuote.gstIncluded
                  ? "Included"
                  : `+${analyzedQuote.gstRatePercent}% Extra`}
              </strong>
            </div>
            <div>
              <small>Advance Token</small>
              <strong>{formatINR(analyzedQuote.advanceAmount)}</strong>
              <span style={{ fontSize: 9, color: "var(--muted)" }}>
                ({analyzedQuote.advancePaymentPercent}% upfront)
              </span>
            </div>
          </div>

          <div>
            <small
              style={{
                display: "block",
                fontSize: 9,
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 6,
              }}
            >
              Category Budget Comparison
            </small>
            <p
              style={{
                fontSize: 12,
                color: "var(--ink)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {comparison.recommendation}
            </p>
          </div>

          {analyzedQuote.riskFlags.length > 0 && (
            <div>
              <small
                style={{
                  display: "block",
                  fontSize: 9,
                  textTransform: "uppercase",
                  color: "var(--risk)",
                  marginBottom: 6,
                }}
              >
                ⚠ Contract Risk & Hidden Fee Alerts:
              </small>
              <div className="risk-tags-list">
                {analyzedQuote.riskFlags.map((risk, i) => (
                  <span key={i} className="risk-tag">
                    {risk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {aiAdvice && (
            <div className="ai-advice-panel">
              <b>✦ Gemini 3.8 Flash Negotiation Strategy:</b>
              <span>{aiAdvice.summary}</span>
              <ul>
                {aiAdvice.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {showComparisonMatrix && (
        <VendorComparisonMatrix
          categoryHint={categoryHint}
          catAllocated={catAllocated}
          matrix={matrix}
        />
      )}
      <div
        style={{
          marginTop: 12,
          fontSize: 10,
          color: "var(--muted)",
          fontStyle: "italic",
          textAlign: "center",
        }}
      >
        * Illustrative Kerala market rate quotations for student demonstration.
        In actual planning, always verify real-world contractor availability and
        GST compliance.
      </div>
    </section>
  )
}

