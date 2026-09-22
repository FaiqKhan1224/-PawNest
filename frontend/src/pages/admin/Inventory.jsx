import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { Badge, Field, Pagination } from '../../components/ui/Controls.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { Card, PageHeader, SearchBox, StatCard, Tabs, TableWrap } from '../../components/admin/AdminUI.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { stockLabel, stockTone } from '../../utils/format.js';

export default function Inventory() {
  useTitle('Inventory');
  const toast = useToast();
  const [stock, setStock] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const q = useDebounce(term, 350);
  useEffect(() => { setPage(1); }, [stock, q]);

  const { data, loading, error, reload } = useFetch(() => api.get('/admin/products', { stock, q, page, limit: 12, sort: 'stock_asc', includeCounts: 'true' }), [stock, q, page]);
  const counts = data && data.counts;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/admin/products/${editing._id}/stock`, { stock: editing.stock, lowStockThreshold: editing.lowStockThreshold });
      toast.success('Stock updated');
      setEditing(null);
      reload(true);
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Inventory" subtitle="Track stock levels and update quantities." />
      <div className="a-stats a-stats-3">
        <StatCard label="In stock" value={counts ? counts.inStock : '-'} icon="check-circle" tone="green" />
        <StatCard label="Low stock" value={counts ? counts.low : '-'} icon="alert" tone="amber" />
        <StatCard label="Out of stock" value={counts ? counts.out : '-'} icon="x-circle" tone="red" />
      </div>
      <Card title="Inventory">
        <div className="a-filters">
          <Tabs label="Stock level" value={stock} onChange={setStock} tabs={[{ value: '', label: 'All', count: counts && counts.all }, { value: 'in', label: 'In Stock', count: counts && counts.inStock }, { value: 'low', label: 'Low Stock', count: counts && counts.low }, { value: 'out', label: 'Out of Stock', count: counts && counts.out }]} />
          <SearchBox value={term} onChange={setTerm} placeholder="Search product..." />
        </div>
        {error ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? <Skeleton height={300} /> : data.products.length === 0 ? <EmptyState compact pet="paw" title="Nothing here" text="No products match this stock filter." /> : (
          <>
            <TableWrap>
              <thead><tr><th>Product</th><th>Stock</th><th>Alert level</th><th>Status</th><th className="a-right">Action</th></tr></thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p._id}>
                    <td><div className="a-prod"><img src={p.images[0] || '/assets/images/placeholder.svg'} alt="" /><div><strong>{p.name}</strong><small>{p.brand}</small></div></div></td>
                    <td><strong>{p.stock}</strong></td>
                    <td className="a-muted">{p.lowStockThreshold}</td>
                    <td><Badge tone={stockTone(p.stockStatus)}>{stockLabel(p.stockStatus)}</Badge></td>
                    <td className="a-right"><button type="button" className="btn btn-soft btn-sm" onClick={() => setEditing({ _id: p._id, name: p.name, stock: String(p.stock), lowStockThreshold: String(p.lowStockThreshold) })}><Icon name="edit" size={14} /> Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <div className="a-table-foot"><span className="a-muted">{data.total} products</span><Pagination page={data.page} pages={data.pages} onChange={setPage} /></div>
          </>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} size="sm" title="Update stock" footer={<><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button type="submit" form="stock-form" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></>}>
        {editing && (
          <form id="stock-form" onSubmit={save} className="a-form-stack">
            <p><strong>{editing.name}</strong></p>
            <Field label="Stock quantity" htmlFor="st-qty"><input id="st-qty" className="input" type="number" min="0" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} required /></Field>
            <Field label="Low-stock alert at" htmlFor="st-low"><input id="st-low" className="input" type="number" min="0" value={editing.lowStockThreshold} onChange={(e) => setEditing({ ...editing, lowStockThreshold: e.target.value })} required /></Field>
          </form>
        )}
      </Modal>
    </>
  );
}
