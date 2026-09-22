import { NavLink, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function BottomNav() {
  const { count } = useCart();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const items = [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/shop', label: 'Shop', icon: 'grid' },
    { to: '/pawai', label: 'PawAI', icon: 'message', highlight: true },
    { to: '/cart', label: 'Cart', icon: 'cart', badge: count },
    { to: user ? '/dashboard' : '/login', label: user ? 'Account' : 'Sign in', icon: 'user', active: ['/dashboard', '/login', '/register', '/profile', '/orders'] },
  ];
  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      {items.map((i) => {
        const forced = i.active ? i.active.some((p) => pathname.startsWith(p)) : undefined;
        return (
          <NavLink key={i.label} to={i.to} end={i.end} className={({ isActive }) => `bn-item ${(forced !== undefined ? forced : isActive) ? 'is-active' : ''} ${i.highlight ? 'is-hl' : ''}`}>
            <span className="bn-icon"><Icon name={i.icon} size={22} />{i.badge > 0 && <span className="nav-badge">{i.badge}</span>}</span>
            <span className="bn-label">{i.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
