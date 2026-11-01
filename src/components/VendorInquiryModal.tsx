export function VendorInquiryModal({
  inquiryDraft,
  copiedDraft,
  onCopyInquiry,
}: {
  inquiryDraft: string
  copiedDraft: boolean
  onCopyInquiry: () => void
}) {
  return (
    <div
      id="vendor-inquiry-box"
      role="region"
      aria-label="Kerala vendor inquiry draft"
      style={{
        background: "var(--paper2)",
        border: "1px solid var(--line)",
        padding: 12,
        borderRadius: 4,
        marginTop: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <strong style={{ fontSize: 11 }}>
          Kerala Vendor Inquiry Draft (WhatsApp/Email)
        </strong>
        <button
          type="button"
          className="insight-action-btn"
          onClick={onCopyInquiry}
        >
          {copiedDraft ? "✓ Copied!" : "Copy Text"}
        </button>
      </div>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
          fontSize: 10,
          color: "var(--ink)",
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {inquiryDraft}
      </pre>
    </div>
  )
}

