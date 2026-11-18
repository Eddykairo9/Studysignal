import { useEffect, useMemo, useState } from "react";
import LoadingState from "../components/LoadingState.jsx";
import { api } from "../services/api.js";

const fields = [
  {
    name: "university",
    label: "University",
    type: "select",
    help: "Choose the institution represented in the dataset.",
  },
  {
    name: "programme",
    label: "Programme",
    type: "select",
    help: "Your academic programme or field of study.",
  },
  {
    name: "year_of_study",
    label: "Year of study",
    type: "number",
    min: 1,
    max: 12,
    step: 1,
    unit: "year",
    help: "Current year in your programme.",
  },
  {
    name: "study_hours_weekly",
    label: "Study hours per week",
    type: "number",
    min: 0,
    max: 168,
    step: 0.5,
    unit: "hours",
    help: "Approximate hours spent studying each week.",
  },
  {
    name: "attendance_percentage",
    label: "Class attendance",
    type: "number",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    help: "Your approximate attendance percentage.",
  },
  {
    name: "assignment_completion_percentage",
    label: "Assignments completed",
    type: "number",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    help: "Approximate percentage of assignments completed.",
  },
  {
    name: "sleep_hours",
    label: "Sleep per day",
    type: "number",
    min: 0,
    max: 24,
    step: 0.5,
    unit: "hours",
    help: "Average hours of sleep in a day.",
  },
  {
    name: "internet_access",
    label: "Internet access",
    type: "select",
    help: "Choose the option closest to your current access.",
  },
  {
    name: "study_location",
    label: "Usual study location",
    type: "select",
    help: "Where you most often study.",
  },
  {
    name: "number_of_courses",
    label: "Courses this term",
    type: "number",
    min: 1,
    max: 30,
    step: 1,
    unit: "courses",
    help: "Number of courses you are currently taking.",
  },
  {
    name: "social_media_hours_daily",
    label: "Social media per day",
    type: "number",
    min: 0,
    max: 24,
    step: 0.5,
    unit: "hours",
    help: "Approximate daily time spent on social media.",
  },
  {
    name: "previous_performance",
    label: "Previous academic performance",
    type: "number",
    min: 0,
    max: 100,
    step: 0.1,
    unit: "score",
    help: "Use the same 0–100 scale represented in the dataset.",
  },
];

const categoryColors = {
  Low: "#d7775a",
  Medium: "#d3a73f",
  High: "#6f8e34",
};

const supportSuggestions = {
  Low: [
    "Consider reaching out to an academic advisor to talk through your goals.",
    "A manageable weekly study plan may help you identify a steady routine.",
    "If you need support, campus tutoring and wellbeing services may be useful.",
  ],
  Medium: [
    "Notice which study routines have been most sustainable for you.",
    "Planning assignments in smaller steps can make progress easier to track.",
    "Consider asking an instructor or advisor about areas you would like to strengthen.",
  ],
  High: [
    "Keep using the learning routines that work well for you.",
    "Balance academic goals with sleep, rest, and time away from study.",
    "If helpful, share effective study strategies with peers—without pressure.",
  ],
};

const initialForm = {
  university: "University of Nairobi",
  programme: "BSc Computer Science",
  year_of_study: "3",
  study_hours_weekly: "12",
  attendance_percentage: "80",
  assignment_completion_percentage: "85",
  sleep_hours: "7",
  internet_access: "Yes",
  study_location: "Library",
  number_of_courses: "6",
  social_media_hours_daily: "2",
  previous_performance: "70",
};

