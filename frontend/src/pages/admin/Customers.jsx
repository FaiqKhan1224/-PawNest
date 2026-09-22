import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { Badge, Pagination, Toggle } from '../../components/ui/Controls.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { Card, PageHeader, SearchBox, StatCard, TableWrap } from '../../components/admin/AdminUI.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ANIMAL_SINGULAR, formatDate, formatPrice, orderStatusTone } from '../../utils/format.js';

function CustomerModal({ id, onClose }) {
  const { data, loading, error, reload } = useFetch(() => api.get(`/admin/customers/${id}`), [id]);
  const c = data && data.customer;
  return (
    <Modal open onClose={onClose} size="lg" title={c ? c.name : 'Customer'}>
      {error ? <ErrorState error={error} onRetry={reload} /> : loading || !c ? <Skeleton height={240} /> : (
        <div className="a-order">
          <div className="a-two">
            <div><h3>Contact</h3><address>{c.email}<br />{c.phone || 'No phone'}<br />{c.address && c.address.line1 ? `${c.address.line1}, ${c.address.city}` : 'No saved address'}</address><p className="a-muted small">Joined {formatDate(c.createdAt)}</p></div>
            <div><h3>Pets ({data.pets.length})</h3>{data.pets.length === 0 ? <p className="a-muted">No pets saved.</p> : <ul className="a-plain">{data.pets.map((p) => <li key={p._id}><strong>{p.name}</strong> - {p.breed || ANIMAL_SINGULAR[p.animal]}, {p.ageYears}y</li>)}</ul>}</div>
          </div>
          <h3>Recent orders</h3>
          {data.orders.length === 0 ? <p className="a-muted">No orders yet.</p> : (
            <TableWrap>
              <thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>{data.orders.map((o) => <tr key={o._id}><td><strong>#{o.orderNumber}</strong></td><td>{formatDate(o.createdAt)}</td><td>{formatPrice(o.total)}</td><td><Badge tone={orderStatusTone[o.status]}>{o.status}</Badge></td></tr>)}</tbody>
            </TableWrap>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function Customers() {
  useTitle('Customers');
  const toast = useToast();
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const q = useDebounce(term, 350);
  useEffect(() => { setPage(1); }, [q, status]);
  const { data, loading, error, reload, setData } = useFetch(() => api.get('/admin/customers', { q, status, page, limit: 10 }), [q, status, page]);

  const toggle = async (c) => {
    try {
      await api.patch(`/admin/customers/${c._id}/active`, { isActive: !c.isActive });
      setData((d) => ({ ...d, customers: d.customers.map((x) => (x._id === c._id ? { ...x, isActive: !c.isActive } : x)) }));
      toast.success(c.isActive ? `${c.name} can no longer sign in` : `${c.name} can sign in again`);
    } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      <PageHeader title="Customers" subtitle="People who have registered on PawNest." />
      <div className="a-stats a-stats-3">
        <StatCard label="Registered customers" value={data ? data.total : '-'} icon="users" />
        <StatCard label="Active accounts" value={data ? data.summary.active : '-'} icon="check-circle" tone="green" />
        <StatCard label="Newsletter subscribers" value={data ? data.summary.subscribers : '-'} icon="mail" tone="purple" />
      </div>
      <Card>
        <div className="a-filters">
          <SearchBox value={term} onChange={setTerm} placeholder="Search name, email, phone..." />
          <select className="select select-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"><option value="">All accounts</option><option value="active">Active</option><option value="disabled">Disabled</option></select>
        </div>
        {error ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? <Skeleton height={300} /> : data.customers.length === 0 ? <EmptyState compact pet="dog" title="No customers found" /> : (
          <>
            <TableWrap>
              <thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Total spent</th><th>Joined</th><th>Active</th><th className="a-right">Action</th></tr></thead>
              <tbody>
                {data.customers.map((c) => (
                  <tr key={c._id}>
                    <td><div className="a-prod"><span className="a-initial">{c.name.charAt(0)}</span><div><strong>{c.name}</strong><small>{c.email}</small></div></div></td>
                    <td className="a-muted">{c.phone || '-'}</td>
                    <td>{c.orderCount}</td>
                    <td>{formatPrice(c.totalSpent)}</td>
                    <td className="a-muted">{formatDate(c.createdAt)}</td>
                    <td><Toggle checked={c.isActive} onChange={() => toggle(c)} label={c.isActive ? `Disable ${c.name}` : `Enable ${c.name}`} /></td>
                    <td className="a-right"><button type="button" className="btn btn-soft btn-sm" onClick={() => setOpen(c._id)}><Icon name="eye" size={14} /> View</button></td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <div className="a-table-foot"><span className="a-muted">{data.total} customers</span><Pagination page={data.page} pages={data.pages} onChange={setPage} /></div>
          </>
        )}
      </Card>
      {open && <CustomerModal id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
