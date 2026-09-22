import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PawAIAvatar from '../../components/pawai/PawAIAvatar.jsx';
import ChatWindow from '../../components/pawai/ChatWindow.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

const TOPICS = [
  ['Pet food & nutrition', 'What food is best for a 2 year old Persian cat?'],
  ['Grooming', 'How often should I bathe my dog?'],
  ['Training', 'Meray puppy ko sit sikhane ka tarika batao'],
  ['Accessories', 'What accessories do I need for a new kitten?'],
  ['Breeds', 'Which dog breed suits a small apartment?'],
  ['Urdu / Roman Urdu', 'میرے طوطے کے لیے کون سا دانہ بہتر ہے؟'],
];

export default function PawAIChat() {
  useTitle('PawAI');
  const { user } = useAuth();
  const { settings } = useSettings();
  const [sp, setSp] = useSearchParams();
  const [initial] = useState(sp.get('q') || '');
  const [productId] = useState(sp.get('product') || '');
  const [petId, setPetId] = useState(sp.get('pet') || '');
  const [chatKey, setChatKey] = useState(0);
  const pets = useFetch(() => (user ? api.get('/pets') : Promise.resolve({ pets: [] })), [user && user._id]);

  // Remove ?q= once used so a refresh doesn't ask the same question twice.
  useEffect(() => {
    if (sp.get('q')) {
      const next = new URLSearchParams(sp);
      next.delete('q');
      setSp(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!settings.aiEnabled) {
    return <div className="container section"><EmptyState pet="bird" title="PawAI is taking a break" text="Our assistant is switched off right now. You can still browse the shop or contact us." action={<Link to="/shop" className="btn btn-primary">Browse the shop</Link>} /></div>;
  }

  const petList = pets.data ? pets.data.pets : [];

  return (
    <div className="pawai-page container">
      <div className="pawai-card">
        <header className="pawai-head">
          <PawAIAvatar size={44} />
          <div>
            <h1>PawNest <span>|</span> PawAI</h1>
            <p>Your pet care shopping assistant</p>
          </div>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => { sessionStorage.removeItem('pawnest_chat'); setChatKey((k) => k + 1); }}><Icon name="refresh" size={15} /> New chat</button>
        </header>
        {petList.length > 0 && (
          <label className="pawai-pet">
            <span>Chatting about</span>
            <select value={petId} onChange={(e) => setPetId(e.target.value)} aria-label="Choose a pet for personalised advice">
              <option value="">No specific pet</option>
              {petList.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.breed || p.animal})</option>)}
            </select>
          </label>
        )}
        <ChatWindow key={chatKey} storageKey="pawnest_chat" initialMessage={initial} petId={petId} productId={productId} />
      </div>

      <aside className="pawai-side">
        <h2>What can I help with?</h2>
        <p className="muted">Ask in English, Urdu or Roman Urdu - or mix them.</p>
        <ul className="topic-list">
          {TOPICS.map(([label, example]) => (
            <li key={label}><strong>{label}</strong><span dir="auto">&ldquo;{example}&rdquo;</span></li>
          ))}
        </ul>
        <p className="muted small">PawAI is a shopping and care assistant, not a vet. For health problems, please see a veterinarian. Product suggestions and prices come live from our store.</p>
      </aside>
    </div>
  );
}
