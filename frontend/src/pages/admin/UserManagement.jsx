import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatusBadge } from '../../components/Badges';
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
        <h1>User Management</h1>
        <p>Manage platform users and approve NGO registrations</p>
      </div>

      <div className="flex gap-2 mb-6">
        {['ALL', 'DONOR', 'NGO', 'VOLUNTEER', 'ADMIN'].map(r => (
          <button key={r} className={`btn ${filter === r ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setFilter(r)}>
            {r === 'ALL' ? 'All' : r}
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
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>
                    <div className="font-medium">{u.name}</div>
                    {u.organizationName && <div className="text-sm text-muted">{u.organizationName}</div>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge badge-primary">{u.role.replace('ROLE_', '')}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-primary' : 'badge-danger'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {u.role === 'ROLE_NGO' && (
                      <span className={`badge ${u.isApproved ? 'badge-primary' : 'badge-accent'}`} style={{ marginLeft: '4px' }}>
                        {u.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(u.id)}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      {u.role === 'ROLE_NGO' && !u.isApproved && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleApprove(u.id)}>
                          Approve
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
