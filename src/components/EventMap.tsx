import { useState } from "react"

export function EventMap({ location }: { location: string }) {
  const [selectedPin, setSelectedPin] = useState<"area" | "note">("area")
  return (
    <section className="workspace-section map-section" id="map">
      <div className="section-heading">
        <div>
          <span className="kicker">Place planner</span>
          <h2>Give the plan a sense of place.</h2>
        </div>
        <span className="prototype-label">Illustrative map · no live data</span>
      </div>
      <div className="map-canvas">
        <div className="map-grid" aria-hidden="true" />
        {location ? (
          <>
            <div className="map-road road-one" />
            <div className="map-road road-two" />
            <button
              className={`map-pin pin-main ${
                selectedPin === "area" ? "selected" : ""
              }`}
              aria-pressed={selectedPin === "area"}
              onClick={() => setSelectedPin("area")}
            >
              <i />
              <span>Your preferred area</span>
              <strong>{location}</strong>
            </button>
            <button
              className={`map-pin pin-note ${
                selectedPin === "note" ? "selected" : ""
              }`}
              aria-pressed={selectedPin === "note"}
              onClick={() => setSelectedPin("note")}
            >
              <i />
              <span>Planning note</span>
              <strong>Venue area to verify</strong>
            </button>
            <div className="map-annotation" key={selectedPin}>
              <b>{selectedPin === "area" ? location : "Venue research area"}</b>
              <br />
              {selectedPin === "area"
                ? "Preferred area supplied during setup."
                : "Illustrative stop awaiting user research."}
              <br />
              <small>No venues or routes are verified.</small>
            </div>
          </>
        ) : (
          <div className="map-empty">
            <div className="location-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <span className="kicker">Location still open</span>
            <h3>Choose an area when you’re ready.</h3>
            <p>
              Your plan can begin without a place. Add a preferred area later to
              organise venue research and planning stops.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

