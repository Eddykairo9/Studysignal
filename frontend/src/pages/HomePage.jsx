import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero page-wrap">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-line" /> A student success research
            prototype
          </p>
          <h1>
            Better insight.
            <br />
            <span>More support.</span>
          </h1>
          <p className="hero-description">
            Explore how learning and lifestyle patterns relate to academic
            performance—and turn those observations into more informed student
            support.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/predict">
              Try a student check-in <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button button-secondary" to="/dashboard">
              Explore the research dashboard
            </Link>
          </div>
          <p className="hero-note">
            Estimates only · No student identity required
          </p>
        </div>

        <div aria-label="The model's three possible classification outcomes" className="hero-visual">
          <div className="visual-topline">
            <span>MODEL OUTPUT</span>
            <span className="visual-period">THREE CATEGORIES</span>
          </div>
          <div className="visual-heading">
            <span>One estimate. Three possibilities.</span>
            <span className="signal-pill">
              <span /> observed
            </span>
          </div>
          <div className="hero-chart">
            <div className="outcome-visual">
              <div className="outcome-row">
                <span className="outcome-dot outcome-low" />
                <strong>Low</strong>
                <span>Category 01</span>
              </div>
              <div className="outcome-row">
                <span className="outcome-dot outcome-medium" />
                <strong>Medium</strong>
                <span>Category 02</span>
              </div>
              <div className="outcome-row">
                <span className="outcome-dot outcome-high" />
                <strong>High</strong>
                <span>Category 03</span>
              </div>
              <p>Estimated probabilities are model outputs—not promises.</p>
            </div>
          </div>
          <div className="visual-footer">
            <span>Model output</span>
            <span>Estimate, not certainty</span>
          </div>
          <div aria-hidden="true" className="visual-stamp">
            STUDENT
            <br />
            FIRST
          </div>
        </div>
      </section>

      <section className="principles-section">
        <div className="page-wrap">
          <div className="section-heading">
            <p className="eyebrow">HOW IT WORKS</p>
            <h2>One project. Three useful views.</h2>
            <p>
              A small, transparent workflow connects student inputs to
              research-informed analysis.
            </p>
          </div>
          <div className="principle-grid">
            <article className="principle-card">
              <span className="principle-number">01</span>
              <div className="principle-icon icon-green" aria-hidden="true">↗</div>
              <h3>Share a snapshot</h3>
              <p>
                Enter study and wellbeing patterns—without a name, student
                number, or other identifying detail.
              </p>
            </article>
            <article className="principle-card">
              <span className="principle-number">02</span>
              <div className="principle-icon icon-blue" aria-hidden="true">◎</div>
              <h3>See a model estimate</h3>
              <p>
                Two trained classifiers estimate a performance category and
                show how their probabilities are distributed.
              </p>
            </article>
            <article className="principle-card">
              <span className="principle-number">03</span>
              <div className="principle-icon icon-peach" aria-hidden="true">⌁</div>
              <h3>Explore aggregate patterns</h3>
              <p>
                Researchers can review dataset-level summaries and model
                evaluation without accessing individual student records.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="research-note page-wrap">
        <div className="research-note-mark" aria-hidden="true">i</div>
        <div>
          <p className="eyebrow">A NOTE ON INTERPRETATION</p>
          <h2>Patterns can inform support. They don’t explain a person.</h2>
          <p>
            This tool performs classification, not causal inference. A model
            estimate is not a prediction of a student’s future or a substitute
            for a conversation with a student.
          </p>
        </div>
        <Link className="text-link" to="/dashboard">
          View the methodology <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </div>
  );
}
