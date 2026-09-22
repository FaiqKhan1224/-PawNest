import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import Logo from '../components/ui/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/admin/products', label: 'Products', icon: 'box' },
  { to: '/admin/categories', label: 'Categories', icon: 'layers' },
  { to: '/admin/orders', label: 'Orders', icon: 'package' },
  { to: '/admin/customers', label: 'Customers', icon: 'users' },
  { to: '/admin/reviews', label: 'Reviews', icon: 'star' },
  { to: '/admin/coupons', label: 'Coupons', icon: 'tag' },
  { to: '/admin/inventory', label: 'Inventory', icon: 'archive' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/admin/ai', label: 'AI Management', icon: 'cpu' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [location.pathname]);

  const current = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));

  return (
    <div className="admin">
      <a href="#admin-main" className="skip-link">Skip to content</a>
      {open && <div className="admin-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside className={`admin-side ${open ? 'is-open' : ''}`} aria-label="Admin navigation">
        <div className="admin-side-top">
          <Logo variant="admin" />
          <button type="button" className="icon-btn admin-side-close" onClick={() => setOpen(false)} aria-label="Close menu"><Icon name="x" size={20} /></button>
        </div>
        <span className="admin-role-chip">ADMIN PANEL</span>
        <nav className="admin-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `admin-nav-item ${isActive ? 'is-active' : ''}`}>
              <Icon name={n.icon} size={18} /><span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-side-foot">
          <Link to="/" className="admin-nav-item"><Icon name="external" size={18} /><span>View store</span></Link>
          <button type="button" className="admin-nav-item" onClick={() => { logout(); navigate('/admin/login'); }}><Icon name="logout" size={18} /><span>Logout</span></button>
        </div>
      </aside>

      <div className="admin-body">
        <header className="admin-top">
          <button type="button" className="icon-btn admin-burger" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" size={22} /></button>
          <div className="admin-top-title">
            <span className="admin-badge">ADMIN</span>
            <span className="admin-crumb">{current ? current.label : 'Admin'}</span>
          </div>
          <div className="admin-top-right">
            <Link to="/" className="btn btn-outline btn-sm admin-view-store"><Icon name="external" size={15} /> View store</Link>
            <div className="admin-user">
              <span className="admin-avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="admin-user-text"><strong>{user.name}</strong><small>Administrator</small></span>
            </div>
          </div>
        </header>
        <main id="admin-main" className="admin-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
