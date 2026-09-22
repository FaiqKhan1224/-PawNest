import { useState } from 'react';
import { Field } from '../../components/ui/Controls.jsx';
import { OrderBody, OrderStatusBadge, Timeline } from './Orders.jsx';
import { api } from '../../services/api.js';
import useTitle from '../../hooks/useTitle.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function TrackOrder() {
  useTitle('Track order');
  const { user } = useAuth();
  const [form, setForm] = useState({ orderNumber: '', email: user ? user.email : '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setBusy(true);
    try {
      setResult(await api.post('/orders/track', form));
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="container section track">
      <h1 className="page-title">Track your order</h1>
      <form className="panel track-form" onSubmit={submit} noValidate>
        <Field label="Order number" htmlFor="tr-num"><input id="tr-num" className="input" inputMode="numeric" placeholder="e.g. 1005" value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} /></Field>
        <Field label="Email used at checkout" htmlFor="tr-email" error={error}><input id="tr-email" type="email" className="input" placeholder="ali@gmail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Looking...' : 'Track order'}</button>
      </form>
      {result && (
        <div className="track-result">
          <div className="order-head"><h2>Order #{result.order.orderNumber}</h2><OrderStatusBadge status={result.order.status} /></div>
          <Timeline order={result.order} />
          <OrderBody order={result.order} />
        </div>
      )}
    </div>
  );
}
