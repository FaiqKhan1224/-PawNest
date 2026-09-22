import { Link, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar.jsx';
import Footer from '../components/common/Footer.jsx';
import BottomNav from '../components/common/BottomNav.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function CustomerLayout() {
  const { pathname } = useLocation();
  const { settings } = useSettings();
  return (
    <div className="site">
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main" className="site-main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      {settings.aiEnabled && pathname !== '/pawai' && (
        <Link to="/pawai" className="pawai-fab" aria-label="Chat with PawAI">
          <Icon name="message" size={22} /><span>Ask PawAI</span>
        </Link>
      )}
    </div>
  );
}
