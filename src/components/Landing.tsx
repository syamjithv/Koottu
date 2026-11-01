import React from "react"
import { Brand } from "./Brand.tsx"
import { useRevealOnScroll } from "./useRevealOnScroll.ts"

export function Landing({ onStart }: { onStart: () => void }) {
  useRevealOnScroll()
  return (
    <div className="landing">
      <header className="public-nav">
        <Brand />
        <button className="nav-cta" onClick={onStart}>
          Start planning <span>↗</span>
        </button>
      </header>
      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-copy">
            <span className="kicker">
              Celebrations, planned around real life
            </span>
            <h1>
              Make room for the moments <em>that matter.</em>
            </h1>
            <p>
              KOOTTU connects your budget, people, priorities, and timing into
              one practical celebration plan — then helps it adapt when life
              changes.
            </p>
            <div className="hero-ctas">
              <button className="button primary" onClick={onStart}>
                Plan my celebration <span>→</span>
              </button>
              <button
                className="button quiet"
                onClick={() =>
                  document
                    .querySelector("#how")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore how it works
              </button>
            </div>
          </div>
          <div
            className="plan-canvas"
            aria-label="Preview of a KOOTTU celebration plan"
          >
            <div className="canvas-top">
              <span>Wedding celebration</span>
              <b>04 months</b>
            </div>
            <div className="canvas-budget">
              <small>Working budget</small>
              <strong>₹8,00,000</strong>
              <div className="mini-segments">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="canvas-note note-one">
              <span>200</span> people
              <br />
              <small>guest estimate</small>
            </div>
            <div className="canvas-note note-two">
              <span>Priority 01</span> Food quality
            </div>
            <div className="canvas-path">
              <i />
              <i />
              <i />
              <i />
              <span>Venue</span>
              <span>Catering</span>
              <span>Celebrate</span>
            </div>
            <div className="canvas-stamp">Plan can adapt</div>
            <div className="gathering-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        </section>

        <section className="story reveal" id="how">
          <div className="story-intro">
            <span className="kicker">A plan with a point of view</span>
            <h2>
              Start with meaning.
              <br />
              Finish with a plan.
            </h2>
          </div>
          <div className="story-steps">
            {[
              [
                "01",
                "Start with what matters.",
                "Tell us who is gathering, what you value, and the limits we should respect.",
              ],
              [
                "02",
                "Get a plan that makes sense.",
                "See how budget, arrangements, timing, and tasks connect before you commit.",
              ],
              [
                "03",
                "Adapt without starting over.",
                "Change the guests, budget, or date. Keep the plan — and see every trade-off.",
              ],
            ].map(([number, title, copy], index) => (
              <article
                className="reveal"
                style={
                  { "--reveal-delay": `${index * 70}ms` } as React.CSSProperties
                }
                key={number}
              >
                <b>{number}</b>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="adapt-story reveal">
          <div>
            <span className="kicker">The KOOTTU difference</span>
            <h2>
              When the guest list grows,
              <br />
              <em>the plan responds.</em>
            </h2>
            <p>
              ₹8,00,000 and 200 guests becomes ₹6,40,000 and 230 guests. KOOTTU
              doesn’t hide the pressure: the current prototype exposes the
              ₹52,000 deficit and the decisions it creates.
            </p>
            <button className="button primary green" onClick={onStart}>
              Build my plan <span>→</span>
            </button>
          </div>
          <div className="before-after">
            <div>
              <small>Before</small>
              <strong>₹8L</strong>
              <span>200 guests</span>
            </div>
            <b>→</b>
            <div className="after">
              <small>After</small>
              <strong>₹6.4L</strong>
              <span>230 guests</span>
            </div>
            <p>
              <i /> Constraint made visible
              <br />
              <b>₹52,000 over budget</b>
            </p>
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <Brand light />
        <button onClick={onStart}>
          Plan something meaningful <span>→</span>
        </button>
      </footer>
    </div>
  )
}

