import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import Logo from '../ui/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop', match: (l) => l.pathname === '/shop' && !l.search },
  { to: '/shop?animal=dogs', label: 'Dogs', match: (l) => l.pathname === '/shop' && /animal=dogs(&|$)/.test(l.search) },
  { to: '/shop?animal=cats', label: 'Cats', match: (l) => l.pathname === '/shop' && /animal=cats(&|$)/.test(l.search) },
  { to: '/shop?animal=birds,rabbits,fish,small-pets', label: 'Other Pets', match: (l) => l.pathname === '/shop' && /animal=birds/.test(l.search) },
  { to: '/shop?category=accessories', label: 'Accessories', match: (l) => l.pathname === '/shop' && /category=accessories/.test(l.search) },
  { to: '/pawai', label: 'PawAI', match: (l) => l.pathname === '/pawai' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const menuRef = useRef(null);

  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [location.pathname, location.search]);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
    setQ('');
  };

  const isActive = (link) => (link.match ? link.match(location) : location.pathname === link.to);

  return (
    <header className="nav" role="banner">
      <div className="nav-inner container">
        <Logo />
        <nav className="nav-links" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.label} to={l.to} end={l.end} className={() => `nav-link ${isActive(l) ? 'is-active' : ''}`}>{l.label}</NavLink>
          ))}
        </nav>

        <form className="nav-search" onSubmit={submit} role="search">
          <Icon name="search" size={18} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for pet products..." aria-label="Search products" />
        </form>

        <div className="nav-actions">
          <button type="button" className="nav-icon nav-search-toggle" onClick={() => setSearchOpen((v) => !v)} aria-label="Search" aria-expanded={searchOpen}><Icon name="search" size={22} /></button>
          <Link to="/wishlist" className="nav-icon" aria-label={`Wishlist, ${wishlist.count} items`}>
            <Icon name="heart" size={22} />
            {wishlist.count > 0 && <span className="nav-badge">{wishlist.count}</span>}
          </Link>
          <Link to="/cart" className="nav-icon" aria-label={`Cart, ${count} items`}>
            <Icon name="cart" size={22} />
            {count > 0 && <span className="nav-badge">{count}</span>}
          </Link>
          {user ? (
            <div className="nav-user" ref={menuRef}>
              <button type="button" className="nav-avatar" onClick={() => setMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Account menu">
                {user.name.charAt(0).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="nav-menu" role="menu">
                  <p className="nav-menu-name">{user.name}<span>{user.email}</span></p>
                  <Link role="menuitem" to="/dashboard"><Icon name="user" size={16} /> My Dashboard</Link>
                  <Link role="menuitem" to="/orders"><Icon name="package" size={16} /> My Orders</Link>
                  <Link role="menuitem" to="/wishlist"><Icon name="heart" size={16} /> Wishlist</Link>
                  <Link role="menuitem" to="/profile"><Icon name="settings" size={16} /> Account Settings</Link>
                  {user.role === 'admin' && <Link role="menuitem" to="/admin"><Icon name="grid" size={16} /> Admin Panel</Link>}
                  <button type="button" role="menuitem" onClick={() => { logout(); navigate('/'); }}><Icon name="logout" size={16} /> Log out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm nav-signin">Sign in</Link>
          )}
        </div>
      </div>
      {searchOpen && (
        <form className="nav-search-mobile" onSubmit={submit} role="search">
          <Icon name="search" size={18} />
          <input type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for pet products..." aria-label="Search products" />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
      )}
    </header>
  );
}
