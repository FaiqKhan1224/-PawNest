import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { Badge, Pagination } from '../../components/ui/Controls.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { Card, PageHeader, SearchBox, Tabs, TableWrap } from '../../components/admin/AdminUI.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, formatPrice, orderStatusTone } from '../../utils/format.js';

const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

function OrderModal({ id, onClose, onChanged }) {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => api.get(`/admin/orders/${id}`), [id]);
  const [busy, setBusy] = useState(false);
  const order = data && data.order;

  const setStatus = async (status) => {
    setBusy(true);
    try { await api.patch(`/admin/orders/${id}/status`, { status }); toast.success(`Order marked ${status}`); await reload(true); onChanged(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const setPayment = async (paymentStatus) => {
    setBusy(true);
    try { await api.patch(`/admin/orders/${id}/payment`, { paymentStatus }); toast.success(`Payment marked ${paymentStatus}`); await reload(true); onChanged(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} size="lg" title={order ? `Order #${order.orderNumber}` : 'Order'}>
      {error ? <ErrorState error={error} onRetry={reload} /> : loading || !order ? <Skeleton height={260} /> : (
        <div className="a-order">
          <div className="a-order-top">
            <Badge tone={orderStatusTone[order.status]}>{order.status}</Badge>
            <span className="a-muted">Placed {formatDate(order.createdAt, true)}</span>
          </div>
          <div className="a-order-actions">
            <span>Update status:</span>
            {STATUSES.map((s) => (
              <button key={s} type="button" className={`btn btn-sm ${order.status === s ? 'btn-primary' : 'btn-outline'}`} disabled={busy || order.status === s || order.status === 'Cancelled'} onClick={() => setStatus(s)}>{s}</button>
            ))}
          </div>
          {order.status === 'Cancelled' && <p className="a-muted small">Cancelled orders can't be re-opened. Stock was returned to inventory.</p>}
          <div className="a-two">
            <div>
              <h3>Customer</h3>
              <address>
                <strong>{order.shipping.fullName}</strong><br />{order.shipping.email}<br />{order.shipping.phone}<br />
                {order.shipping.address}, {order.shipping.city} {order.shipping.postalCode}
              </address>
              {order.notes && <p className="a-note"><strong>Notes:</strong> {order.notes}</p>}
            </div>
            <div>
              <h3>Payment</h3>
              <p>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online payment'} <Badge tone={order.paymentStatus === 'Paid' ? 'green' : 'amber'}>{order.paymentStatus}</Badge></p>
              <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => setPayment(order.paymentStatus === 'Paid' ? 'Pending' : 'Paid')}>Mark as {order.paymentStatus === 'Paid' ? 'Pending' : 'Paid'}</button>
            </div>
          </div>
          <h3>Items</h3>
          <TableWrap>
            <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th className="a-right">Total</th></tr></thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={`${i.product}-${i.name}`}><td><div className="a-prod"><img src={i.image || '/assets/images/placeholder.svg'} alt="" /><div><strong>{i.name}</strong><small>{i.brand}</small></div></div></td><td>{formatPrice(i.price)}</td><td>{i.quantity}</td><td className="a-right">{formatPrice(i.price * i.quantity)}</td></tr>
              ))}
            </tbody>
          </TableWrap>
          <dl className="a-totals">
            <div><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
            <div><dt>Shipping</dt><dd>{formatPrice(order.shippingFee)}</dd></div>
            {order.discount > 0 && <div><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>- {formatPrice(order.discount)}</dd></div>}
            <div className="is-total"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
          </dl>
        </div>
      )}
    </Modal>
  );
}

export default function Orders() {
  useTitle('Orders');
  const [status, setStatus] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const q = useDebounce(term, 350);
  useEffect(() => { setPage(1); }, [status, q]);
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/orders', { status, q, page, limit: 10 }), [status, q, page]);
  const counts = (data && data.statusCounts) || {};
  const all = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader title="Orders" subtitle="Review orders and update their status." />
      <Card>
        <div className="a-filters">
          <Tabs label="Order status" value={status} onChange={setStatus} tabs={[{ value: '', label: 'All', count: all }, ...STATUSES.map((s) => ({ value: s, label: s, count: counts[s] }))]} />
          <SearchBox value={term} onChange={setTerm} placeholder="Order #, name, email..." />
        </div>
        {error ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? <Skeleton height={300} /> : data.orders.length === 0 ? <EmptyState compact pet="cat" title="No orders found" /> : (
          <>
            <TableWrap>
              <thead><tr><th>Order ID</th><th>Customer</th><th>Email</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th className="a-right">Action</th></tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o._id}>
                    <td><strong>#{o.orderNumber}</strong></td>
                    <td>{o.shipping.fullName}</td>
                    <td className="a-muted">{o.shipping.email}</td>
                    <td>{formatPrice(o.total)}</td>
                    <td><Badge tone={o.paymentStatus === 'Paid' ? 'green' : 'amber'}>{o.paymentStatus}</Badge></td>
                    <td><Badge tone={orderStatusTone[o.status]}>{o.status}</Badge></td>
                    <td className="a-muted">{formatDate(o.createdAt)}</td>
                    <td className="a-right"><button type="button" className="btn btn-soft btn-sm" onClick={() => setOpen(o._id)}><Icon name="eye" size={14} /> View</button></td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <div className="a-table-foot"><span className="a-muted">{data.total} orders</span><Pagination page={data.page} pages={data.pages} onChange={setPage} /></div>
          </>
        )}
      </Card>
      {open && <OrderModal id={open} onClose={() => setOpen(null)} onChanged={() => reload(true)} />}
    </>
  );
}
