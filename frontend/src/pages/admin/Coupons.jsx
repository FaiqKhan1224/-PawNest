import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { Badge, Field, Toggle } from '../../components/ui/Controls.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { Card, PageHeader, TableWrap } from '../../components/admin/AdminUI.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, formatPrice } from '../../utils/format.js';

const blank = { code: '', description: '', type: 'flat', value: '', maxDiscount: '', minOrder: '', maxUses: '', expiresAt: '', isActive: true };

export default function Coupons() {
  useTitle('Coupons');
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/coupons'), []);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const openEdit = (c) => setEditing({ ...c, maxDiscount: c.maxDiscount || '', minOrder: c.minOrder || '', maxUses: c.maxUses || '', expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '' });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing._id) await api.put(`/admin/coupons/${editing._id}`, editing);
      else await api.post('/admin/coupons', editing);
      toast.success('Coupon saved');
      setEditing(null);
      reload(true);
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const toggle = async (c) => {
    try { await api.patch(`/admin/coupons/${c._id}/active`, { isActive: !c.isActive }); reload(true); } catch (err) { toast.error(err.message); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api.del(`/admin/coupons/${toDelete._id}`); toast.success('Coupon deleted'); setToDelete(null); reload(true); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const expired = (c) => c.expiresAt && new Date(c.expiresAt) < new Date();

  return (
    <>
      <PageHeader title="Coupons" subtitle="Discount codes customers can apply in the cart." actions={<button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing({ ...blank })}><Icon name="plus" size={16} /> New Coupon</button>} />
      <Card>
        {error ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? <Skeleton height={240} /> : data.coupons.length === 0 ? <EmptyState compact pet="paw" title="No coupons yet" text="Create your first discount code." /> : (
          <TableWrap>
            <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Expires</th><th>Active</th><th className="a-right">Actions</th></tr></thead>
            <tbody>
              {data.coupons.map((c) => (
                <tr key={c._id}>
                  <td><strong className="a-code">{c.code}</strong><small className="a-block a-muted">{c.description}</small></td>
                  <td>{c.type === 'percent' ? `${c.value}%${c.maxDiscount ? ` (max ${formatPrice(c.maxDiscount)})` : ''}` : formatPrice(c.value)}</td>
                  <td>{c.minOrder ? formatPrice(c.minOrder) : '-'}</td>
                  <td>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                  <td>{c.expiresAt ? <>{formatDate(c.expiresAt)} {expired(c) && <Badge tone="red">Expired</Badge>}</> : <span className="a-muted">Never</span>}</td>
                  <td><Toggle checked={c.isActive} onChange={() => toggle(c)} label={`${c.isActive ? 'Disable' : 'Enable'} ${c.code}`} /></td>
                  <td><div className="a-actions">
                    <button type="button" className="icon-btn" onClick={() => openEdit(c)} aria-label={`Edit ${c.code}`}><Icon name="edit" size={17} /></button>
                    <button type="button" className="icon-btn icon-btn-danger" onClick={() => setToDelete(c)} aria-label={`Delete ${c.code}`}><Icon name="trash" size={17} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing && editing._id ? 'Edit coupon' : 'New coupon'} footer={<><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button type="submit" form="coupon-form" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save coupon'}</button></>}>
        {editing && (
          <form id="coupon-form" onSubmit={save} className="a-form-stack">
            <div className="a-form-grid">
              <Field label="Code" htmlFor="cp-code"><input id="cp-code" className="input" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="WELCOME500" maxLength={20} required /></Field>
              <Field label="Type" htmlFor="cp-type"><select id="cp-type" className="select" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}><option value="flat">Flat amount (Rs.)</option><option value="percent">Percentage (%)</option></select></Field>
              <Field label={editing.type === 'percent' ? 'Percent off' : 'Amount off (Rs.)'} htmlFor="cp-val"><input id="cp-val" className="input" type="number" min="1" value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} required /></Field>
              {editing.type === 'percent' && <Field label="Max discount (Rs.)" htmlFor="cp-max" help="0 or empty = no cap"><input id="cp-max" className="input" type="number" min="0" value={editing.maxDiscount} onChange={(e) => setEditing({ ...editing, maxDiscount: e.target.value })} /></Field>}
              <Field label="Minimum order (Rs.)" htmlFor="cp-min"><input id="cp-min" className="input" type="number" min="0" value={editing.minOrder} onChange={(e) => setEditing({ ...editing, minOrder: e.target.value })} /></Field>
              <Field label="Usage limit" htmlFor="cp-uses" help="0 or empty = unlimited"><input id="cp-uses" className="input" type="number" min="0" value={editing.maxUses} onChange={(e) => setEditing({ ...editing, maxUses: e.target.value })} /></Field>
              <Field label="Expires on" htmlFor="cp-exp"><input id="cp-exp" className="input" type="date" value={editing.expiresAt} onChange={(e) => setEditing({ ...editing, expiresAt: e.target.value })} /></Field>
              <Field label="Description" htmlFor="cp-desc" className="span-2"><input id="cp-desc" className="input" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} maxLength={160} /></Field>
            </div>
            <label className="a-inline-toggle"><Toggle checked={editing.isActive} onChange={(v) => setEditing({ ...editing, isActive: v })} label="Active" /><span>{editing.isActive ? 'Customers can use this code' : 'Code is switched off'}</span></label>
          </form>
        )}
      </Modal>
      <ConfirmDialog open={!!toDelete} title="Delete coupon?" message={toDelete ? `${toDelete.code} will be removed. Past orders keep their discount.` : ''} confirmLabel="Delete" busy={busy} onConfirm={remove} onClose={() => setToDelete(null)} />
    </>
  );
}
