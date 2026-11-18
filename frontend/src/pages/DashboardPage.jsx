import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import LoadingState from "../components/LoadingState.jsx";
import MetricCard from "../components/MetricCard.jsx";
import { api } from "../services/api.js";

const categoryColors = {
  Low: "#d7775a",
  Medium: "#d3a73f",
  High: "#6f8e34",
};

const featureLabels = {
  study_hours_weekly: "Study hours / week",
  attendance_percentage: "Attendance",
  assignment_completion_percentage: "Assignments completed",
  sleep_hours: "Sleep / day",
  year_of_study: "Year of study",
  number_of_courses: "Courses",
  social_media_hours_daily: "Social media / day",
  previous_performance: "Previous performance",
};

const metricLabels = [
  ["accuracy", "Accuracy"],
  ["macro_precision", "Macro precision"],
  ["macro_recall", "Macro recall"],
  ["macro_f1", "Macro F1"],
  ["weighted_f1", "Weighted F1"],
];

const chartFeatures = [
  {
    key: "study_hours_weekly",
    title: "Study hours by performance category",
    unit: "hours / week",
  },
  {
    key: "attendance_percentage",
    title: "Attendance by performance category",
    unit: "%",
  },
  {
    key: "sleep_hours",
    title: "Sleep duration by performance category",
    unit: "hours / day",
  },
  {
    key: "assignment_completion_percentage",
    title: "Assignment completion by performance category",
    unit: "%",
  },
];

function formatNumber(value, digits = 1) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits)
    : "—";
}

function ChartCard({ title, children, className = "" }) {
  return (
    <section className={`chart-card ${className}`}>
      <div className="chart-card-heading">
        <h3>{title}</h3>
        <span aria-hidden="true">↗</span>
      </div>
      {children}
    </section>
  );
}

