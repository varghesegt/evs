import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import DonationCard from '../../components/DonationCard';
import MapView from '../../components/MapView';
import { getNgoDonations } from '../../api/ngoApi';
import { getAvailableDonations } from '../../api/donationApi';
import { getMapPins } from '../../api/analyticsApi';

export default function NgoDashboard() {
  const [myDonations, setMyDonations] = useState([]);
  const [available, setAvailable] = useState([]);
  const [mapPins, setMapPins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getNgoDonations(), getAvailableDonations(), getMapPins()])
      .then(([myRes, avRes, pinsRes]) => {
        setMyDonations(myRes.data);
        setAvailable(avRes.data);
        setMapPins(pinsRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = myDonations.filter(d => d.status === 'DELIVERED').length;
  const totalKg = myDonations.reduce((sum, d) => sum + (d.quantityKg || 0), 0);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>NGO Dashboard</h1>
        <p>Manage incoming food requests, view live pins, and coordinate volunteers</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Available Donations" value={available.length} variant="secondary" />
        <StatCard label="My Accepted" value={myDonations.length} variant="primary" />
        <StatCard label="Delivered" value={completed} variant="accent" />
        <StatCard label="Total Food Handled" value={totalKg.toFixed(1)} unit="kg" variant="primary" />
      </div>

      <div className="card mb-6" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header" style={{ marginBottom: 'var(--space-2)' }}>
          <span className="card-title">Realtime Interactive Map & Pin Points</span>
        </div>
        <MapView markers={mapPins} zoom={12} height="400px" showFilters={true} />
      </div>

      <div className="card-header mb-4">
        <span className="card-title">Recent Activity & Accepted Donations</span>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : myDonations.length === 0 ? (
        <div className="empty-state">
          <h3>No accepted donations yet</h3>
          <p>Check incoming requests to start accepting food donations.</p>
        </div>
      ) : (
        <div className="donation-cards-grid">
          {myDonations.slice(0, 6).map(d => (
            <DonationCard key={d.id} donation={d} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
