import { useState } from 'react';
import { ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { Card, PageHeader, StatCard } from '../../components/admin/AdminUI.jsx';
import { BarChart, BarList, Donut, LineChart } from '../../components/admin/Charts.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { ANIMAL_LABEL, formatPrice, toSlugLabel } from '../../utils/format.js';

const STATUS_COLORS = { Processing: '#f5a524', Shipped: '#4f9cf9', Delivered: '#2fb67c', Cancelled: '#ef5b5b' };

export default function Analytics() {
  useTitle('Analytics');
  const [months, setMonths] = useState(6);
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/analytics', { months }), [months]);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const t = data && data.totals;

  return (
    <>
      <PageHeader title="Analytics" subtitle="Sales, products and customers at a glance." actions={
        <label className="inline-select">Period
          <select className="select select-sm" value={months} onChange={(e) => setMonths(Number(e.target.value))} aria-label="Period"><option value={3}>Last 3 months</option><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select>
        </label>
      } />
      <div className="a-stats">
        {loading && !data ? [1, 2, 3, 4].map((i) => <Skeleton key={i} height={88} radius={16} />) : (
          <>
            <StatCard label="Revenue" value={formatPrice(t.revenue)} icon="dollar" tone="green" hint="All time, excl. cancelled" />
            <StatCard label="Orders" value={t.orders} icon="package" tone="purple" hint={`Avg. ${formatPrice(t.averageOrder)}`} />
            <StatCard label="Customers" value={t.customers} icon="users" tone="blue" hint={`${t.subscribers} newsletter subscribers`} />
            <StatCard label="Average rating" value={t.averageRating ? `${t.averageRating} / 5` : '-'} icon="star" tone="amber" hint={`${t.reviews} published reviews`} />
          </>
        )}
      </div>

      {loading && !data ? <Skeleton height={300} /> : (
        <>
          <div className="a-grid-2">
            <Card title="Revenue by month"><LineChart data={data.revenueByMonth.map((m) => ({ label: m.label, value: m.revenue }))} /></Card>
            <Card title="Orders by status"><Donut data={data.ordersByStatus.map((s) => ({ label: s.status, value: s.count, color: STATUS_COLORS[s.status] || '#a3a8c3' }))} /></Card>
          </div>
          <div className="a-grid-2">
            <Card title="Top products by revenue"><BarList items={data.topProducts.map((p) => ({ label: p.name, sub: `${p.units} sold`, value: p.revenue, display: formatPrice(p.revenue) }))} /></Card>
            <Card title="Sales by animal"><BarList color="#8b5cf6" items={data.salesByAnimal.map((a) => ({ label: ANIMAL_LABEL[a.animal] || toSlugLabel(a.animal), sub: `${a.units} units`, value: a.revenue, display: formatPrice(a.revenue) }))} /></Card>
          </div>
          <div className="a-grid-2">
            <Card title="Top brands"><BarList color="#38a3f0" items={data.topBrands.map((b) => ({ label: b.brand, sub: `${b.units} units`, value: b.revenue, display: formatPrice(b.revenue) }))} /></Card>
            <Card title="New customers by month"><BarChart data={data.customersByMonth.map((c) => ({ label: c.label, value: c.count }))} format={(n) => String(Math.round(n))} /></Card>
          </div>
        </>
      )}
    </>
  );
}
