import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import MapView from '../../components/MapView';
import { getDashboardStats, getEnvironmentalSummary, getMapPins } from '../../api/analyticsApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [envSummary, setEnvSummary] = useState(null);
  const [mapPins, setMapPins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getEnvironmentalSummary(), getMapPins()])
      .then(([sRes, eRes, pinsRes]) => {
        setStats(sRes.data);
        setEnvSummary(eRes.data);
        setMapPins(pinsRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <DashboardLayout><div className="loading-spinner"><div className="spinner"></div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Admin System Control</h1>
        <p>Real-time analytics, environmental metrics, and network pin points</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Donations" value={stats?.totalDonations || 0} variant="primary" />
        <StatCard label="Today's Donations" value={stats?.todayDonations || 0} variant="secondary" />
        <StatCard label="Pending Pickups" value={stats?.pendingPickups || 0} variant="accent" />
        <StatCard label="Completed Deliveries" value={stats?.completedDeliveries || 0} variant="primary" />
      </div>

      <div className="card-header mb-4">
        <span className="card-title">Environmental Impact Overview</span>
      </div>

      <div className="stats-grid">
        <StatCard label="Food Rescued" value={(envSummary?.totalFoodRescuedKg || 0).toFixed(1)} unit="kg" variant="primary" />
        <StatCard label="Meals Supported" value={envSummary?.totalMealsSupported || 0} variant="secondary" />
        <StatCard label="CO2e Avoided" value={(envSummary?.totalCo2eAvoidedKg || 0).toFixed(1)} unit="kg" variant="accent" />
        <StatCard label="Water Saved" value={((envSummary?.totalWaterSavedLiters || 0) / 1000).toFixed(1)} unit="kL" variant="secondary" />
        <StatCard label="Landfill Prevented" value={(envSummary?.totalLandfillPreventedKg || 0).toFixed(1)} unit="kg" variant="primary" />
        <StatCard label="Fuel Saved" value={(envSummary?.totalFuelSavedLiters || 0).toFixed(2)} unit="L" variant="accent" />
        <StatCard label="Active Donors" value={envSummary?.totalActiveDonors || 0} variant="primary" />
        <StatCard label="Active NGOs" value={envSummary?.totalActiveNgos || 0} variant="secondary" />
      </div>

      <div className="card mt-6" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card-header" style={{ marginBottom: 'var(--space-2)' }}>
          <span className="card-title">Realtime Ecosystem Map & Network Pin Points</span>
        </div>
        <MapView markers={mapPins} zoom={12} height="420px" showFilters={true} />
      </div>
    </DashboardLayout>
  );
}
