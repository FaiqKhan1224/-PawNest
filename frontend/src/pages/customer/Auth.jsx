import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import PetIcon, { PetTrio } from '../../components/ui/PetIcon.jsx';
import { Field } from '../../components/ui/Controls.jsx';
import useTitle from '../../hooks/useTitle.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth container">
      <div className="auth-card">
        <div className="auth-art" aria-hidden="true">
          <PetIcon name="paw" size={46} color="#f0287f" />
          <PetTrio size={30} />
        </div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
        <p className="auth-foot">{footer}</p>
      </div>
    </div>
  );
}

const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/admin') ? next : '/dashboard');

export function Login() {
  useTitle('Sign in');
  const { user, login } = useAuth();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const next = safeNext(sp.get('next'));

  if (user) return <Navigate to={user.role === 'admin' && !sp.get('next') ? '/admin' : next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Enter your email and password.'); return; }
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(u.role === 'admin' && !sp.get('next') ? '/admin' : next, { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to track orders, save pets and check out faster." footer={<>New to PawNest? <Link to={`/register${sp.get('next') ? `?next=${encodeURIComponent(sp.get('next'))}` : ''}`}>Create an account</Link></>}>
      <form onSubmit={submit} noValidate>
        <Field label="Email" htmlFor="li-email"><input id="li-email" type="email" className="input" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ali@gmail.com" /></Field>
        <Field label="Password" htmlFor="li-pass" error={error}>
          <div className="input-group">
            <input id="li-pass" type={show ? 'text' : 'password'} className="input" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password" />
            <button type="button" className="input-addon" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}><Icon name={show ? 'eye-off' : 'eye'} size={18} /></button>
          </div>
        </Field>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
      {import.meta.env.DEV && <p className="demo-hint">Demo customer: ali@gmail.com / User@1234</p>}
    </AuthShell>
  );
}

export function Register() {
  useTitle('Create account');
  const { user, register } = useAuth();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const next = safeNext(sp.get('next'));

  if (user) return <Navigate to={next} replace />;
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 2) found.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) found.email = 'Enter a valid email address.';
    if (form.password.length < 6) found.password = 'Password must be at least 6 characters.';
    if (form.confirm !== form.password) found.confirm = 'Passwords do not match.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      toast.success('Your account is ready. Welcome to PawNest!');
      navigate(next, { replace: true });
    } catch (err) { setErrors({ email: err.message }); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join PawNest for faster checkout, order tracking and PawAI advice for your pets." footer={<>Already have an account? <Link to="/login">Sign in</Link></>}>
      <form onSubmit={submit} noValidate>
        <Field label="Full name" htmlFor="rg-name" error={errors.name}><input id="rg-name" className="input" autoComplete="name" value={form.name} onChange={set('name')} placeholder="Ali Khan" /></Field>
        <Field label="Email" htmlFor="rg-email" error={errors.email}><input id="rg-email" type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} placeholder="ali@gmail.com" /></Field>
        <Field label="Phone (optional)" htmlFor="rg-phone"><input id="rg-phone" className="input" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+92 300 1234567" /></Field>
        <Field label="Password" htmlFor="rg-pass" error={errors.password}><input id="rg-pass" type="password" className="input" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" /></Field>
        <Field label="Confirm password" htmlFor="rg-confirm" error={errors.confirm}><input id="rg-confirm" type="password" className="input" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} /></Field>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
