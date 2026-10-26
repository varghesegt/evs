import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="app-layout">
      <Navbar onToggleMobileMenu={toggleMobileMenu} isMobileMenuOpen={mobileMenuOpen} />
      <Sidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={closeMobileMenu}></div>
      )}
      <main className="app-main">
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
