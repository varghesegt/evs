import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import { getAdminDonations } from '../../api/analyticsApi';

export default function Reports() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDonations()
      .then(res => setDonations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Reports</h1>
        <p>Complete donation records and activity log</p>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Food</th>
                <th>Donor</th>
                <th>Quantity</th>
                <th>Priority</th>
                <th>Status</th>
                <th>NGO</th>
                <th>Volunteer</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d, index) => (
                <tr key={`report-row-${d.id}-${index}`}>
                  <td>{d.id}</td>
                  <td>
                    <div className="font-medium">{d.foodName}</div>
                    <div className="text-sm text-muted">
                      {d.foodCategory?.replace(/_/g, ' ').toLowerCase()}
                    </div>
                  </td>
                  <td>{d.donorName}</td>
                  <td>{d.quantityKg} kg</td>
                  <td>{d.priorityScore != null && <PriorityBadge score={d.priorityScore} />}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>{d.ngoName || '--'}</td>
                  <td>{d.volunteerName || '--'}</td>
                  <td className="text-sm">{formatDate(d.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
