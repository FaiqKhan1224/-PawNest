import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { Field } from '../../components/ui/Controls.jsx';
import { Skeleton } from '../../components/ui/States.jsx';
import { OrderSummary } from './Cart.jsx';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useTitle from '../../hooks/useTitle.js';
import { formatPrice, imageOf } from '../../utils/format.js';

const emptyForm = { fullName: '', phone: '', email: '', address: '', city: '', postalCode: '' };

function validate(f) {
  const e = {};
  if (f.fullName.trim().length < 2) e.fullName = 'Please enter your full name.';
  if (f.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number, e.g. +92 300 1234567.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address.';
  if (f.address.trim().length < 6) e.address = 'Please enter your full delivery address.';
  if (f.city.trim().length < 2) e.city = 'Please enter your city.';
  return e;
}

export default function Checkout() {
  useTitle('Checkout');
  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [payment, setPayment] = useState('cod');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        fullName: f.fullName || user.name || '',
        phone: f.phone || user.phone || '',
        email: f.email || user.email || '',
        address: f.address || (user.address && user.address.line1) || '',
        city: f.city || (user.address && user.address.city) || '',
        postalCode: f.postalCode || (user.address && user.address.postalCode) || '',
      }));
    }
  }, [user]);

  const formValid = useMemo(() => Object.keys(validate(form)).length === 0, [form]);
  const step = formValid ? 2 : 1;

  if (!cart.items.length && !busy) return <Navigate to="/cart" replace />;

  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); if (errors[key]) setErrors({ ...errors, [key]: undefined }); };

  const place = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) { toast.error('Please check your delivery details.'); document.querySelector('.has-error input')?.focus(); return; }
    if (!cart.quote || cart.quote.hasIssues) { toast.error('Please fix the items in your cart first.'); navigate('/cart'); return; }
    setBusy(true);
    try {
      const data = await api.post('/orders', { items: cart.items, coupon: cart.coupon, shipping: form, paymentMethod: payment, notes });
      sessionStorage.setItem('pawnest_last_order', JSON.stringify({ orderNumber: data.order.orderNumber, email: form.email }));
      cart.clear();
      navigate(`/order-confirmation/${data.order.orderNumber}`, { replace: true, state: data });
    } catch (err) {
      toast.error(err.message);
      if (err.status === 409) navigate('/cart');
    } finally {
      setBusy(false);
    }
  };

  const quote = cart.quote;

  return (
    <div className="checkout container">
      <h1 className="page-title">Checkout</h1>
      <ol className="steps" aria-label="Checkout progress">
        <li className={step >= 1 ? 'is-on' : ''}><span>1</span> Shipping</li>
        <li className={step >= 2 ? 'is-on' : ''}><span>2</span> Payment</li>
        <li><span>3</span> Confirmation</li>
      </ol>

      <form className="checkout-grid" onSubmit={place} noValidate>
        <div className="checkout-main">
          <section className="panel">
            <h2>Shipping Address</h2>
            {!user && <p className="muted small">Have an account? <Link to="/login?next=/checkout">Sign in</Link> to fill this in faster and track your orders.</p>}
            <div className="form-grid">
              <Field label="Full Name" htmlFor="co-name" error={errors.fullName}><input id="co-name" className="input" value={form.fullName} onChange={set('fullName')} autoComplete="name" placeholder="Ali Khan" /></Field>
              <Field label="Phone Number" htmlFor="co-phone" error={errors.phone}><input id="co-phone" className="input" value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" placeholder="+92 300 1234567" /></Field>
              <Field label="Email" htmlFor="co-email" error={errors.email} className="span-2"><input id="co-email" type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" placeholder="ali@gmail.com" /></Field>
              <Field label="Address" htmlFor="co-address" error={errors.address} className="span-2"><input id="co-address" className="input" value={form.address} onChange={set('address')} autoComplete="street-address" placeholder="House 123, Street 4, Model Town" /></Field>
              <Field label="City" htmlFor="co-city" error={errors.city}><input id="co-city" className="input" value={form.city} onChange={set('city')} autoComplete="address-level2" placeholder="Lahore" /></Field>
              <Field label="Postal Code" htmlFor="co-zip" error={errors.postalCode}><input id="co-zip" className="input" value={form.postalCode} onChange={set('postalCode')} autoComplete="postal-code" inputMode="numeric" placeholder="54000" /></Field>
            </div>
            <Field label="Order notes (optional)" htmlFor="co-notes"><textarea id="co-notes" className="textarea" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery instructions, gate code, best time..." /></Field>
          </section>

          <section className="panel">
            <h2>Payment Method</h2>
            <div className="pay-options" role="radiogroup" aria-label="Payment method">
              <label className={`pay-option ${payment === 'cod' ? 'is-on' : ''}`}>
                <input type="radio" name="payment" value="cod" checked={payment === 'cod'} onChange={() => setPayment('cod')} />
                <span className="pay-dot" aria-hidden="true" />
                <span><strong>Cash on Delivery</strong><small>Pay in cash when your order arrives.</small></span>
              </label>
              <label className={`pay-option ${payment === 'online' ? 'is-on' : ''}`}>
                <input type="radio" name="payment" value="online" checked={payment === 'online'} onChange={() => setPayment('online')} />
                <span className="pay-dot" aria-hidden="true" />
                <span><strong>Online Payment (Card / JazzCash / Easypaisa)</strong><small>You&apos;ll get the payment details right after placing your order.</small></span>
              </label>
            </div>
          </section>
        </div>

        <aside className="checkout-side">
          {!quote ? <Skeleton height={320} radius={20} /> : (
            <OrderSummary quote={quote} showCoupon>
              <ul className="mini-items">
                {quote.lines.map((l) => l.product && (
                  <li key={l.productId}><img src={imageOf(l.product)} alt="" /><span>{l.product.name}<small>Qty {l.quantity}</small></span><strong>{formatPrice(l.lineTotal)}</strong></li>
                ))}
              </ul>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy || cart.loading || quote.hasIssues}>{busy ? 'Placing order...' : 'Place Order'}</button>
              <p className="secure-note"><Icon name="lock" size={14} /> Your details are sent securely.</p>
            </OrderSummary>
          )}
        </aside>
      </form>
    </div>
  );
}
