export default function MetricCard({ label, value, detail, icon }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span aria-hidden="true" className="metric-icon">
          {icon}
        </span>
      </div>
      <strong className="metric-value">{value}</strong>
      {detail ? <span className="metric-detail">{detail}</span> : null}
    </article>
  );
}
