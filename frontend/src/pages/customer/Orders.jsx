import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { Badge } from '../../components/ui/Controls.jsx';
import { EmptyState, ErrorState, PageLoader, Skeleton } from '../../components/ui/States.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, formatPrice, orderStatusTone } from '../../utils/format.js';

export const OrderStatusBadge = ({ status }) => <Badge tone={orderStatusTone[status] || 'gray'}>{status}</Badge>;

export function Timeline({ order }) {
  const steps = ['Processing', 'Shipped', 'Delivered'];
  if (order.status === 'Cancelled') {
    const at = (order.statusHistory || []).find((h) => h.status === 'Cancelled');
    return <p className="notice notice-warn"><Icon name="x-circle" size={18} /> This order was cancelled{at ? ` on ${formatDate(at.at)}` : ''}.</p>;
  }
  const reached = steps.indexOf(order.status);
  return (
    <ol className="timeline" aria-label="Order progress">
      {steps.map((s, i) => {
        const at = (order.statusHistory || []).find((h) => h.status === s);
        return (
          <li key={s} className={i <= reached ? 'is-done' : ''}>
            <span className="timeline-dot">{i <= reached ? <Icon name="check" size={13} /> : null}</span>
            <strong>{s}</strong>
            <small>{at ? formatDate(at.at) : 'Pending'}</small>
          </li>
        );
      })}
    </ol>
  );
}

/** Items, totals and addresses - shared by the confirmation page, order details and order tracking. */
export function OrderBody({ order }) {
  return (
    <div className="order-body">
      <section className="panel">
        <h2>Items</h2>
        <ul className="order-items">
          {order.items.map((i) => (
            <li key={`${i.product}-${i.name}`}>
              <img src={i.image || '/assets/images/placeholder.svg'} alt="" />
              <div><strong>{i.name}</strong><small>{i.brand} &middot; Qty {i.quantity}</small></div>
              <span>{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="summary-rows">
          <div><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <div><dt>Shipping</dt><dd>{order.shippingFee ? formatPrice(order.shippingFee) : 'Free'}</dd></div>
          {order.discount > 0 && <div className="is-discount"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</dt><dd>- {formatPrice(order.discount)}</dd></div>}
          <div className="summary-total"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </section>
      <section className="panel">
        <h2>Delivery &amp; payment</h2>
        <address className="order-address">
          <strong>{order.shipping.fullName}</strong><br />
          {order.shipping.address}<br />
          {order.shipping.city}{order.shipping.postalCode ? `, ${order.shipping.postalCode}` : ''}<br />
          {order.shipping.phone}<br />{order.shipping.email}
        </address>
        <p className="order-pay"><Icon name="card" size={16} /> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online payment'} &middot; <Badge tone={order.paymentStatus === 'Paid' ? 'green' : 'amber'}>{order.paymentStatus}</Badge></p>
        <p className="muted small">Placed on {formatDate(order.createdAt, true)}</p>
      </section>
    </div>
  );
}

export default function Orders() {
  useTitle('My Orders');
  const { data, loading, error, reload } = useFetch(() => api.get('/orders/mine'), []);
  return (
    <div className="container section">
      <h1 className="page-title">My Orders</h1>
      {error ? <ErrorState error={error} onRetry={reload} /> : loading ? (
        <div className="stack">{[1, 2, 3].map((i) => <Skeleton key={i} height={88} radius={18} />)}</div>
      ) : data.orders.length === 0 ? (
        <EmptyState pet="cat" title="No orders yet" text="When you place an order it will show up here." action={<Link to="/shop" className="btn btn-primary">Start shopping</Link>} />
      ) : (
        <ul className="order-list">
          {data.orders.map((o) => (
            <li key={o._id}>
              <Link to={`/orders/${o._id}`} className="order-row">
                <div><strong>#{o.orderNumber}</strong><small>{formatDate(o.createdAt)}</small></div>
                <div className="order-row-items">{o.items.slice(0, 3).map((i) => <img key={i.name} src={i.image || '/assets/images/placeholder.svg'} alt="" />)}{o.items.length > 3 && <span>+{o.items.length - 3}</span>}</div>
                <OrderStatusBadge status={o.status} />
                <strong className="order-row-total">{formatPrice(o.total)}</strong>
                <Icon name="chevron-right" size={18} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => api.get(`/orders/${id}`), [id]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  useTitle('Order details');

  if (loading) return <PageLoader label="Loading order..." />;
  if (error) return <div className="container section"><ErrorState error={error} onRetry={error.status === 404 ? null : reload} title={error.status === 404 ? 'Order not found' : undefined} /><p className="center"><Link to="/orders" className="btn btn-primary">Back to orders</Link></p></div>;
  const { order, paymentInstructions } = data;

  const cancel = async () => {
    setBusy(true);
    try {
      await api.patch(`/orders/${order._id}/cancel`);
      toast.success('Your order was cancelled.');
      setConfirm(false);
      reload();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="container section order-detail">
      <Link to="/orders" className="back-link"><Icon name="arrow-left" size={16} /> All orders</Link>
      <div className="order-head">
        <h1 className="page-title">Order #{order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <Timeline order={order} />
      {order.paymentMethod === 'online' && order.paymentStatus === 'Pending' && order.status !== 'Cancelled' && paymentInstructions && (
        <div className="notice notice-info"><Icon name="info" size={18} /><div><strong>Payment pending</strong><p>{paymentInstructions}</p></div></div>
      )}
      <OrderBody order={order} />
      {order.status === 'Processing' && <button type="button" className="btn btn-outline btn-danger-outline" onClick={() => setConfirm(true)}>Cancel order</button>}
      <ConfirmDialog open={confirm} title="Cancel this order?" message="Items go back into stock and the order can't be re-opened." confirmLabel="Yes, cancel order" busy={busy} onConfirm={cancel} onClose={() => setConfirm(false)} />
    </div>
  );
}
