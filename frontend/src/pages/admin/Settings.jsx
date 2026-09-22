import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { Field, Toggle } from '../../components/ui/Controls.jsx';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';
import { Card, PageHeader } from '../../components/admin/AdminUI.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function Settings() {
  useTitle('Settings');
  const toast = useToast();
  const { reload: reloadPublic } = useSettings();
  const fileRef = useRef(null);
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/settings'), []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    if (data) {
      const s = data.settings;
      setForm({
        storeName: s.storeName, tagline: s.tagline, contactEmail: s.contactEmail, contactPhone: s.contactPhone, whatsapp: s.whatsapp, address: s.address,
        shippingFee: String(s.shippingFee), freeShippingThreshold: String(s.freeShippingThreshold), onlinePaymentInstructions: s.onlinePaymentInstructions,
        heroImage: s.heroImage || '', aiEnabled: s.aiEnabled, social: { facebook: '', instagram: '', twitter: '', youtube: '', ...(s.social || {}) },
      });
    }
  }, [data]);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !form) return <PageLoader />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setSocial = (k) => (e) => setForm({ ...form, social: { ...form.social, [k]: e.target.value } });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/admin/settings', { ...form, shippingFee: Number(form.shippingFee) || 0, freeShippingThreshold: Number(form.freeShippingThreshold) || 0 });
      toast.success('Settings saved');
      reloadPublic();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const uploadHero = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { const r = await api.upload(file); setForm((f) => ({ ...f, heroImage: r.url })); toast.success('Image uploaded - remember to save'); } catch (err) { toast.error(err.message); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword.length < 6) { toast.error('New password must be at least 6 characters.'); return; }
    try { await api.put('/auth/me/password', pw); toast.success('Password changed'); setPw({ currentPassword: '', newPassword: '' }); } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Store details, shipping, payments and branding." />
      <form onSubmit={save} className="a-stack">
        <Card title="Store">
          <div className="a-form-grid">
            <Field label="Store name" htmlFor="s-name"><input id="s-name" className="input" value={form.storeName} onChange={set('storeName')} required /></Field>
            <Field label="Tagline" htmlFor="s-tag"><input id="s-tag" className="input" value={form.tagline} onChange={set('tagline')} /></Field>
            <Field label="Contact email" htmlFor="s-email"><input id="s-email" type="email" className="input" value={form.contactEmail} onChange={set('contactEmail')} /></Field>
            <Field label="Phone" htmlFor="s-phone"><input id="s-phone" className="input" value={form.contactPhone} onChange={set('contactPhone')} /></Field>
            <Field label="WhatsApp number" htmlFor="s-wa" help="Digits with country code, e.g. 923001234567"><input id="s-wa" className="input" value={form.whatsapp} onChange={set('whatsapp')} /></Field>
            <Field label="Address" htmlFor="s-addr"><input id="s-addr" className="input" value={form.address} onChange={set('address')} /></Field>
          </div>
        </Card>

        <Card title="Shipping & payments">
          <div className="a-form-grid">
            <Field label="Shipping fee (Rs.)" htmlFor="s-ship"><input id="s-ship" type="number" min="0" className="input" value={form.shippingFee} onChange={set('shippingFee')} /></Field>
            <Field label="Free shipping from (Rs.)" htmlFor="s-free" help="0 = shipping is never free"><input id="s-free" type="number" min="0" className="input" value={form.freeShippingThreshold} onChange={set('freeShippingThreshold')} /></Field>
            <Field label="Online payment instructions" htmlFor="s-pay" className="span-2" help="Shown to customers who choose online payment (JazzCash / Easypaisa / bank account details)."><textarea id="s-pay" className="textarea" rows={3} value={form.onlinePaymentInstructions} onChange={set('onlinePaymentInstructions')} /></Field>
          </div>
        </Card>

        <Card title="Branding & social">
          <div className="a-form-grid">
            <Field label="Home page hero image" className="span-2" help="Optional. Leave empty to use the built-in illustration.">
              <div className="a-hero-pick">
                {form.heroImage ? <img src={form.heroImage} alt="Hero preview" /> : <span className="a-muted">Using the built-in illustration</span>}
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={uploadHero} aria-label="Upload hero image" />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading}><Icon name="upload" size={15} /> {uploading ? 'Uploading...' : 'Upload'}</button>
                {form.heroImage && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, heroImage: '' })}>Remove</button>}
              </div>
            </Field>
            {['facebook', 'instagram', 'twitter', 'youtube'].map((k) => (
              <Field key={k} label={`${k.charAt(0).toUpperCase() + k.slice(1)} link`} htmlFor={`s-${k}`}><input id={`s-${k}`} className="input" value={form.social[k]} onChange={setSocial(k)} placeholder="https://" /></Field>
            ))}
          </div>
        </Card>

        <Card title="PawAI assistant">
          <div className="a-inline-toggle"><Toggle checked={form.aiEnabled} onChange={(v) => setForm({ ...form, aiEnabled: v })} label="Enable PawAI" /><span>{form.aiEnabled ? 'PawAI is available to customers' : 'PawAI is switched off'}</span></div>
          <p className="help">The OpenAI key is kept in <code>backend/.env</code> (OPENAI_API_KEY) and never reaches the browser.</p>
        </Card>

        <div className="a-form-foot a-sticky-foot"><button type="submit" className="btn btn-primary btn-lg" disabled={busy}><Icon name="save" size={17} /> {busy ? 'Saving...' : 'Save settings'}</button></div>
      </form>

      <form onSubmit={changePassword} className="a-stack" style={{ marginTop: 20 }}>
        <Card title="Admin password">
          <div className="a-form-grid">
            <Field label="Current password" htmlFor="ap-cur"><input id="ap-cur" type="password" className="input" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
            <Field label="New password" htmlFor="ap-new"><input id="ap-new" type="password" className="input" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          </div>
          <button type="submit" className="btn btn-outline">Change password</button>
        </Card>
      </form>
    </>
  );
}
