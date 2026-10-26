import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import { getAllUsers, toggleUserStatus, approveNgo } from '../../api/analyticsApi';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    getAllUsers()
      .then(res => setUsers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggle = async (id) => {
    setActionLoadingId(id);
    try {
      await toggleUserStatus(id);
      fetchUsers();
    } catch {
      alert('Failed to update user status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      await approveNgo(id);
      fetchUsers();
    } catch {
      alert('Failed to approve NGO');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export filtered users to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Organization', 'Role', 'Email', 'Phone', 'City/Zone', 'Status', 'Verification', 'Registered'];
    const rows = filteredUsers.map(u => [
      u.id,
      `"${u.name || ''}"`,
      `"${u.organizationName || ''}"`,
      u.role?.replace('ROLE_', ''),
      u.email,
      u.phone || '',
      `"${u.cityZone || 'Trichy'}"`,
      u.isActive ? 'Active' : 'Inactive',
      u.role === 'ROLE_NGO' ? (u.isApproved ? 'Approved' : 'Pending Verification') : 'Verified',
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '--'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ecoshare_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters logic
  const filteredUsers = users.filter((u) => {
    // Role filter
    if (roleFilter !== 'ALL' && u.role !== `ROLE_${roleFilter}`) {
      return false;
    }
    // Status filter
    if (statusFilter === 'ACTIVE' && !u.isActive) return false;
    if (statusFilter === 'INACTIVE' && u.isActive) return false;
    if (statusFilter === 'PENDING_NGO' && (u.role !== 'ROLE_NGO' || u.isApproved)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchOrg = (u.organizationName || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchPhone = (u.phone || '').toLowerCase().includes(q);
      const matchId = String(u.id).includes(q);
      const matchZone = (u.cityZone || '').toLowerCase().includes(q);
      return matchName || matchOrg || matchEmail || matchPhone || matchId || matchZone;
    }

    return true;
  });

  // Role count metrics
  const donorCount = users.filter(u => u.role === 'ROLE_DONOR').length;
  const ngoCount = users.filter(u => u.role === 'ROLE_NGO').length;
  const pendingNgoCount = users.filter(u => u.role === 'ROLE_NGO' && !u.isApproved).length;
  const volCount = users.filter(u => u.role === 'ROLE_VOLUNTEER').length;
  const adminCount = users.filter(u => u.role === 'ROLE_ADMIN').length;

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ROLE_DONOR':
        return { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0', label: 'Donor' };
      case 'ROLE_NGO':
        return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', label: 'NGO Shelter' };
      case 'ROLE_VOLUNTEER':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Courier' };
      case 'ROLE_ADMIN':
        return { bg: '#f5f3ff', color: '#5b21b6', border: '#ddd6fe', label: 'Admin' };
      default:
        return { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1', label: role.replace('ROLE_', '') };
    }
  };

  const getAvatarInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout>
      {/* Executive Command Header */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        marginBottom: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: '#ecfdf5',
              color: '#065f46',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              border: '1px solid #a7f3d0',
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              Directory Live
            </span>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              Trichy Central Member Directory
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            User Administration & Verification
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
            Verify corporate donors, audit NGO licenses, monitor active EV couriers, and manage account statuses
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchUsers}
            className="btn btn-secondary"
            style={{ padding: '9px 16px', fontWeight: 700, fontSize: '13px' }}
            title="Refresh user list"
          >
            Refresh Roster
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-primary"
            style={{ padding: '9px 16px', fontWeight: 700, fontSize: '13px' }}
          >
            Export Directory CSV
          </button>
        </div>
      </div>

      {/* Top Operational Stats Ribbon (4 Columns on Desktop) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
      }}>
        <StatCard
          label="Total Registered"
          value={users.length}
          unit="Members"
          variant="primary"
        />
        <StatCard
          label="Corporate Donors"
          value={donorCount}
          unit="Active Hoteliers"
          variant="secondary"
        />
        <StatCard
          label="Shelters & NGOs"
          value={ngoCount}
          unit={pendingNgoCount > 0 ? `${pendingNgoCount} Pending Verification` : 'All Verified'}
          variant={pendingNgoCount > 0 ? 'accent' : 'secondary'}
        />
        <StatCard
          label="Active Fleet Couriers"
          value={volCount}
          unit="EV Ready"
          variant="primary"
        />
      </div>

      {/* Desktop Search & Command Filter Toolbar */}
      <div className="card" style={{
        padding: '18px 24px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        background: 'var(--color-surface)',
        marginBottom: 'var(--space-5)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}>
          {/* Instant Search Input */}
          <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '260px' }}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, organization, email, phone, or zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{
                paddingLeft: '38px',
                height: '42px',
                borderRadius: 'var(--radius-lg)',
                fontSize: '13px',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '14px',
                }}
              >
                &times;
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { id: 'ALL', label: 'All Users', count: users.length },
              { id: 'DONOR', label: 'Donors', count: donorCount },
              { id: 'NGO', label: 'NGO Shelters', count: ngoCount },
              { id: 'VOLUNTEER', label: 'Couriers', count: volCount },
              { id: 'ADMIN', label: 'Admins', count: adminCount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`btn ${roleFilter === tab.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  background: roleFilter === tab.id ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: roleFilter === tab.id ? '#ffffff' : '#475569',
                  borderRadius: '9999px',
                  padding: '1px 6px',
                  fontSize: '10px',
                  fontWeight: 800,
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{
                height: '40px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: 'var(--radius-lg)',
                minWidth: '150px',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="PENDING_NGO">Pending Verification ({pendingNgoCount})</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table: Desktop-First View with ZERO Content Hidden */}
      <div className="card" style={{
        padding: '24px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        background: 'var(--color-surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Ecosystem Members Directory
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Displaying {filteredUsers.length} of {users.length} registered accounts
            </p>
          </div>
          {pendingNgoCount > 0 && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
            }}>
              
              <span>{pendingNgoCount} NGO Shelter awaiting license verification</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>Search</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>No members match your criteria</div>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Try clearing the search query or changing your filter criteria.</p>
            <button
              onClick={() => { setSearchQuery(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '12px', fontWeight: 700 }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <table className="table" style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#475569', width: '70px' }}>ID</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#475569' }}>Member & Organization</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#475569' }}>Contact & Location</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#475569', width: '120px' }}>Role</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#475569', width: '190px' }}>Status & Verification</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#475569', width: '140px' }}>Registered</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#475569', width: '180px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const roleBadge = getRoleBadgeStyle(u.role);
                  const isActionLoading = actionLoadingId === u.id;

                  return (
                    <tr key={`user-row-${u.id}`} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      {/* ID */}
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0d9668', fontSize: '13px' }}>
                        #{u.id}
                      </td>

                      {/* Member & Organization */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: roleBadge.bg,
                            color: roleBadge.color,
                            border: `1px solid ${roleBadge.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '13px',
                            flexShrink: 0,
                          }}>
                            {getAvatarInitials(u.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span>{u.organizationName || 'Individual Member'}</span>
                              {u.organizationType && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  background: '#f1f5f9',
                                  borderRadius: '4px',
                                  color: '#475569',
                                  fontWeight: 700,
                                }}>
                                  {u.organizationType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Location */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#1e293b', fontWeight: 600 }}>
                          {u.email}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>Tel: {u.phone || '+91 94431 00000'}</span>
                          <span>Zone: {u.cityZone || 'Trichy'}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: roleBadge.bg,
                          color: roleBadge.color,
                          border: `1px solid ${roleBadge.border}`,
                        }}>
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Status & Verification */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: u.isActive ? '#ecfdf5' : '#fef2f2',
                            color: u.isActive ? '#065f46' : '#991b1b',
                            border: `1px solid ${u.isActive ? '#a7f3d0' : '#fecaca'}`,
                          }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: u.isActive ? '#10b981' : '#ef4444',
                            }} />
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>

                          {u.role === 'ROLE_NGO' && (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '10px',
                              fontWeight: 800,
                              background: u.isApproved ? '#eff6ff' : '#fffbeb',
                              color: u.isApproved ? '#1d4ed8' : '#b45309',
                              border: `1px solid ${u.isApproved ? '#bfdbfe' : '#fde68a'}`,
                            }}>
                              {u.isApproved ? 'License Approved' : 'Pending Audit'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Registered */}
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#475569' }}>
                        <div>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 Sep 2026'}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                          {u.lastActive || 'Active today'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {/* NGO Approval Button */}
                          {u.role === 'ROLE_NGO' && !u.isApproved && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApprove(u.id)}
                              disabled={isActionLoading}
                              style={{
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: '#059669',
                                color: '#ffffff',
                                border: 'none',
                              }}
                              title="Verify NGO legal registration and approve for surplus intake"
                            >
                              Approve
                            </button>
                          )}

                          {/* Toggle Active / Deactivate */}
                          <button
                            className={`btn ${u.isActive ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                            onClick={() => handleToggle(u.id)}
                            disabled={isActionLoading}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              minWidth: '78px',
                            }}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          {/* Inspect Profile Modal */}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedUser(u)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                            title="Inspect complete member profile"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Desktop Table Footer Statistics */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '12px',
          color: '#64748b',
        }}>
          <div>
            Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> members across <strong>Trichy</strong> district
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Active Members: <strong style={{ color: '#059669' }}>{users.filter(u => u.isActive).length}</strong></span>
            <span>Pending Audits: <strong style={{ color: '#d97706' }}>{pendingNgoCount}</strong></span>
            <span>Encrypted Token Protocol: <strong style={{ color: '#0284c7' }}>SHA-256 Enabled</strong></span>
          </div>
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedUser && (
        <div
          className="sidebar-overlay"
          onClick={() => setSelectedUser(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '600px',
              width: '100%',
              background: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-primary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                  Member #{selectedUser.id}
                </span>
                <h3 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedUser.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '14px',
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>ORGANIZATION</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {selectedUser.organizationName || 'Individual Contributor'}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SYSTEM ROLE</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0d9668', marginTop: '2px' }}>
                  {selectedUser.role.replace('ROLE_', '')}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>EMAIL ADDRESS</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px', fontFamily: 'monospace' }}>
                  {selectedUser.email}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>PHONE NUMBER</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {selectedUser.phone || '+91 94431 00000'}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>GEOGRAPHIC ZONE</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {selectedUser.cityZone || 'Tiruchirappalli, Tamil Nadu'}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>KYC VERIFICATION</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: selectedUser.isApproved ? '#059669' : '#d97706', marginTop: '2px' }}>
                  {selectedUser.isApproved ? 'VERIFIED COMPLIANT' : 'PENDING ADMINISTRATIVE AUDIT'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedUser(null)}
                style={{ padding: '8px 16px', fontWeight: 700 }}
              >
                Close
              </button>
              {selectedUser.role === 'ROLE_NGO' && !selectedUser.isApproved && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleApprove(selectedUser.id);
                    setSelectedUser(null);
                  }}
                  style={{ padding: '8px 16px', fontWeight: 800 }}
                >
                  Approve NGO License
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
