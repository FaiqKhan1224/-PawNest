import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { Badge } from '../../components/ui/Controls.jsx';
import { ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { Card, PageHeader, StatCard, TableWrap } from '../../components/admin/AdminUI.jsx';
import { LineChart } from '../../components/admin/Charts.jsx';
import { Stars } from '../../components/ui/Stars.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { formatDate, formatPrice, orderStatusTone } from '../../utils/format.js';

export default function Dashboard() {
  useTitle('Admin dashboard');
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/stats'), []);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const t = data && data.totals;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="A live overview of your store." actions={<button type="button" className="btn btn-outline btn-sm" onClick={() => reload()}><Icon name="refresh" size={15} /> Refresh</button>} />
      <div className="a-stats">
        {loading ? [1, 2, 3, 4].map((i) => <Skeleton key={i} height={88} radius={16} />) : (
          <>
            <StatCard label="Total Products" value={t.products.toLocaleString('en-US')} icon="box" />
            <StatCard label="Total Orders" value={t.orders.toLocaleString('en-US')} icon="package" tone="purple" hint={`${t.pendingOrders} processing`} />
            <StatCard label="Total Customers" value={t.customers.toLocaleString('en-US')} icon="users" tone="blue" />
            <StatCard label="Total Sales" value={formatPrice(t.sales)} icon="dollar" tone="green" hint="Excludes cancelled" />
          </>
        )}
      </div>

      <div className="a-grid-2">
        <Card title="Sales Overview" actions={<span className="a-muted">Last 6 months</span>}>
          {loading ? <Skeleton height={240} /> : <LineChart data={data.salesOverview.map((m) => ({ label: m.label, value: m.revenue }))} />}
        </Card>
        <Card title="Low stock alerts" actions={<Link to="/admin/inventory" className="a-link">Inventory</Link>}>
          {loading ? <Skeleton height={200} /> : data.lowStock.length === 0 ? <p className="a-muted">All products are well stocked.</p> : (
            <ul className="a-list">
              {data.lowStock.map((p) => (
                <li key={p._id}><img src={p.images[0] || '/assets/images/placeholder.svg'} alt="" /><span className="truncate">{p.name}</span><Badge tone={p.stock === 0 ? 'red' : 'amber'}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</Badge></li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="a-grid-2">
        <Card title="Recent Orders" actions={<Link to="/admin/orders" className="a-link">View all</Link>}>
          {loading ? <Skeleton height={220} /> : (
            <TableWrap>
              <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td><strong>#{o.orderNumber}</strong></td>
                    <td>{o.shipping.fullName}</td>
                    <td>{formatPrice(o.total)}</td>
                    <td><Badge tone={orderStatusTone[o.status]}>{o.status}</Badge></td>
                    <td className="a-muted">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>
        <Card title="Latest reviews" actions={<Link to="/admin/reviews" className="a-link">Manage</Link>}>
          {loading ? <Skeleton height={220} /> : (
            <ul className="a-list a-list-reviews">
              {data.latestReviews.map((r) => (
                <li key={r._id}>
                  <div><strong>{r.name}</strong> <Stars value={r.rating} size={13} /></div>
                  <p className="truncate-2">{r.comment}</p>
                  <small className="a-muted">{r.product ? r.product.name : 'Deleted product'}</small>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
