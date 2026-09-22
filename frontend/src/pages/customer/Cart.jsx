import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { QtyStepper } from '../../components/ui/Controls.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { useCart } from '../../context/CartContext.jsx';
import useTitle from '../../hooks/useTitle.js';
import { formatPrice, imageOf } from '../../utils/format.js';

export function OrderSummary({ quote, children, showCoupon = false }) {
  const cart = useCart();
  const [code, setCode] = useState('');
  const coupon = quote && quote.coupon;
  const applyCode = () => { if (code.trim()) { cart.setCoupon(code); setCode(''); } };
  return (
    <div className="summary">
      <h2>Order Summary</h2>
      <dl className="summary-rows">
        <div><dt>Subtotal</dt><dd>{formatPrice(quote.subtotal)}</dd></div>
        <div><dt>Shipping</dt><dd>{quote.shipping === 0 ? <span className="free">Free</span> : formatPrice(quote.shipping)}</dd></div>
        <div className={quote.discount > 0 ? 'is-discount' : ''}><dt>Discount</dt><dd>{quote.discount > 0 ? `- ${formatPrice(quote.discount)}` : formatPrice(0)}</dd></div>
        <div className="summary-total"><dt>Total</dt><dd>{formatPrice(quote.total)}</dd></div>
      </dl>
      {quote.freeShippingThreshold > 0 && quote.subtotal > 0 && quote.subtotal < quote.freeShippingThreshold && (
        <p className="summary-hint"><Icon name="truck" size={15} /> Add {formatPrice(quote.freeShippingThreshold - quote.subtotal)} more for free shipping</p>
      )}
      {showCoupon && (
        <div className="coupon">
          {cart.coupon && coupon && coupon.valid ? (
            <p className="coupon-applied"><Icon name="tag" size={16} /> <strong>{cart.coupon}</strong> applied <button type="button" className="link-btn" onClick={() => cart.setCoupon('')}>Remove</button></p>
          ) : (
            <div className="coupon-form">
              <label className="sr-only" htmlFor="coupon-code">Coupon code</label>
              <input id="coupon-code" className="input" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCode(); } }} maxLength={20} />
              <button type="button" className="btn btn-soft btn-sm" onClick={applyCode}>Apply</button>
            </div>
          )}
          {cart.coupon && coupon && !coupon.valid && (
            <p className="field-error" role="alert">{coupon.message} <button type="button" className="link-btn" onClick={() => cart.setCoupon('')}>Remove</button></p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export default function Cart() {
  useTitle('Your Cart');
  const cart = useCart();
  const navigate = useNavigate();
  const { quote, loading, error, items } = cart;

  if (!items.length) {
    return (
      <div className="container section">
        <EmptyState pet="dog" title="Your cart is empty" text="Add some tasty food or a cosy accessory to get started." action={<Link to="/shop" className="btn btn-primary">Start shopping</Link>} />
      </div>
    );
  }

  return (
    <div className="cart container">
      <h1 className="page-title">Shopping Cart <span className="muted">({cart.count} item{cart.count === 1 ? '' : 's'})</span></h1>
      {error && !quote ? <ErrorState error={{ message: error }} title="We couldn't price your cart" onRetry={() => cart.setCoupon(cart.coupon)} /> : (
        <div className="cart-grid">
          <ul className="cart-items">
            {!quote ? items.map((i) => <li key={i.productId} className="cart-item"><Skeleton height={96} radius={16} /></li>) : quote.lines.map((line) => (
              <li key={line.productId} className={`cart-item ${line.issue ? 'has-issue' : ''}`}>
                <div className="cart-thumb">{line.product ? <img src={imageOf(line.product)} alt="" /> : <Icon name="alert" size={28} />}</div>
                <div className="cart-info">
                  {line.product ? <Link to={`/product/${line.product.slug}`} className="cart-name">{line.product.name}</Link> : <span className="cart-name">Unavailable product</span>}
                  {line.product && <span className="cart-brand">{line.product.brand}</span>}
                  {line.issue ? <p className="cart-issue"><Icon name="alert" size={14} /> {line.issue}</p> : <p className="cart-unit">{formatPrice(line.unitPrice)} each</p>}
                </div>
                <div className="cart-qty">
                  {line.product && !line.product.priceHidden && line.maxQuantity > 0 ? (
                    <QtyStepper value={line.quantity} max={line.maxQuantity} size="sm" onChange={(n) => cart.setQty(line.productId, n)} />
                  ) : null}
                </div>
                <div className="cart-line-total">{line.issue ? '-' : formatPrice(line.lineTotal)}</div>
                <button type="button" className="icon-btn cart-remove" onClick={() => cart.remove(line.productId)} aria-label={`Remove ${line.product ? line.product.name : 'item'} from cart`}><Icon name="trash" size={18} /></button>
              </li>
            ))}
          </ul>

          {quote ? (
            <OrderSummary quote={quote} showCoupon>
              {quote.hasIssues && <p className="notice notice-warn"><Icon name="alert" size={16} /> Please fix the highlighted items to continue.</p>}
              <button type="button" className="btn btn-primary btn-lg btn-block" disabled={quote.hasIssues || quote.subtotal <= 0 || loading} onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
              <Link to="/shop" className="continue"><Icon name="arrow-left" size={16} /> Continue Shopping</Link>
            </OrderSummary>
          ) : <Skeleton height={300} radius={20} />}
        </div>
      )}
    </div>
  );
}
