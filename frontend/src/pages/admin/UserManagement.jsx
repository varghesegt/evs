import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllUsers, toggleUserStatus, approveNgo } from '../../api/analyticsApi';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchUsers = () => {
    setLoading(true);
    getAllUsers()
      .then(res => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggle = async (id) => {
    try {
      await toggleUserStatus(id);
      fetchUsers();
    } catch {
      alert('Failed to update user status');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveNgo(id);
      fetchUsers();
    } catch {
      alert('Failed to approve NGO');
    }
  };

  const filtered = filter === 'ALL' ? users : users.filter(u => u.role === `ROLE_${filter}`);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>User Administration</h1>
        <p>Manage ecosystem members, verify credentials, and approve NGO registrations</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        {['ALL', 'DONOR', 'NGO', 'VOLUNTEER', 'ADMIN'].map(r => (
          <button
            key={r}
            className={`btn ${filter === r ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter(r)}
            style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px' }}
          >
            {r === 'ALL' ? `All Users (${users.length})` : r}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Member Details</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verification Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, index) => (
                <tr key={`user-row-${u.id}-${index}`}>
                  <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>#{u.id}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{u.name}</div>
                    {u.organizationName && (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {u.organizationName}
                      </div>
                    )}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{u.email}</td>
                  <td>
                    <span className="badge badge-primary">{u.role.replace('ROLE_', '')}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <span className={`badge ${u.isActive ? 'badge-primary' : 'badge-danger'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {u.role === 'ROLE_NGO' && (
                        <span className={`badge ${u.isApproved ? 'badge-primary' : 'badge-accent'}`}>
                          {u.isApproved ? 'Approved' : 'Pending Verification'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleToggle(u.id)}
                        style={{ minHeight: '36px' }}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      {u.role === 'ROLE_NGO' && !u.isApproved && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApprove(u.id)}
                          style={{ minHeight: '36px' }}
                        >
                          Approve NGO
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
