import React from 'react';

export default function EvsEquivalencyCards({ summary }) {
  if (!summary) return null;

  const carKm = summary.carKmNegated || Math.round((summary.totalCo2eAvoidedKg || 0) * 4.1);
  const trees = summary.treesPlantedEquivalency || Math.round(((summary.totalCo2eAvoidedKg || 0) / 22.0) * 10) / 10;
  const elecHours = summary.electricityHoursSaved || Math.round((summary.totalCo2eAvoidedKg || 0) * 12.0);
  const waterKL = Math.round(((summary.totalWaterSavedLiters || 0) / 1000.0) * 10) / 10;

  const cards = [
    {
      title: 'Car Emissions Negated',
      value: carKm.toLocaleString(),
      unit: 'km driven',
      desc: 'Equivalent auto exhaust emissions prevented based on EPA average vehicle factor.',
      badge: 'IPCC GWP Factor',
      formula: 'CO₂e × 4.1 km/kg',
      borderColor: '#0d9668',
    },
    {
      title: 'Trees Planted Equivalent',
      value: trees.toLocaleString(),
      unit: 'trees / yr',
      desc: 'Annual carbon sequestration by mature urban trees (USDA Forest Service data).',
      badge: 'UN Carbon Offset',
      formula: 'CO₂e ÷ 22 kg/tree/yr',
      borderColor: '#0284c7',
    },
    {
      title: 'Clean Energy Saved',
      value: elecHours.toLocaleString(),
      unit: 'hrs LED power',
      desc: 'Household LED electricity hours saved by halting food waste lifecycle (CERC Grid Factor).',
      badge: 'SDG 7 Energy',
      formula: 'CO₂e × 12.0 hrs/kg',
      borderColor: '#d97706',
    },
    {
      title: 'Virtual Water Preserved',
      value: waterKL.toLocaleString(),
      unit: 'kL conserved',
      desc: 'Agricultural irrigation water preserved in food supply chain (Water Footprint Network).',
      badge: 'SDG 6 Water',
      formula: 'Food kg × 1,800 L/kg',
      borderColor: '#7c3aed',
    },
  ];

  return (
    <div style={{ margin: 'var(--space-6) 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary-dark)' }}>
            Physical EVS Impact Equivalencies
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Tangible real-world environmental equivalents calculated via IPCC landfill methane GWP metrics & verified conversion factors
          </p>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '10px' }}>EVS Verified</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {cards.map((card, i) => (
          <div key={i} className="card" style={{
            padding: 'var(--space-4)',
            borderLeft: `4px solid ${card.borderColor}`,
            background: 'var(--color-surface)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span className="badge badge-secondary" style={{ fontSize: '9px' }}>{card.badge}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {card.title}
            </span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '4px 0' }}>
              {card.value} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{card.unit}</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '0 0 6px 0', lineHeight: '1.4' }}>
              {card.desc}
            </p>
            <div style={{
              fontSize: '9px',
              color: card.borderColor,
              fontFamily: 'monospace',
              padding: '2px 6px',
              background: '#f8fafc',
              borderRadius: '4px',
              display: 'inline-block',
            }}>
              Formula: {card.formula}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
