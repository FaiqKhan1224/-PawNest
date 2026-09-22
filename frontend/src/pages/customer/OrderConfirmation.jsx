import { Link, useLocation, useParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';
import { OrderStatusBadge, OrderBody } from './Orders.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function OrderConfirmation() {
  useTitle('Order placed');
  const { orderNumber } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();

  const loaded = useFetch(async () => {
    if (state && state.order && String(state.order.orderNumber) === String(orderNumber)) return state;
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem('pawnest_last_order')); } catch (err) { saved = null; }
    const email = (saved && String(saved.orderNumber) === String(orderNumber) && saved.email) || (user && user.email) || '';
    if (!email) throw new Error('Use Track Order with your order number and email to see this order.');
    return api.post('/orders/track', { orderNumber, email });
  }, [orderNumber]);

  if (loaded.loading) return <PageLoader label="Loading your order..." />;
  if (loaded.error) {
    return (
      <div className="container section">
        <ErrorState error={loaded.error} title="We couldn't load this order" />
        <p className="center"><Link to="/track-order" className="btn btn-primary">Track an order</Link></p>
      </div>
    );
  }
  const { order, paymentInstructions } = loaded.data;

  return (
    <div className="confirm container">
      <div className="confirm-hero">
        <span className="confirm-tick"><Icon name="check" size={34} /></span>
        <h1>Thank you, {order.shipping.fullName.split(' ')[0]}!</h1>
        <p>Your order <strong>#{order.orderNumber}</strong> has been placed. A confirmation will follow on <strong>{order.shipping.email}</strong>.</p>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.paymentMethod === 'online' && paymentInstructions && (
        <div className="notice notice-info"><Icon name="info" size={18} /><div><strong>How to pay</strong><p>{paymentInstructions}</p></div></div>
      )}

      <OrderBody order={order} />

      <div className="confirm-actions">
        {user ? <Link to="/orders" className="btn btn-primary">View my orders</Link> : <Link to="/track-order" className="btn btn-primary">Track this order</Link>}
        <Link to="/shop" className="btn btn-outline">Continue shopping</Link>
      </div>
    </div>
  );
}
