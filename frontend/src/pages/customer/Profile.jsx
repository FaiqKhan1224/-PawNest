import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Field } from '../../components/ui/Controls.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { api } from '../../services/api.js';
import useTitle from '../../hooks/useTitle.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function Profile() {
  useTitle('Account settings');
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', line1: (user.address && user.address.line1) || '', city: (user.address && user.address.city) || '', postalCode: (user.address && user.address.postalCode) || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [busy, setBusy] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api.put('/auth/me', { name: form.name, phone: form.phone, address: { line1: form.line1, city: form.city, postalCode: form.postalCode } });
      setUser(data.user);
      toast.success('Profile updated.');
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pw.newPassword.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (pw.newPassword !== pw.confirm) { setPwError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await api.put('/auth/me/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed.');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { setPwError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="container section profile">
      <Link to="/dashboard" className="back-link"><Icon name="arrow-left" size={16} /> Dashboard</Link>
      <h1 className="page-title">Account settings</h1>
      <div className="profile-grid">
        <form className="panel" onSubmit={saveProfile}>
          <h2>Your details</h2>
          <Field label="Email" htmlFor="pf-email" help="Your email is your login and can't be changed here."><input id="pf-email" className="input" value={user.email} disabled /></Field>
          <Field label="Full name" htmlFor="pf-name"><input id="pf-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Phone" htmlFor="pf-phone"><input id="pf-phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Default address" htmlFor="pf-addr"><input id="pf-addr" className="input" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /></Field>
          <div className="form-grid">
            <Field label="City" htmlFor="pf-city"><input id="pf-city" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Postal code" htmlFor="pf-zip"><input id="pf-zip" className="input" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></Field>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>Save changes</button>
        </form>
        <form className="panel" onSubmit={savePassword}>
          <h2>Change password</h2>
          <Field label="Current password" htmlFor="pw-cur"><input id="pw-cur" type="password" className="input" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="New password" htmlFor="pw-new"><input id="pw-new" type="password" className="input" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          <Field label="Confirm new password" htmlFor="pw-con" error={pwError}><input id="pw-con" type="password" className="input" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
          <button type="submit" className="btn btn-outline" disabled={busy}>Update password</button>
        </form>
      </div>
    </div>
  );
}
