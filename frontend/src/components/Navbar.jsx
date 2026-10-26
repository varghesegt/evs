import { useAuth } from '../context/AuthContext';

export default function Navbar({ onToggleMobileMenu, isMobileMenuOpen }) {
  const { user, getRoleLabel } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle Navigation Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
        <div className="navbar-brand hide-desktop">EcoShare AI</div>
      </div>
      <div className="navbar-user">
        <div className="navbar-user-info">
          <div className="navbar-user-name">{user?.name}</div>
          <div className="navbar-user-role">{getRoleLabel()}</div>
        </div>
        <div className="navbar-avatar">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
