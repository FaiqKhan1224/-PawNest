import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { Badge, Pagination, Toggle } from '../../components/ui/Controls.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Card, PageHeader, SearchBox, TableWrap } from '../../components/admin/AdminUI.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ANIMAL_LABEL, CATEGORY_LABEL, formatPrice, stockLabel, stockTone, toSlugLabel } from '../../utils/format.js';

export default function Products() {
  useTitle('Products');
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [term, setTerm] = useState(sp.get('q') || '');
  const debounced = useDebounce(term, 400);
  const page = Number(sp.get('page')) || 1;
  const filters = { animal: sp.get('animal') || '', category: sp.get('category') || '', brand: sp.get('brand') || '', priceVisible: sp.get('priceVisible') || '', active: sp.get('active') || '', q: sp.get('q') || '' };
  const key = sp.toString();

  const { data, loading, error, reload, setData } = useFetch(() => api.get('/admin/products', { ...filters, page, limit: 10, includeCounts: 'true' }), [key]);
  const cats = useFetch(() => api.get('/admin/categories'), []);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState('');

  const setParam = (changes) => {
    const next = new URLSearchParams(sp);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setSp(next);
  };

  useEffect(() => {
    if (debounced.trim() !== filters.q) setParam({ q: debounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const patchRow = (updated) => setData((d) => ({ ...d, products: d.products.map((p) => (p._id === updated._id ? updated : p)) }));

  const togglePrice = async (p) => {
    setBusy(p._id);
    try {
      const res = await api.patch(`/admin/products/${p._id}/price-visibility`, { priceVisible: !p.priceVisible });
      patchRow(res.product);
      toast.success(res.product.priceVisible ? `Price is now visible for ${p.name}` : `Price hidden for ${p.name}`);
    } catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };

  const toggleActive = async (p) => {
    setBusy(p._id);
    try {
      const res = await api.patch(`/admin/products/${p._id}/active`, { isActive: !p.isActive });
      patchRow(res.product);
      toast.success(res.product.isActive ? 'Product is now available in the store' : 'Product disabled - customers no longer see it');
    } catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };

  const remove = async () => {
    setBusy(toDelete._id);
    try {
      await api.del(`/admin/products/${toDelete._id}`);
      toast.success('Product deleted');
      setToDelete(null);
      reload();
    } catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };

  const animals = (cats.data ? cats.data.categories : []).filter((c) => c.kind === 'animal');
  const types = (cats.data ? cats.data.categories : []).filter((c) => c.kind === 'type');

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={data && data.counts ? `${data.counts.all} products - ${data.counts.hiddenPrices} with hidden price` : 'Manage your catalogue, prices and availability.'}
        actions={<Link to="/admin/products/new" className="btn btn-primary btn-sm"><Icon name="plus" size={16} /> Add Product</Link>}
      />
      <Card>
        <div className="a-filters">
          <SearchBox value={term} onChange={setTerm} placeholder="Search name, brand..." />
          <select className="select select-sm" value={filters.animal} onChange={(e) => setParam({ animal: e.target.value })} aria-label="Filter by animal">
            <option value="">All animals</option>{animals.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
          </select>
          <select className="select select-sm" value={filters.category} onChange={(e) => setParam({ category: e.target.value })} aria-label="Filter by category">
            <option value="">All categories</option>{types.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
          </select>
          <select className="select select-sm" value={filters.brand} onChange={(e) => setParam({ brand: e.target.value })} aria-label="Filter by brand">
            <option value="">All brands</option>{(data ? data.brands : []).map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="select select-sm" value={filters.priceVisible} onChange={(e) => setParam({ priceVisible: e.target.value })} aria-label="Filter by price visibility">
            <option value="">Any price visibility</option><option value="true">Price shown</option><option value="false">Price hidden</option>
          </select>
          <select className="select select-sm" value={filters.active} onChange={(e) => setParam({ active: e.target.value })} aria-label="Filter by availability">
            <option value="">Any status</option><option value="true">Active</option><option value="false">Disabled</option>
          </select>
        </div>

        {error ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? <Skeleton height={320} /> : data.products.length === 0 ? (
          <EmptyState compact pet="dog" title="No products found" text="Try different filters, or add a new product." />
        ) : (
          <>
            <TableWrap>
              <thead><tr><th>Product</th><th>Animal / Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Active</th><th className="a-right">Actions</th></tr></thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p._id} className={p.isActive ? '' : 'is-off'}>
                    <td>
                      <div className="a-prod">
                        <img src={p.images[0] || '/assets/images/placeholder.svg'} alt="" />
                        <div><strong>{p.name}</strong><small>{p.brand}</small></div>
                      </div>
                    </td>
                    <td><span>{p.animals.map((a) => ANIMAL_LABEL[a] || toSlugLabel(a)).join(', ')}</span><small className="a-block a-muted">{CATEGORY_LABEL[p.category] || toSlugLabel(p.category)}</small></td>
                    <td>
                      <div className="a-price-cell">
                        <strong>{formatPrice(p.price)}</strong>
                        <button type="button" className={`price-switch ${p.priceVisible ? 'is-shown' : 'is-hidden'}`} disabled={busy === p._id} onClick={() => togglePrice(p)} aria-label={p.priceVisible ? `Hide price of ${p.name}` : `Show price of ${p.name}`} title={p.priceVisible ? 'Customers can see this price. Click to hide.' : 'Price is hidden from customers. Click to show.'}>
                          <Icon name={p.priceVisible ? 'eye' : 'eye-off'} size={14} /> {p.priceVisible ? 'Shown' : 'Hidden'}
                        </button>
                      </div>
                    </td>
                    <td><Badge tone={stockTone(p.stockStatus)}>{p.stock} - {stockLabel(p.stockStatus)}</Badge></td>
                    <td><span className="a-muted">{p.reviewCount ? `${p.rating.toFixed(1)} (${p.reviewCount})` : '-'}</span></td>
                    <td><Toggle checked={p.isActive} disabled={busy === p._id} onChange={() => toggleActive(p)} label={p.isActive ? `Disable ${p.name}` : `Enable ${p.name}`} /></td>
                    <td>
                      <div className="a-actions">
                        <Link to={`/admin/products/${p._id}`} className="icon-btn" aria-label={`Edit ${p.name}`} title="Edit"><Icon name="edit" size={17} /></Link>
                        <Link to={`/admin/reviews?product=${p._id}`} className="icon-btn" aria-label={`Reviews of ${p.name}`} title="View reviews"><Icon name="star" size={17} /></Link>
                        <button type="button" className="icon-btn icon-btn-danger" onClick={() => setToDelete(p)} aria-label={`Delete ${p.name}`} title="Delete"><Icon name="trash" size={17} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <div className="a-table-foot">
              <span className="a-muted">Showing {data.products.length} of {data.total}</span>
              <Pagination page={data.page} pages={data.pages} onChange={(n) => setParam({ page: n === 1 ? '' : String(n) })} />
            </div>
          </>
        )}
      </Card>
      <ConfirmDialog open={!!toDelete} title="Delete this product?" message={toDelete ? `"${toDelete.name}" and its reviews will be permanently removed. Past orders keep their own copy of the item. To hide it without deleting, switch it off instead.` : ''} confirmLabel="Delete product" busy={!!busy} onConfirm={remove} onClose={() => setToDelete(null)} />
    </>
  );
}
