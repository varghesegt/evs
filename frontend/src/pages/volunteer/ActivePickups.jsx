import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DonationCard from '../../components/DonationCard';
import MapView from '../../components/MapView';
import { getActivePickups, markPickedUp } from '../../api/volunteerApi';

export default function ActivePickups() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const fetchData = () => {
    setLoading(true);
    getActivePickups()
      .then(res => setPickups(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handlePickup = async (id) => {
    setActing(id);
    try {
      await markPickedUp(id);
      fetchData();
    } catch {
      alert('Failed to mark as picked up');
    } finally {
      setActing(null);
    }
  };

  const markers = pickups.filter(d => d.pickupLat).map(d => ({
    lat: d.pickupLat, lng: d.pickupLng, type: 'donor',
    title: d.foodName, subtitle: d.pickupAddress,
  }));

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Active Pickups</h1>
        <p>Navigate to pickup locations and collect food donations</p>
      </div>

      {markers.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <span className="card-title">Pickup Locations</span>
          </div>
          <MapView markers={markers} zoom={12} />
        </div>
      )}

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : pickups.length === 0 ? (
        <div className="empty-state">
          <h3>No active pickups</h3>
          <p>No pending pickup assignments at this time.</p>
        </div>
      ) : (
        <div className="donation-cards-grid">
          {pickups.map(d => (
            <DonationCard key={d.id} donation={d} actions={
              d.status !== 'PICKED_UP' && d.pickupStatus !== 'PICKED_UP' ? (
                <button className="btn btn-accent btn-sm"
                        disabled={acting === d.id}
                        onClick={() => handlePickup(d.id)}>
                  {acting === d.id ? 'Updating...' : 'Mark Picked Up'}
                </button>
              ) : null
            } />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
