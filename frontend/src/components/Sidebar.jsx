import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const donorLinks = [
  { to: '/donor', label: 'Dashboard', icon: 'grid' },
  { to: '/donor/create', label: 'Create Donation', icon: 'plus' },
  { to: '/donor/history', label: 'My Donations', icon: 'list' },
];

const ngoLinks = [
  { to: '/ngo', label: 'Dashboard', icon: 'grid' },
  { to: '/ngo/incoming', label: 'Incoming Requests', icon: 'inbox' },
  { to: '/ngo/assign', label: 'Assign Volunteer', icon: 'users' },
  { to: '/admin/mission-control', label: 'City Radar & Fleet', icon: 'radar' },
];

const volunteerLinks = [
  { to: '/volunteer', label: 'Dashboard', icon: 'grid' },
  { to: '/volunteer/active', label: 'Active Pickups', icon: 'truck' },
  { to: '/volunteer/deliver', label: 'Delivery', icon: 'check' },
  { to: '/admin/mission-control', label: 'City Radar & Fleet', icon: 'radar' },
];

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: 'grid' },
  { to: '/admin/users', label: 'User Management', icon: 'users' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/admin/reports', label: 'Reports', icon: 'file' },
  { to: '/admin/mission-control', label: 'Mission Control Radar', icon: 'radar' },
];

function SvgIcon({ name }) {
  const icons = {
    radar: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="12"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    truck: <><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  };

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getLinks = () => {
    switch (user?.role) {
      case 'ROLE_DONOR': return donorLinks;
      case 'ROLE_NGO': return ngoLinks;
      case 'ROLE_VOLUNTEER': return volunteerLinks;
      case 'ROLE_ADMIN': return adminLinks;
      default: return [];
    }
  };

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <h2>EcoShare AI</h2>
        <span>Food Waste Prevention</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Navigation</div>
          {getLinks().map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/donor' || link.to === '/ngo' || link.to === '/volunteer' || link.to === '/admin'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <SvgIcon name={link.icon} />
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={handleLogout}>
          <SvgIcon name="logout" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
