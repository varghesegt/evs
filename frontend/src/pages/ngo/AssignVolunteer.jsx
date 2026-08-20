import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DonationCard from '../../components/DonationCard';
import MapView from '../../components/MapView';
import { getNgoDonations, getVolunteers, assignVolunteer } from '../../api/ngoApi';

export default function AssignVolunteer() {
  const [donations, setDonations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [assigning, setAssigning] = useState(null);

  useEffect(() => {
    Promise.all([getNgoDonations(), getVolunteers()])
      .then(([dRes, vRes]) => {
        setDonations(dRes.data.filter(d => d.status === 'ACCEPTED'));
        setVolunteers(vRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAssign = async (donationId) => {
    const volId = selected[donationId];
    if (!volId) return alert('Please select a volunteer');
    setAssigning(donationId);
    try {
      await assignVolunteer(donationId, volId);
      setDonations(prev => prev.filter(d => d.id !== donationId));
    } catch {
      alert('Failed to assign volunteer');
    } finally {
      setAssigning(null);
    }
  };

  const markers = volunteers.filter(v => v.latitude).map(v => ({
    lat: v.latitude, lng: v.longitude, type: 'volunteer',
    title: v.name, subtitle: 'Volunteer',
  }));

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Assign Volunteer</h1>
        <p>Assign volunteers to accepted donations for pickup</p>
      </div>

      {markers.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <span className="card-title">Volunteer Locations</span>
          </div>
          <MapView markers={markers} zoom={12} />
        </div>
      )}

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : donations.length === 0 ? (
        <div className="empty-state">
          <h3>No pending assignments</h3>
          <p>All accepted donations have been assigned to volunteers.</p>
        </div>
      ) : (
        <div className="donation-cards-grid">
          {donations.map(d => (
            <DonationCard key={d.id} donation={d} actions={
              <div className="flex gap-2 items-center">
                <select className="form-select" style={{ width: 'auto', minWidth: '140px', padding: '4px 8px', fontSize: 'var(--font-size-xs)' }}
                        value={selected[d.id] || ''}
                        onChange={e => setSelected({ ...selected, [d.id]: e.target.value })}>
                  <option value="">Select volunteer</option>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <button className="btn btn-primary btn-sm"
                        disabled={assigning === d.id || !selected[d.id]}
                        onClick={() => handleAssign(d.id)}>
                  {assigning === d.id ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            } />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
