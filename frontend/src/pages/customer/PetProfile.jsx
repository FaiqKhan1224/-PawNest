import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import PetIcon from '../../components/ui/PetIcon.jsx';
import { Field } from '../../components/ui/Controls.jsx';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import InlineAsk from '../../components/pawai/InlineAsk.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ANIMAL_ICON, ANIMAL_LABEL } from '../../utils/format.js';

const BREEDS = {
  dogs: ['Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Husky', 'Pomeranian', 'Pug', 'Beagle', 'Rottweiler', 'Bulldog', 'Mixed breed'],
  cats: ['Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Tabby Cat', 'Bengal', 'Mixed breed'],
  birds: ['Budgerigar', 'Cockatiel', 'African Grey', 'Lovebird', 'Macaw', 'Canary', 'Finch'],
  rabbits: ['Holland Lop', 'Netherland Dwarf', 'Lionhead', 'Mixed breed'],
  fish: ['Goldfish', 'Betta', 'Guppy', 'Koi'],
  'small-pets': ['Syrian Hamster', 'Dwarf Hamster', 'Guinea Pig', 'Gerbil'],
};

const blank = { name: '', animal: 'dogs', breed: '', ageYears: '', gender: 'Unknown', weightKg: '', diet: '' };

export default function PetProfile() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const loaded = useFetch(() => (isNew ? Promise.resolve(null) : api.get(`/pets/${id}`)), [id]);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useTitle(isNew ? 'Add a pet' : 'Pet profile');

  useEffect(() => {
    if (loaded.data && loaded.data.pet) {
      const p = loaded.data.pet;
      setForm({ name: p.name, animal: p.animal, breed: p.breed, ageYears: String(p.ageYears ?? ''), gender: p.gender, weightKg: String(p.weightKg ?? ''), diet: p.diet });
    }
  }, [loaded.data]);

  if (loaded.loading) return <PageLoader />;
  if (loaded.error) return <div className="container section"><ErrorState error={loaded.error} title={loaded.error.status === 404 ? 'Pet not found' : undefined} /><p className="center"><Link to="/dashboard" className="btn btn-primary">Back to dashboard</Link></p></div>;

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); };

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.name.trim()) found.name = 'Please give your pet a name.';
    if (form.ageYears !== '' && (Number(form.ageYears) < 0 || Number(form.ageYears) > 40)) found.ageYears = 'Enter an age between 0 and 40.';
    if (form.weightKg !== '' && (Number(form.weightKg) < 0 || Number(form.weightKg) > 200)) found.weightKg = 'Enter a weight between 0 and 200 kg.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const body = { ...form, ageYears: Number(form.ageYears) || 0, weightKg: Number(form.weightKg) || 0 };
      if (isNew) {
        await api.post('/pets', body);
        toast.success(`${form.name} was added!`);
        navigate('/dashboard');
      } else {
        await api.put(`/pets/${id}`, body);
        toast.success('Pet profile saved.');
      }
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try { await api.del(`/pets/${id}`); toast.success('Pet removed.'); navigate('/dashboard'); } catch (err) { toast.error(err.message); setBusy(false); }
  };

  return (
    <div className="container section pet-page">
      <Link to="/dashboard" className="back-link"><Icon name="arrow-left" size={16} /> Dashboard</Link>
      <div className="pet-page-grid">
        <form className="panel pet-form" onSubmit={save} noValidate>
          <div className="pet-form-head">
            <span className="pet-card-avatar"><PetIcon name={ANIMAL_ICON[form.animal]} size={48} color="#f0287f" /></span>
            <h1>{isNew ? 'Add a Pet' : 'Pet Profile'}</h1>
          </div>
          <div className="form-grid">
            <Field label="Pet Name" htmlFor="pet-name" error={errors.name}><input id="pet-name" className="input" value={form.name} onChange={set('name')} placeholder="Milo" maxLength={60} /></Field>
            <Field label="Animal" htmlFor="pet-animal">
              <select id="pet-animal" className="select" value={form.animal} onChange={(e) => setForm({ ...form, animal: e.target.value, breed: '' })}>
                {Object.entries(ANIMAL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Breed" htmlFor="pet-breed">
              <input id="pet-breed" className="input" list="breed-list" value={form.breed} onChange={set('breed')} placeholder="Golden Retriever" maxLength={80} />
              <datalist id="breed-list">{(BREEDS[form.animal] || []).map((b) => <option key={b} value={b} />)}</datalist>
            </Field>
            <Field label="Age (years)" htmlFor="pet-age" error={errors.ageYears}><input id="pet-age" className="input" type="number" min="0" max="40" step="0.5" value={form.ageYears} onChange={set('ageYears')} placeholder="2" /></Field>
            <Field label="Gender" htmlFor="pet-gender">
              <select id="pet-gender" className="select" value={form.gender} onChange={set('gender')}><option>Male</option><option>Female</option><option>Unknown</option></select>
            </Field>
            <Field label="Weight (kg)" htmlFor="pet-weight" error={errors.weightKg}><input id="pet-weight" className="input" type="number" min="0" max="200" step="0.1" value={form.weightKg} onChange={set('weightKg')} placeholder="4.5" /></Field>
            <Field label="Normal Food" htmlFor="pet-diet" className="span-2"><input id="pet-diet" className="input" value={form.diet} onChange={set('diet')} placeholder="e.g. Royal Canin Adult, twice a day" maxLength={200} /></Field>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}><Icon name="save" size={18} /> {busy ? 'Saving...' : 'Save Changes'}</button>
            {!isNew && <button type="button" className="btn btn-outline btn-danger-outline" onClick={() => setConfirm(true)}><Icon name="trash" size={16} /> Remove pet</button>}
          </div>
        </form>

        <div className="stack">
          {!isNew && settings.aiEnabled && (
            <InlineAsk title={`Ask PawAI about ${form.name || 'your pet'}`} subtitle="Advice based on this pet's profile." placeholder="What food is best for my pet?" petId={id} />
          )}
          <div className="panel">
            <h2>Shop for {ANIMAL_LABEL[form.animal]}</h2>
            <p className="muted">Browse food, treats and care made for {ANIMAL_LABEL[form.animal].toLowerCase()}.</p>
            <Link to={`/shop?animal=${form.animal}`} className="btn btn-soft">Browse {ANIMAL_LABEL[form.animal]} <Icon name="arrow-right" size={16} /></Link>
          </div>
        </div>
      </div>
      <ConfirmDialog open={confirm} title={`Remove ${form.name || 'this pet'}?`} message="This deletes the pet profile. Your orders are not affected." confirmLabel="Remove pet" busy={busy} onConfirm={remove} onClose={() => setConfirm(false)} />
    </div>
  );
}
