import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import LiveCityTicker from './LiveCityTicker';
import LiveDispatchRadarModal from './LiveDispatchRadarModal';

export default function DashboardLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [radarModalOpen, setRadarModalOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="app-layout">
      <Navbar onToggleMobileMenu={toggleMobileMenu} isMobileMenuOpen={mobileMenuOpen} />
      <LiveCityTicker onTriggerRadar={() => setRadarModalOpen(true)} />
      <Sidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={closeMobileMenu}></div>
      )}
      <main className="app-main">
        <div className="page-content">
          {children}
        </div>
      </main>

      <LiveDispatchRadarModal
        isOpen={radarModalOpen}
        onClose={() => setRadarModalOpen(false)}
        onAcceptTask={(task) => {
          alert(`Task #${task.id} (${task.foodName}) accepted! Initializing live GPS telemetry.`);
        }}
      />
    </div>
  );
}
