import { useState, useEffect } from 'react';
import { getDemandForecast } from '../api/aiApi';

export default function DemandForecastCard() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDemandForecast()
      .then(res => setForecast(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="card" style={{ padding: 'var(--space-4)' }}><div className="loading-spinner"><div className="spinner"></div></div></div>;
  }

  if (!forecast) return null;

  return (
    <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)', borderLeft: '5px solid var(--color-secondary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Time-Series ML Demand Engine
          </div>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 800, color: 'var(--color-text)', margin: '2px 0 0 0' }}>
            Predictive Food Shortage & Deficit Forecast ({forecast.forecastRegion})
          </h3>
        </div>
        <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
          {forecast.forecastPeriod}
        </span>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
        AI predicts peak shelter meal demands based on day-of-week consumption patterns, Trichy festival calendars, and shelter storage telemetry.
      </p>

      {/* Primary Forecast Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{ background: '#f0f9ff', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0369a1' }}>{forecast.totalForecastedMealsDeficit}</div>
          <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>Forecasted Meal Deficit</span>
        </div>
        <div style={{ background: '#ecfdf5', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#047857' }}>{forecast.totalExpectedSurplusMeals}</div>
          <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Expected Surplus Meals</span>
        </div>
        <div style={{ background: '#fffbeb', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#b45309' }}>{forecast.deficitCoveragePercentage}%</div>
          <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>Predicted Deficit Coverage</span>
        </div>
      </div>

      {/* Shelter Predictions Breakdown */}
      <div style={{ marginTop: 'var(--space-3)' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
          High-Risk Shelter Deficit Window Breakdown
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-2)' }}>
          {forecast.shelterPredictions.map(pred => (
            <div key={pred.ngoId} style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              border: '1px solid var(--color-border)',
              fontSize: '11px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-text)' }}>
                <span>{pred.ngoName}</span>
                <span className={`badge ${pred.urgencyLevel === 'CRITICAL' ? 'badge-danger' : 'badge-accent'}`}>
                  {pred.urgencyLevel}
                </span>
              </div>
              <div style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Est. Deficit: <strong>{pred.estimatedMealsNeeded} meals</strong> ({pred.foodNeededKg} kg)
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '10px', marginTop: '2px' }}>
                Peak Window: {pred.peakDeficitTime}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Proactive Recommendation Banner */}
      <div style={{
        marginTop: 'var(--space-4)',
        padding: 'var(--space-3)',
        background: '#eff6ff',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #bfdbfe',
        fontSize: '11px',
        color: '#1e40af',
        fontWeight: 600,
      }}>
        💡 AI Recommendation: {forecast.aiRecommendation}
      </div>
    </div>
  );
}
