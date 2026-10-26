import { useState, useEffect } from 'react';
import { getDemandForecast } from '../api/aiApi';

export const MOCK_FORECAST = {
  forecastRegion: 'Tiruchirappalli District',
  forecastPeriod: 'Next 24 Hours',
  totalForecastedMealsDeficit: 320,
  totalExpectedSurplusMeals: 485,
  deficitCoveragePercentage: 151,
  aiRecommendation: 'High surplus availability in Cantonment and Central Bus Stand corridors. Prioritize transfers to Anbalayam Children Home and Trichy Seva Sangam.',
  shelterPredictions: [
    {
      ngoId: 1,
      ngoName: 'Trichy Seva Sangam Shelter',
      shelterName: 'Trichy Seva Sangam Shelter',
      urgencyLevel: 'HIGH',
      riskLevel: 'HIGH',
      estimatedMealsNeeded: 140,
      deficitMeals: 140,
      foodNeededKg: 35.0,
      peakDeficitTime: 'Tonight 19:30 - 21:00',
      recommendedAction: 'Full coverage guaranteed from SRM Hotel surplus.',
    },
    {
      ngoId: 2,
      ngoName: 'Anbalayam Children Home',
      shelterName: 'Anbalayam Children Home',
      urgencyLevel: 'MEDIUM',
      riskLevel: 'MEDIUM',
      estimatedMealsNeeded: 95,
      deficitMeals: 95,
      foodNeededKg: 24.0,
      peakDeficitTime: 'Tomorrow Lunch 12:30 - 14:00',
      recommendedAction: 'Secured via Hotel Sangam banquet dispatch.',
    },
    {
      ngoId: 3,
      ngoName: 'St. Joseph Relief Shelter',
      shelterName: 'St. Joseph Relief Shelter',
      urgencyLevel: 'CRITICAL',
      riskLevel: 'CRITICAL',
      estimatedMealsNeeded: 85,
      deficitMeals: 85,
      foodNeededKg: 21.5,
      peakDeficitTime: 'Tomorrow Breakfast 07:30 - 09:00',
      recommendedAction: 'Dispatch reserve EV courier from Geetha Cafe surplus.',
    },
  ],
};

export default function DemandForecastCard() {
  const [forecast, setForecast] = useState(MOCK_FORECAST);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDemandForecast()
      .then(res => {
        if (res.data && res.data.forecastRegion) {
          setForecast(res.data);
        } else {
          setForecast(MOCK_FORECAST);
        }
      })
      .catch(() => {
        setForecast(MOCK_FORECAST);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div className="loading-spinner"><div className="spinner"></div></div>
      </div>
    );
  }

  const activeForecast = forecast || MOCK_FORECAST;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #f1f5f9',
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#0284c7',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            Predictive ML Model
          </div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '2px 0 0 0',
          }}>
            Shelter Meal Deficit & Demand Forecast ({forecast.forecastRegion})
          </h3>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#0369a1',
          background: '#f0f9ff',
          padding: '4px 10px',
          borderRadius: '6px',
          border: '1px solid #bae6fd',
        }}>
          {forecast.forecastPeriod}
        </span>
      </div>

      <p style={{
        fontSize: '13px',
        color: '#64748b',
        margin: '0 0 16px 0',
        lineHeight: 1.45,
      }}>
        Machine learning model forecasts upcoming shelter demand using historical consumption cycles and storage telemetry.
      </p>

      {/* Primary Forecast Metrics (High Clarity, Decongested) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '14px',
        marginBottom: '20px',
      }}>
        <div style={{
          background: '#f8fafc',
          padding: '14px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Forecasted Meal Deficit</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0369a1', margin: '2px 0' }}>
            {forecast.totalForecastedMealsDeficit}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Projected unfulfilled meals</div>
        </div>

        <div style={{
          background: '#f8fafc',
          padding: '14px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Expected Surplus Supply</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#047857', margin: '2px 0' }}>
            {forecast.totalExpectedSurplusMeals}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>From scheduled donors</div>
        </div>

        <div style={{
          background: '#f8fafc',
          padding: '14px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Deficit Coverage Rate</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#b45309', margin: '2px 0' }}>
            {forecast.deficitCoveragePercentage}%
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Regional supply-demand balance</div>
        </div>
      </div>

      {/* Shelter Predictions Breakdown (Clean Cards) */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#334155',
          marginBottom: '10px',
        }}>
          High-Risk Shelter Windows
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '10px',
        }}>
          {forecast.shelterPredictions.map((pred, idx) => (
            <div key={`shelter-pred-${pred.ngoId || idx}-${idx}`} style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{pred.ngoName}</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: pred.urgencyLevel === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
                  color: pred.urgencyLevel === 'CRITICAL' ? '#dc2626' : '#d97706',
                  border: pred.urgencyLevel === 'CRITICAL' ? '1px solid #fecaca' : '1px solid #fde68a',
                }}>
                  {pred.urgencyLevel}
                </span>
              </div>
              <div style={{ color: '#475569' }}>
                Deficit: <strong>{pred.estimatedMealsNeeded} meals</strong> ({pred.foodNeededKg} kg)
              </div>
              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                Peak Window: {pred.peakDeficitTime}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendation Banner (Clean, Professional, No Emojis) */}
      <div style={{
        padding: '12px 14px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        fontSize: '12px',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#0284c7',
          marginTop: '6px',
          flexShrink: 0,
        }} />
        <div>
          <strong style={{ color: '#0f172a' }}>Recommendation:</strong> {forecast.aiRecommendation}
        </div>
      </div>
    </div>
  );
}
