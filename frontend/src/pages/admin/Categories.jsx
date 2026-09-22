import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import PetIcon from '../../components/ui/PetIcon.jsx';
import GLYPHS from '../../assets/petGlyphs.js';
import { Badge, Field, Toggle } from '../../components/ui/Controls.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { Card, PageHeader, TableWrap } from '../../components/admin/AdminUI.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

const ICONS = Object.keys(GLYPHS);

function CategoryTable({ title, kind, rows, onAdd, onEdit, onDelete, onToggle }) {
  return (
    <Card title={title} actions={<button type="button" className="btn btn-primary btn-sm" onClick={() => onAdd(kind)}><Icon name="plus" size={15} /> Add</button>}>
      <TableWrap>
        <thead><tr><th>Name</th><th>Slug</th><th>Products</th><th>Active</th><th className="a-right">Actions</th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c._id}>
              <td><div className="a-cat"><span><PetIcon name={c.icon} size={26} color="#f0287f" /></span><div><strong>{c.name}</strong><small>{c.description}</small></div></div></td>
              <td className="a-muted">{c.slug}</td>
              <td><Badge tone="purple">{c.productCount}</Badge></td>
              <td><Toggle checked={c.isActive} onChange={(v) => onToggle(c, v)} label={`${c.isActive ? 'Disable' : 'Enable'} ${c.name}`} /></td>
              <td><div className="a-actions">
                <button type="button" className="icon-btn" onClick={() => onEdit(c)} aria-label={`Edit ${c.name}`}><Icon name="edit" size={17} /></button>
                <button type="button" className="icon-btn icon-btn-danger" onClick={() => onDelete(c)} aria-label={`Delete ${c.name}`}><Icon name="trash" size={17} /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  );
}

export default function Categories() {
  useTitle('Categories');
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/categories'), []);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing._id) await api.put(`/admin/categories/${editing._id}`, editing);
      else await api.post('/admin/categories', editing);
      toast.success('Category saved');
      setEditing(null);
      reload(true);
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const toggle = async (c, isActive) => {
    try { await api.put(`/admin/categories/${c._id}`, { isActive }); reload(true); } catch (err) { toast.error(err.message); }
  };

  const remove = async () => {
    setBusy(true);
    try { await api.del(`/admin/categories/${toDelete._id}`); toast.success('Category deleted'); setToDelete(null); reload(true); } catch (err) { toast.error(err.message); setToDelete(null); } finally { setBusy(false); }
  };

  if (error) return <ErrorState error={error} onRetry={reload} />;
  const rows = data ? data.categories : [];

  return (
    <>
      <PageHeader title="Categories" subtitle="Animals (Dogs, Cats, Birds...) and product categories (Food, Treats...) used across the shop." />
      {loading && !data ? <Skeleton height={300} /> : (
        <div className="a-stack">
          <CategoryTable title="Animals" kind="animal" rows={rows.filter((c) => c.kind === 'animal')} onAdd={(kind) => setEditing({ kind, name: '', icon: 'paw', description: '', isActive: true })} onEdit={setEditing} onDelete={setToDelete} onToggle={toggle} />
          <CategoryTable title="Product categories" kind="type" rows={rows.filter((c) => c.kind === 'type')} onAdd={(kind) => setEditing({ kind, name: '', icon: 'paw', description: '', isActive: true })} onEdit={setEditing} onDelete={setToDelete} onToggle={toggle} />
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing && editing._id ? 'Edit category' : `Add ${editing && editing.kind === 'animal' ? 'animal' : 'category'}`} footer={<><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button type="submit" form="cat-form" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></>}>
        {editing && (
          <form id="cat-form" onSubmit={save} className="a-form-stack">
            <Field label="Name" htmlFor="cat-name"><input id="cat-name" className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required maxLength={60} /></Field>
            <Field label="Description" htmlFor="cat-desc"><input id="cat-desc" className="input" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} maxLength={240} /></Field>
            <Field label="Icon">
              <div className="a-icon-grid" role="radiogroup" aria-label="Icon">
                {ICONS.map((i) => (
                  <button key={i} type="button" role="radio" aria-checked={editing.icon === i} aria-label={i} className={editing.icon === i ? 'is-on' : ''} onClick={() => setEditing({ ...editing, icon: i })}><PetIcon name={i} size={28} color="#f0287f" /></button>
                ))}
              </div>
            </Field>
            <label className="a-inline-toggle"><Toggle checked={editing.isActive} onChange={(v) => setEditing({ ...editing, isActive: v })} label="Active" /><span>{editing.isActive ? 'Shown in the store' : 'Hidden from the store'}</span></label>
          </form>
        )}
      </Modal>
      <ConfirmDialog open={!!toDelete} title="Delete category?" message={toDelete ? `"${toDelete.name}" will be removed. Categories that still contain products can't be deleted.` : ''} confirmLabel="Delete" busy={busy} onConfirm={remove} onClose={() => setToDelete(null)} />
    </>
  );
}
