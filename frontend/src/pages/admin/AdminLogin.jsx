import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import Logo from '../../components/ui/Logo.jsx';
import { Field } from '../../components/ui/Controls.jsx';
import { setToken } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useTitle from '../../hooks/useTitle.js';

export default function AdminLogin() {
  useTitle('Admin sign in');
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && user.role === 'admin') return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      if (u.role !== 'admin') {
        setToken(null);
        logout();
        setError('This account does not have admin access. Use the customer sign in instead.');
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="admin admin-login">
      <div className="admin-login-card">
        <Logo variant="admin" />
        <span className="admin-role-chip">ADMIN PANEL</span>
        <h1>Sign in to manage PawNest</h1>
        <p className="muted">Products, orders, customers, reviews and settings.</p>
        <form onSubmit={submit} noValidate>
          <Field label="Admin email" htmlFor="ad-email"><input id="ad-email" type="email" className="input" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@pawnest.com" /></Field>
          <Field label="Password" htmlFor="ad-pass" error={error}><input id="ad-pass" type="password" className="input" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}><Icon name="lock" size={16} /> {busy ? 'Signing in...' : 'Sign in'}</button>
        </form>
        {import.meta.env.DEV && <p className="demo-hint">Demo admin: admin@pawnest.com / Admin@123</p>}
        <Link to="/" className="back-link"><Icon name="arrow-left" size={15} /> Back to the store</Link>
      </div>
    </div>
  );
}
