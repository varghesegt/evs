export default function StatCard({ label, value, unit, variant = 'primary' }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="stat-card-unit">{unit}</span>}
      </div>
    </div>
  );
}
