import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DonationCard from '../../components/DonationCard';
import { getAvailableDonations } from '../../api/donationApi';
import { acceptDonation } from '../../api/ngoApi';

export default function IncomingRequests() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  const fetchData = () => {
    setLoading(true);
    getAvailableDonations()
      .then(res => setDonations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAccept = async (id) => {
    setAccepting(id);
    try {
      await acceptDonation(id);
      fetchData();
    } catch {
      alert('Failed to accept donation');
    } finally {
      setAccepting(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Incoming Requests</h1>
        <p>Available food donations sorted by priority</p>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : donations.length === 0 ? (
        <div className="empty-state">
          <h3>No available donations</h3>
          <p>Check back later for new food donation requests.</p>
        </div>
      ) : (
        <div className="donation-cards-grid">
          {donations.map(d => (
            <DonationCard key={d.id} donation={d} actions={
              <button className="btn btn-primary btn-sm"
                      disabled={accepting === d.id}
                      onClick={() => handleAccept(d.id)}>
                {accepting === d.id ? 'Accepting...' : 'Accept'}
              </button>
            } />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
