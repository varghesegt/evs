import React from 'react';

export default function EvsEquivalencyCards({ summary }) {
  if (!summary) return null;

  const carKm = summary.carKmNegated || Math.round((summary.totalCo2eAvoidedKg || 0) * 4.1);
  const trees = summary.treesPlantedEquivalency || Math.round(((summary.totalCo2eAvoidedKg || 0) / 22.0) * 10) / 10;
  const elecHours = summary.electricityHoursSaved || Math.round((summary.totalCo2eAvoidedKg || 0) * 12.0);
  const waterKL = Math.round(((summary.totalWaterSavedLiters || 0) / 1000.0) * 10) / 10;

  const cards = [
    {
      title: 'Vehicle Travel Negated',
      value: carKm.toLocaleString(),
      unit: 'km avoided',
      desc: 'Auto exhaust emissions prevented based on EPA average passenger vehicle factor.',
      standard: 'EPA WARM / IPCC GWP-28',
    },
    {
      title: 'Urban Trees Equivalent',
      value: trees.toLocaleString(),
      unit: 'tree-years',
      desc: 'Equivalent annual carbon sequestration by urban tree canopy.',
      standard: 'USDA Forest Service',
    },
    {
      title: 'Grid Power Conserved',
      value: elecHours.toLocaleString(),
      unit: 'kWh equivalent',
      desc: 'Lifecycle energy saved by diverting edible surplus from municipal waste streams.',
      standard: 'CERC Grid Factor',
    },
    {
      title: 'Agricultural Water Saved',
      value: waterKL.toLocaleString(),
      unit: 'kL conserved',
      desc: 'Irrigation water preserved across the primary agricultural supply chain.',
      standard: 'Water Footprint Network',
    },
  ];

  return (
    <div style={{ margin: '24px 0' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '16px',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Environmental Impact Equivalencies
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Tangible real-world ecological offsets calculated from landfill methane diversion models
          </p>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#047857',
          background: '#ecfdf5',
          padding: '3px 8px',
          borderRadius: '4px',
          border: '1px solid #a7f3d0',
        }}>
          Verified Science Standards
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        {cards.map((card, i) => (
          <div
            key={i}
            style={{
              padding: '18px 20px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {card.title}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                {card.value} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>{card.unit}</span>
              </div>
              <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                {card.desc}
              </p>
            </div>
            <div style={{
              fontSize: '10px',
              color: '#64748b',
              background: '#f8fafc',
              padding: '3px 6px',
              borderRadius: '4px',
              border: '1px solid #f1f5f9',
              alignSelf: 'flex-start',
            }}>
              Standard: {card.standard}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
