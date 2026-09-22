import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import Logo from '../ui/Logo.jsx';
import { PetTrio } from '../ui/PetIcon.jsx';
import { api } from '../../services/api.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const TRUST = [
  { icon: 'gift', title: 'Premium', text: 'Products' },
  { icon: 'truck', title: 'Fast', text: 'Delivery' },
  { icon: 'lock', title: 'Secure', text: 'Payment' },
  { icon: 'headphones', title: '24/7', text: 'Support' },
];

export default function Footer() {
  const { settings } = useSettings();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api.post('/newsletter', { email });
      toast.success(data.message);
      setEmail('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const social = [
    ['facebook', 'Facebook'], ['instagram', 'Instagram'], ['twitter', 'Twitter'], ['youtube', 'YouTube'],
  ].filter(([key]) => settings.social && settings.social[key]);

  return (
    <footer className="footer">
      <div className="trust container" aria-label="Why PawNest">
        <ul className="trust-list">
          {TRUST.map((t) => (
            <li key={t.title}>
              <span className="trust-icon"><Icon name={t.icon} size={22} /></span>
              <span><strong>{t.title}</strong><br />{t.text}</span>
            </li>
          ))}
        </ul>
        <p className="trust-script">Because they&apos;re family <Icon name="heart" size={18} className="trust-heart" /></p>
      </div>

      <div className="footer-main container">
        <div className="footer-brand">
          <Logo showTagline />
          <PetTrio />
        </div>
        <nav className="footer-col" aria-label="Quick links">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <nav className="footer-col" aria-label="Customer service">
          <h3>Customer Service</h3>
          <Link to="/shipping-policy">Shipping Policy</Link>
          <Link to="/return-policy">Return Policy</Link>
          <Link to="/faqs">FAQs</Link>
          <Link to="/track-order">Track Order</Link>
        </nav>
        <div className="footer-col">
          <h3>Follow Us</h3>
          {social.length > 0 ? (
            <div className="social">
              {social.map(([key, label]) => (
                <a key={key} href={settings.social[key]} target="_blank" rel="noopener noreferrer" aria-label={label}><Icon name={key} size={18} /></a>
              ))}
            </div>
          ) : <p className="muted small">Social links can be added in Admin &gt; Settings.</p>}
          <h3 className="footer-sub">Subscribe to our newsletter</h3>
          <form className="newsletter" onSubmit={subscribe}>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" aria-label="Email address" />
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? '...' : 'Subscribe'}</button>
          </form>
        </div>
      </div>
      <p className="footer-copy">&copy; {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
    </footer>
  );
}