function ConfusionMatrix({ title, matrix }) {
  const classes = ["Low", "Medium", "High"];
  return (
    <section className="matrix-card">
      <h3>{title}</h3>
      <p>Rows: actual · Columns: predicted</p>
      <div className="matrix-grid" role="table" aria-label={`${title} confusion matrix`}>
        <span className="matrix-corner" />
        {classes.map((category) => (
          <span className="matrix-label" key={`col-${category}`}>
            {category}
          </span>
        ))}
        {matrix.map((row, rowIndex) => (
          <div className="matrix-row" key={`row-${classes[rowIndex]}`} role="row">
            <span className="matrix-label" role="rowheader">{classes[rowIndex]}</span>
            {row.map((count, columnIndex) => (
              <span
                aria-label={`${classes[rowIndex]} predicted ${classes[columnIndex]}: ${count}`}
                className={`matrix-cell${rowIndex === columnIndex ? " matrix-diagonal" : ""}`}
                key={`${rowIndex}-${columnIndex}`}
                role="cell"
              >
                {count}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      api.overview(),
      api.distribution(),
      api.featureAnalysis(),
      api.comparison(),
    ])
      .then(([overview, distribution, featureAnalysis, comparison]) => {
        if (!active) return;
        setData({ overview, distribution, featureAnalysis, comparison });
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categoryRows = useMemo(() => {
    if (!data) return [];
    return ["Low", "Medium", "High"].map((category) => ({
      category,
      count: data.distribution.distribution[category] || 0,
    }));
  }, [data]);

  if (loading) {
    return (
      <section className="page-wrap dashboard-page">
        <LoadingState label="Loading aggregate research data…" />
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="page-wrap dashboard-page">
        <div className="page-intro">
          <p className="eyebrow">RESEARCH DASHBOARD</p>
          <h1>Aggregate patterns, thoughtfully presented.</h1>
        </div>
        <div className="error-banner" role="alert">
          <strong>Dashboard data is unavailable.</strong>
          <p>{error || "No dashboard data was returned by the API."}</p>
        </div>
      </section>
    );
  }

  const { overview, featureAnalysis, comparison } = data;
  const modelNames = Object.keys(comparison.models);
  const selectedModel = comparison.selected_model;
  const selectedMetrics = comparison.models[selectedModel];
  const featureImportance = featureAnalysis.random_forest_feature_importance.map(
    (item) => {
      const fullLabel = item.feature
        .replace(/^(numeric|categorical)__/, "")
        .replaceAll("_", " ")
        .replace(/\s+/g, " ");
      return {
        ...item,
        label:
          fullLabel.length > 20 ? `${fullLabel.slice(0, 19)}…` : fullLabel,
      };
    },
  );
  const comparisonRows = modelNames.map((name) => ({
    name,
    ...comparison.models[name],
  }));

  return (
    <section className="page-wrap dashboard-page">
      <div className="dashboard-heading">
        <div className="page-intro">
          <p className="eyebrow">LECTURER / RESEARCHER VIEW</p>
          <h1>Aggregate patterns, thoughtfully presented.</h1>
          <p>
            Dataset-level summaries and model evaluation. Individual records
            are not displayed.
          </p>
        </div>
        <span className="aggregate-badge">
          <span className="status-dot" /> AGGREGATE VIEW
        </span>
      </div>

      <div className="metrics-grid">
        <MetricCard
          detail="Rows in the configured dataset"
          icon="◫"
          label="Dataset observations"
          value={overview.total_observations.toLocaleString()}
        />
        <MetricCard
          detail="Mean across available responses"
          icon="◌"
          label="Average attendance"
          value={`${formatNumber(overview.averages.attendance_percentage)}%`}
        />
        <MetricCard
          detail="Per week, dataset mean"
          icon="↗"
          label="Study hours"
          value={formatNumber(overview.averages.study_hours_weekly)}
        />
        <MetricCard
          detail="Mean completion percentage"
          icon="✓"
          label="Assignments completed"
          value={`${formatNumber(overview.averages.assignment_completion_percentage)}%`}
        />
        <MetricCard
          detail="Mean duration per day"
          icon="◷"
          label="Average sleep"
          value={`${formatNumber(overview.averages.sleep_hours)} hrs`}
        />
      </div>

      <div className="dashboard-grid">
        <ChartCard className="distribution-card" title="Performance category distribution">
          <div className="distribution-content">
            <div className="donut-chart">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    data={categoryRows}
                    dataKey="count"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={3}
                    stroke="none"
                  >
                    {categoryRows.map((entry) => (
                      <Cell fill={categoryColors[entry.category]} key={entry.category} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <strong>{overview.total_observations.toLocaleString()}</strong>
                <span>records</span>
              </div>
            </div>
            <div className="distribution-legend">
              {categoryRows.map((row) => (
                <div className="legend-row" key={row.category}>
                  <span className="legend-swatch" style={{ backgroundColor: categoryColors[row.category] }} />
                  <span>{row.category}</span>
                  <strong>{row.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Selected model · held-out test">
          <div className="selected-model">
            <div>
              <span className="selected-label">SELECTED USING TRAINING CV</span>
              <h4>{selectedModel}</h4>
            </div>
            <span className="selected-score">
              {formatNumber(selectedMetrics.test.macro_f1 * 100, 1)}
              <small>macro F1</small>
            </span>
          </div>
          <div className="metric-lines">
            {metricLabels.map(([key, label]) => (
              <div className="metric-line" key={key}>
                <span>{label}</span>
                <strong>{formatNumber(selectedMetrics.test[key], 3)}</strong>
              </div>
            ))}
          </div>
          <p className="chart-footnote">Held-out test metrics are estimates from this dataset split.</p>
        </ChartCard>
      </div>

      <div className="chart-section-heading">
        <div>
          <p className="eyebrow">OBSERVED RELATIONSHIPS</p>
          <h2>Learning patterns by category</h2>
        </div>
        <p>Group means are descriptive. Association does not imply causation.</p>
      </div>
      <div className="feature-chart-grid">
        {chartFeatures.map((feature) => {
          const means = featureAnalysis.means_by_performance_category;
          const rows = ["Low", "Medium", "High"].map((category) => ({
            category,
            value: means[category][feature.key],
          }));
          return (
            <ChartCard key={feature.key} title={feature.title}>
              <div className="feature-chart">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={rows} margin={{ top: 12, right: 8, left: -14, bottom: 0 }}>
                    <CartesianGrid stroke="#e9ebdf" strokeDasharray="3 5" vertical={false} />
                    <XAxis axisLine={false} dataKey="category" tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [formatNumber(value), feature.unit]} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {rows.map((entry) => (
                        <Cell fill={categoryColors[entry.category]} key={entry.category} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-footnote">Mean {feature.unit} by observed category.</p>
            </ChartCard>
          );
        })}
      </div>

      <div className="dashboard-grid lower-grid">
        <ChartCard title="Random Forest · feature importance">
          <div className="importance-chart">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={featureImportance.slice(0, 10).reverse()}
                layout="vertical"
                margin={{ top: 8, right: 20, left: 12, bottom: 4 }}
              >
                <CartesianGrid stroke="#e9ebdf" strokeDasharray="3 5" horizontal={false} />
                <XAxis axisLine={false} tickLine={false} type="number" />
                <YAxis
                  axisLine={false}
                  dataKey="label"
                  tick={{ fill: "#606451", fontSize: 11 }}
                  tickLine={false}
                  type="category"
                  width={130}
                />
                <Tooltip formatter={(value) => [formatNumber(value, 4), "Importance"]} />
                <Bar dataKey="importance" fill="#809b36" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-footnote">
            Model-relative importance, not a causal explanation.
          </p>
        </ChartCard>

        <ChartCard title="Model comparison · held-out test">
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>CV macro F1</th>
                  <th>Accuracy</th>
                  <th>Macro precision</th>
                  <th>Macro recall</th>
                  <th>Macro F1</th>
                  <th>Weighted F1</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.name}>
                    <td>
                      {row.name}
                      {row.name === selectedModel ? (
                        <span className="selected-chip">selected</span>
                      ) : null}
                    </td>
                    <td>{formatNumber(row.cv_macro_f1, 3)}</td>
                    <td>{formatNumber(row.test.accuracy, 3)}</td>
                    <td>{formatNumber(row.test.macro_precision, 3)}</td>
                    <td>{formatNumber(row.test.macro_recall, 3)}</td>
                    <td>{formatNumber(row.test.macro_f1, 3)}</td>
                    <td>{formatNumber(row.test.weighted_f1, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="chart-footnote">
            Selection uses training cross-validation macro F1, not this held-out test.
          </p>
        </ChartCard>
      </div>

      <section className="matrices-section">
        <div className="chart-section-heading">
          <div>
            <p className="eyebrow">CLASSIFICATION ERRORS</p>
            <h2>Where predictions differ</h2>
          </div>
          <p>Correct classifications appear on the diagonal.</p>
        </div>
        <div className="matrix-grid-layout">
          {modelNames.map((name) => (
            <ConfusionMatrix
              key={name}
              matrix={comparison.models[name].test.confusion_matrix}
              title={name}
            />
          ))}
        </div>
      </section>

      <div className="dashboard-disclaimer">
        <span aria-hidden="true">i</span>
        <p>
          {featureAnalysis.association_note} Aggregate analysis does not show
          individual student information or prove that any factor causes an
          academic outcome.
        </p>
      </div>
    </section>
  );
}
