import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import PawAIAvatar from './PawAIAvatar.jsx';
import { RatingLine } from '../ui/Stars.jsx';
import Price from '../shop/Price.jsx';
import { api } from '../../services/api.js';
import { useCart } from '../../context/CartContext.jsx';
import { imageOf } from '../../utils/format.js';

const WELCOME = "Hi! I'm PawAI, your pet-care shopping assistant. Ask me about food, grooming, training, accessories or breeds - in English, Urdu or Roman Urdu.";
const DEFAULT_SUGGESTIONS = ['Show me food under 3000', 'What accessories do I need?', 'Ask for care tips'];

function ChatProduct({ product }) {
  const { add } = useCart();
  return (
    <div className="chat-product">
      <Link to={`/product/${product.slug}`} className="chat-product-img"><img src={imageOf(product)} alt="" loading="lazy" /></Link>
      <Link to={`/product/${product.slug}`} className="chat-product-name">{product.name}</Link>
      <RatingLine value={product.rating} count={product.reviewCount} />
      <Price product={product} size="sm" />
      <button
        type="button"
        className="btn btn-primary btn-sm btn-block"
        disabled={product.priceHidden || !product.inStock}
        onClick={() => add(product)}
      >
        {product.priceHidden ? 'Price unavailable' : product.inStock ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  );
}

/**
 * PawAI chat. Every answer comes from POST /api/ai/chat - product cards are real
 * products loaded from MongoDB by the backend (hidden prices stay hidden).
 */
export default function ChatWindow({ compact = false, petId = '', productId = '', initialMessage = '', storageKey = '', suggestions = DEFAULT_SUGGESTIONS, placeholder = 'Type your message...', greeting = WELCOME }) {
  const [messages, setMessages] = useState(() => {
    if (!storageKey) return [];
    try { return JSON.parse(sessionStorage.getItem(storageKey)) || []; } catch (err) { return []; }
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const sentInitial = useRef(false);
  const idRef = useRef(1);

  useEffect(() => {
    if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
  }, [messages, storageKey]);

  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, busy]);

  const send = useCallback(async (text) => {
    const message = String(text || '').trim();
    if (!message || busy) return;
    const history = messages.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })).slice(-8);
    setMessages((list) => [...list, { id: `u${idRef.current++}${Date.now()}`, role: 'user', content: message }]);
    setInput('');
    setBusy(true);
    try {
      const data = await api.post('/ai/chat', { message, history, petId: petId || undefined, productId: productId || undefined });
      setMessages((list) => [...list, { id: `a${idRef.current++}${Date.now()}`, role: 'assistant', content: data.reply, products: data.products, followUps: data.followUps }]);
    } catch (err) {
      setMessages((list) => [...list, { id: `e${idRef.current++}${Date.now()}`, role: 'assistant', content: err.message, error: true, retry: message }]);
    } finally {
      setBusy(false);
    }
  }, [busy, messages, petId, productId]);

  useEffect(() => {
    if (initialMessage && !sentInitial.current) {
      sentInitial.current = true;
      send(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && !m.error);
  const chips = (lastAssistant && lastAssistant.followUps && lastAssistant.followUps.length ? lastAssistant.followUps : suggestions).slice(0, 3);

  return (
    <div className={`chat ${compact ? 'chat-compact' : ''}`}>
      <div className="chat-scroll" ref={scrollRef} role="log" aria-live="polite" aria-label="Conversation with PawAI">
        <div className="chat-row is-bot">
          <span className="chat-avatar"><PawAIAvatar size={32} /></span>
          <div className="chat-bubble" dir="auto">{greeting}</div>
        </div>
        {messages.map((m) => (
          <div key={m.id} className={`chat-row ${m.role === 'user' ? 'is-user' : 'is-bot'}`}>
            {m.role !== 'user' && <span className="chat-avatar"><PawAIAvatar size={32} /></span>}
            <div className="chat-stack">
              <div className={`chat-bubble ${m.error ? 'is-error' : ''}`} dir="auto">
                {m.content}
                {m.error && m.retry && <button type="button" className="chat-retry" onClick={() => send(m.retry)}><Icon name="refresh" size={14} /> Try again</button>}
              </div>
              {m.products && m.products.length > 0 && (
                <div className="chat-products">{m.products.map((p) => <ChatProduct key={p._id} product={p} />)}</div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="chat-row is-bot">
            <span className="chat-avatar"><PawAIAvatar size={32} /></span>
            <div className="chat-bubble chat-typing" aria-label="PawAI is typing"><span /><span /><span /></div>
          </div>
        )}
      </div>

      <div className="chat-chips">
        {chips.map((s) => <button key={s} type="button" className="chip-btn" onClick={() => send(s)} disabled={busy}>{s}</button>)}
      </div>

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} maxLength={800} aria-label="Message to PawAI" dir="auto" />
        <button type="submit" className="chat-send" disabled={busy || !input.trim()} aria-label="Send message"><Icon name="send" size={18} /></button>
      </form>
    </div>
  );
}
