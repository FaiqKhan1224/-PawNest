import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { Field, Toggle } from '../../components/ui/Controls.jsx';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';
import { Card, PageHeader, Tabs } from '../../components/admin/AdminUI.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatPrice } from '../../utils/format.js';

const blank = {
  name: '', brand: '', animals: [], category: '', subCategory: '', description: '', price: '', discountPercent: '0', priceVisible: true,
  stock: '0', lowStockThreshold: '10', isActive: true, featured: false, images: [], weight: '', ageGroup: '', breedSize: '', ingredients: '', benefits: '', usage: '',
};
const TABS = [
  { value: 'basic', label: 'Basic Info' },
  { value: 'pricing', label: 'Pricing & Stock' },
  { value: 'media', label: 'Media' },
  { value: 'details', label: 'Details' },
];

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef(null);
  const [tab, setTab] = useState('basic');
  const [form, setForm] = useState(blank);
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  useTitle(isNew ? 'Add product' : 'Edit product');

  const cats = useFetch(() => api.get('/admin/categories'), []);
  const brands = useFetch(() => api.get('/admin/products', { limit: 1 }), []);
  const loaded = useFetch(() => (isNew ? Promise.resolve(null) : api.get(`/admin/products/${id}`)), [id]);

  useEffect(() => {
    if (loaded.data && loaded.data.product) {
      const p = loaded.data.product;
      setForm({
        name: p.name, brand: p.brand, animals: p.animals, category: p.category, subCategory: p.subCategory || '', description: p.description || '',
        price: String(p.price), discountPercent: String(p.discountPercent || 0), priceVisible: p.priceVisible, stock: String(p.stock), lowStockThreshold: String(p.lowStockThreshold ?? 10),
        isActive: p.isActive, featured: !!p.featured, images: p.images || [], weight: p.weight || '', ageGroup: p.ageGroup || '', breedSize: p.breedSize || '',
        ingredients: p.ingredients || '', benefits: (p.benefits || []).join('\n'), usage: p.usage || '',
      });
    }
  }, [loaded.data]);

  if (loaded.loading || cats.loading) return <PageLoader />;
  if (loaded.error) return <ErrorState error={loaded.error} title={loaded.error.status === 404 ? 'Product not found' : undefined} />;

  const animals = cats.data ? cats.data.categories.filter((c) => c.kind === 'animal') : [];
  const types = cats.data ? cats.data.categories.filter((c) => c.kind === 'type') : [];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const priceNum = Number(form.price) || 0;
  const disc = Number(form.discountPercent) || 0;
  const previewCompare = disc > 0 && disc < 100 ? Math.round(priceNum / (1 - disc / 100) / 50) * 50 : null;

  const toggleAnimal = (slug) => setForm({ ...form, animals: form.animals.includes(slug) ? form.animals.filter((a) => a !== slug) : [...form.animals, slug] });

  const addImage = () => {
    const url = imageUrl.trim();
    if (!url) return;
    if (!/^(https?:\/\/|\/)/i.test(url)) { toast.error('Enter a full image link (https://...) or a path such as /uploads/file.jpg'); return; }
    setForm({ ...form, images: [...form.images, url] });
    setImageUrl('');
  };

  const upload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.upload(file);
      setForm((f) => ({ ...f, images: [...f.images, res.url] }));
      toast.success('Image uploaded');
    } catch (err) { toast.error(err.message); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const moveImage = (i, dir) => {
    const next = [...form.images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setForm({ ...form, images: next });
  };

  const save = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setTab('basic'); setFormError('Please enter a product name.'); return; }
    if (!form.brand.trim()) { setTab('basic'); setFormError('Please enter a brand.'); return; }
    if (!form.animals.length) { setTab('basic'); setFormError('Choose at least one animal.'); return; }
    if (!form.category) { setTab('basic'); setFormError('Choose a category.'); return; }
    if (form.price === '' || Number(form.price) < 0) { setTab('pricing'); setFormError('Enter a valid price.'); return; }
    setBusy(true);
    try {
      const body = { ...form, price: Number(form.price), discountPercent: Number(form.discountPercent) || 0, stock: Number(form.stock) || 0, lowStockThreshold: Number(form.lowStockThreshold) || 0 };
      if (isNew) await api.post('/admin/products', body);
      else await api.put(`/admin/products/${id}`, body);
      toast.success(isNew ? 'Product created' : 'Product saved');
      navigate('/admin/products');
    } catch (err) { setFormError(err.message); toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title={isNew ? 'Add New Product' : 'Edit Product'} subtitle={isNew ? 'Fill in the details, then save.' : form.name} actions={<Link to="/admin/products" className="btn btn-outline btn-sm"><Icon name="arrow-left" size={15} /> Back to products</Link>} />
      <form onSubmit={save} noValidate>
        <Card className="a-form-card">
          <Tabs tabs={TABS} value={tab} onChange={setTab} label="Product form sections" />
          {formError && <p className="a-form-error" role="alert"><Icon name="alert" size={16} /> {formError}</p>}

          {tab === 'basic' && (
            <div className="a-form-grid">
              <Field label="Product Name" htmlFor="pf-name" className="span-2"><input id="pf-name" className="input" value={form.name} onChange={set('name')} placeholder="Royal Canin Medium Adult Dog Food" maxLength={160} /></Field>
              <Field label="Brand" htmlFor="pf-brand">
                <input id="pf-brand" className="input" list="brand-list" value={form.brand} onChange={set('brand')} placeholder="Royal Canin" />
                <datalist id="brand-list">{(brands.data ? brands.data.brands : []).map((b) => <option key={b} value={b} />)}</datalist>
              </Field>
              <Field label="Category" htmlFor="pf-cat">
                <select id="pf-cat" className="select" value={form.category} onChange={set('category')}><option value="">Choose category</option>{types.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
              </Field>
              <Field label="Animal" className="span-2">
                <div className="a-checks">
                  {animals.map((a) => (
                    <label key={a.slug} className={`a-chip-check ${form.animals.includes(a.slug) ? 'is-on' : ''}`}>
                      <input type="checkbox" checked={form.animals.includes(a.slug)} onChange={() => toggleAnimal(a.slug)} />{a.name}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Sub Category" htmlFor="pf-sub"><input id="pf-sub" className="input" value={form.subCategory} onChange={set('subCategory')} placeholder="Dry Food" /></Field>
              <Field label="Status" htmlFor="pf-status">
                <div className="a-inline-toggle"><Toggle id="pf-status" checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Available in store" /><span>{form.isActive ? 'Active - visible to customers' : 'Disabled - hidden from customers'}</span></div>
              </Field>
              <Field label="Description" htmlFor="pf-desc" className="span-2"><textarea id="pf-desc" className="textarea" rows={5} value={form.description} onChange={set('description')} /></Field>
            </div>
          )}

          {tab === 'pricing' && (
            <div className="a-form-grid">
              <Field label="Price (Rs.)" htmlFor="pf-price"><input id="pf-price" className="input" type="number" min="0" step="1" value={form.price} onChange={set('price')} placeholder="2800" /></Field>
              <Field label="Discount (%)" htmlFor="pf-disc" help={previewCompare ? `Customers see ${formatPrice(priceNum)} with ${formatPrice(previewCompare)} crossed out.` : 'Leave 0 for no discount badge.'}><input id="pf-disc" className="input" type="number" min="0" max="90" value={form.discountPercent} onChange={set('discountPercent')} /></Field>
              <Field label="Price visibility" className="span-2">
                <div className="a-seg" role="radiogroup" aria-label="Price visibility">
                  <button type="button" role="radio" aria-checked={form.priceVisible} className={form.priceVisible ? 'is-on' : ''} onClick={() => setForm({ ...form, priceVisible: true })}><Icon name="eye" size={16} /> Show Price</button>
                  <button type="button" role="radio" aria-checked={!form.priceVisible} className={!form.priceVisible ? 'is-on' : ''} onClick={() => setForm({ ...form, priceVisible: false })}><Icon name="eye-off" size={16} /> Hide Price</button>
                </div>
                <p className="help">{form.priceVisible ? 'The price is shown everywhere in the store.' : 'Customers will see "Price unavailable" and the price is not sent to their browser. They can\'t add this item to the cart until you show it again.'}</p>
              </Field>
              <Field label="Stock quantity" htmlFor="pf-stock"><input id="pf-stock" className="input" type="number" min="0" value={form.stock} onChange={set('stock')} /></Field>
              <Field label="Low-stock alert at" htmlFor="pf-low" help="Shown as Low Stock when stock is at or below this number."><input id="pf-low" className="input" type="number" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} /></Field>
              <Field label="Featured on home page" className="span-2">
                <div className="a-inline-toggle"><Toggle checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} label="Featured product" /><span>{form.featured ? 'Shown in Featured Products' : 'Not featured'}</span></div>
              </Field>
            </div>
          )}

          {tab === 'media' && (
            <div className="a-media">
              {form.images.length === 0 ? <p className="a-muted">No images yet. The first image is the main one shown on cards.</p> : (
                <ul className="a-media-list">
                  {form.images.map((src, i) => (
                    <li key={`${src}-${i}`}>
                      <img src={src} alt="" />
                      <div className="a-media-url"><span className="truncate">{src}</span>{i === 0 && <span className="a-badge-main">Main</span>}</div>
                      <div className="a-actions">
                        <button type="button" className="icon-btn" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Move image up"><Icon name="chevron-up" size={16} /></button>
                        <button type="button" className="icon-btn" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1} aria-label="Move image down"><Icon name="chevron-down" size={16} /></button>
                        <button type="button" className="icon-btn icon-btn-danger" onClick={() => setForm({ ...form, images: form.images.filter((_, n) => n !== i) })} aria-label="Remove image"><Icon name="trash" size={16} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="a-media-add">
                <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste an image link (https://...)" aria-label="Image link" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }} />
                <button type="button" className="btn btn-outline" onClick={addImage}><Icon name="plus" size={16} /> Add link</button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={upload} aria-label="Upload image file" />
                <button type="button" className="btn btn-primary" onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading}><Icon name="upload" size={16} /> {uploading ? 'Uploading...' : 'Upload image'}</button>
              </div>
              <p className="help">JPG, PNG, WEBP or GIF up to 4 MB. Square images (at least 800 x 800 px) look best.</p>
            </div>
          )}

          {tab === 'details' && (
            <div className="a-form-grid">
              <Field label="Weight / Size" htmlFor="pf-weight"><input id="pf-weight" className="input" value={form.weight} onChange={set('weight')} placeholder="3 kg" /></Field>
              <Field label="Age Group" htmlFor="pf-age"><input id="pf-age" className="input" value={form.ageGroup} onChange={set('ageGroup')} placeholder="Adult" /></Field>
              <Field label="Breed / suitable for" htmlFor="pf-breed" className="span-2"><input id="pf-breed" className="input" value={form.breedSize} onChange={set('breedSize')} placeholder="All Breeds" /></Field>
              <Field label="Ingredients / materials" htmlFor="pf-ing" className="span-2"><textarea id="pf-ing" className="textarea" rows={3} value={form.ingredients} onChange={set('ingredients')} /></Field>
              <Field label="Benefits (one per line)" htmlFor="pf-ben" className="span-2"><textarea id="pf-ben" className="textarea" rows={4} value={form.benefits} onChange={set('benefits')} placeholder={'Supports strong bones\nHealthy skin and coat'} /></Field>
              <Field label="Usage / feeding guide" htmlFor="pf-use" className="span-2"><textarea id="pf-use" className="textarea" rows={3} value={form.usage} onChange={set('usage')} /></Field>
            </div>
          )}

          <div className="a-form-foot">
            <Link to="/admin/products" className="btn btn-outline">Cancel</Link>
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}><Icon name="save" size={17} /> {busy ? 'Saving...' : 'Save Product'}</button>
          </div>
        </Card>
      </form>
    </>
  );
}