function FieldControl({ field, options, value, onChange }) {
  const id = `field-${field.name}`;
  return (
    <div className="field-control">
      <label htmlFor={id}>{field.label}</label>
      {field.type === "select" ? (
        <select
          autoComplete="off"
          id={id}
          onChange={onChange}
          required
          value={value}
        >
          <option disabled value="">
            Select an option
          </option>
          {(options[field.name] || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          {value && !(options[field.name] || []).includes(value) ? (
            <option value={value}>{value} (custom)</option>
          ) : null}
        </select>
      ) : (
        <div className="input-with-unit">
          <input
            id={id}
            max={field.max}
            min={field.min}
            onChange={onChange}
            required
            step={field.step}
            type="number"
            value={value}
          />
          <span>{field.unit}</span>
        </div>
      )}
      <small>{field.help}</small>
    </div>
  );
}

function PredictionResult({ result }) {
  const probabilityData = useMemo(
    () =>
      ["Low", "Medium", "High"].map((category) => ({
        category,
        probability: Number((result.probabilities[category] * 100).toFixed(1)),
      })),
    [result],
  );

  return (
    <section aria-live="polite" className="result-card" id="prediction-result">
      <div className="result-heading">
        <div>
          <p className="eyebrow">YOUR MODEL ESTIMATE</p>
          <h2>
            The model classified this snapshot as{" "}
            <span className={`category-text category-${result.predicted_category.toLowerCase()}`}>
              {result.predicted_category}
            </span>
          </h2>
        </div>
        <span className="result-model">{result.model_used}</span>
      </div>
      <div aria-label="Model estimated probability distribution" className="probability-bars" role="list">
        {probabilityData.map((entry) => (
          <div className="probability-row" key={entry.category} role="listitem">
            <span className="probability-label">{entry.category}</span>
            <span className="probability-track">
              <span
                className="probability-fill"
                style={{
                  backgroundColor: categoryColors[entry.category],
                  width: `${entry.probability}%`,
                }}
              />
            </span>
            <strong>{entry.probability.toFixed(1)}%</strong>
          </div>
        ))}
      </div>
      <p className="result-disclaimer">{result.disclaimer}</p>
      <div className="suggestion-box">
        <h3>Ideas for reflection</h3>
        <p>These are general suggestions, not a diagnosis or guaranteed intervention.</p>
        <ul>
          {supportSuggestions[result.predicted_category].map((suggestion) => (
            <li key={suggestion}>{suggestion}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function PredictionPage() {
  const [options, setOptions] = useState({});
  const [selectedModel, setSelectedModel] = useState("");
  const [availableModels, setAvailableModels] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .models()
      .then((data) => {
        if (!active) return;
        setOptions(data.categorical_options || {});
        setSelectedModel(data.selected_model);
        setAvailableModels(data.available_models || []);
        setForm((current) => ({
          ...current,
          ...Object.fromEntries(
            fields
              .filter((field) => field.type === "select")
              .map((field) => [
                field.name,
                  data.categorical_options?.[field.name]?.includes(current[field.name])
                    ? current[field.name]
                    : data.categorical_options?.[field.name]?.[0] || "",
              ]),
          ),
        }));
      })
      .catch((requestError) => {
        if (active) setConfigError(requestError.message);
      })
      .finally(() => {
        if (active) setLoadingConfig(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setSubmitting(true);
    const payload = {
      ...Object.fromEntries(
        Object.entries(form).map(([key, value]) => [
          key,
          ["year_of_study", "number_of_courses"].includes(key)
            ? Number.parseInt(value, 10)
            : [
                  "study_hours_weekly",
                  "attendance_percentage",
                  "assignment_completion_percentage",
                  "sleep_hours",
                  "social_media_hours_daily",
                  "previous_performance",
                ].includes(key)
              ? Number(value)
              : value,
        ]),
      ),
      model_name: selectedModel,
    };
    try {
      const prediction = await api.predict(payload);
      setResult(prediction);
      window.setTimeout(
        () =>
          document
            .getElementById("prediction-result")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        60,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-wrap prediction-page">
      <div className="page-intro">
        <p className="eyebrow">STUDENT CHECK-IN · 3 MINUTES</p>
        <h1>A snapshot of your learning routine.</h1>
        <p>
          Share a few learning and lifestyle details to see how a trained model
          classifies this snapshot. No name or student number is needed.
        </p>
      </div>

      {loadingConfig ? <LoadingState label="Loading model options…" /> : null}
      {configError ? (
        <div className="error-banner" role="alert">
          <strong>Couldn’t load the prediction service.</strong>
          <p>{configError}</p>
        </div>
      ) : null}

      <div className="form-layout">
        <form className="prediction-form panel" onSubmit={submit}>
          <div className="form-top">
            <div>
              <p className="eyebrow">YOUR INFORMATION</p>
              <h2>Learning &amp; wellbeing</h2>
              <p className="form-sample-note">
                Example values are prefilled for testing. Edit any field to explore.
              </p>
            </div>
            <span className="form-step">01 / 01</span>
          </div>
          <div className="field-grid">
            {fields.map((field) => (
              <FieldControl
                field={field}
                key={field.name}
                onChange={(event) => updateField(field.name, event.target.value)}
                options={options}
                value={form[field.name]}
              />
            ))}
          </div>
          <div className="model-choice">
            <label htmlFor="model-choice">Model used</label>
            <select
              id="model-choice"
              onChange={(event) => setSelectedModel(event.target.value)}
              value={selectedModel}
            >
              {availableModels.map((name) => (
                <option key={name} value={name}>
                  {name.replace(/^Tuned\s+/, "")}
                </option>
              ))}
            </select>
            <small>
              The selected model is used for this estimate; both models remain
              available for comparison.
            </small>
          </div>
          {error ? (
            <div className="error-banner form-error" role="alert">
              {error}
            </div>
          ) : null}
          <div className="form-submit">
            <p>
              Submitting does not save your information. This prototype does
              not require identifying details.
            </p>
            <button
              className="button button-primary"
              disabled={submitting || loadingConfig || Boolean(configError)}
              type="submit"
            >
              {submitting ? "Generating estimate…" : "See my estimate"}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>

        <aside className="form-aside">
          <div className="aside-note">
            <span className="aside-icon" aria-hidden="true">✳</span>
            <p className="eyebrow">A GENTLE REMINDER</p>
            <h3>You’re more than a category.</h3>
            <p>
              This result is an estimate from patterns in a dataset. It cannot
              account for everything about your circumstances, effort, or
              potential.
            </p>
          </div>
          <div className="aside-note aside-note-muted">
            <p className="eyebrow">WHAT HAPPENS NEXT?</p>
            <ol>
              <li>Your entries are validated in your browser and by the API.</li>
              <li>A saved model pipeline returns class probabilities.</li>
              <li>The result is displayed here and is not stored by the app.</li>
            </ol>
          </div>
        </aside>
      </div>
      {result ? (
        <div className="result-wrap">
          <PredictionResult result={result} />
        </div>
      ) : null}
    </section>
  );
}
