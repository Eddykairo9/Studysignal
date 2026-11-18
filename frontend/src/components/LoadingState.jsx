export default function LoadingState({ label = "Loading data…" }) {
  return (
    <div aria-live="polite" className="loading-state" role="status">
      <span className="loading-spinner" />
      {label}
    </div>
  );
}
