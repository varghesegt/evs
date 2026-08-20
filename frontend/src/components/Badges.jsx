export function PriorityBadge({ score }) {
  let level, label;
  if (score >= 80) { level = 'critical'; label = 'Critical'; }
  else if (score >= 60) { level = 'high'; label = 'High'; }
  else if (score >= 40) { level = 'medium'; label = 'Medium'; }
  else { level = 'low'; label = 'Low'; }

  return (
    <span className={`priority-badge ${level}`}>
      <span className="priority-dot"></span>
      {label} ({score})
    </span>
  );
}

export function StatusBadge({ status }) {
  const statusMap = {
    PENDING: 'pending',
    VALIDATED: 'validated',
    MATCHED: 'validated',
    ACCEPTED: 'accepted',
    PICKUP_ASSIGNED: 'accepted',
    PICKED_UP: 'accepted',
    DELIVERED: 'delivered',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
  };

  const labelMap = {
    PENDING: 'Pending',
    VALIDATED: 'Available',
    MATCHED: 'Matched',
    ACCEPTED: 'Accepted',
    PICKUP_ASSIGNED: 'Pickup Assigned',
    PICKED_UP: 'Picked Up',
    DELIVERED: 'Delivered',
    EXPIRED: 'Expired',
    CANCELLED: 'Cancelled',
  };

  return (
    <span className={`status-badge status-${statusMap[status] || 'pending'}`}>
      {labelMap[status] || status}
    </span>
  );
}

export function FreshnessBar({ hoursRemaining, maxHours = 8 }) {
  const pct = Math.min(100, (hoursRemaining / maxHours) * 100);
  let level;
  if (pct > 60) level = 'fresh';
  else if (pct > 25) level = 'warning';
  else level = 'critical';

  return (
    <div>
      <div className="text-sm text-muted">
        {hoursRemaining > 0 ? `${hoursRemaining.toFixed(1)}h remaining` : 'Expired'}
      </div>
      <div className="freshness-bar">
        <div className={`freshness-bar-fill ${level}`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}
