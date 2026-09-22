import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import PawAIAvatar from './PawAIAvatar.jsx';
import ChatWindow from './ChatWindow.jsx';

/** Compact "Ask PawAI" card that expands into a live chat right where the customer is. */
export default function InlineAsk({ title, subtitle, placeholder, productId = '', petId = '', suggestions }) {
  const [text, setText] = useState('');
  const [started, setStarted] = useState(null);

  const start = (e) => {
    e.preventDefault();
    setStarted(text.trim());
  };

  return (
    <section className="ask-card" aria-label="Ask PawAI">
      <div className="ask-head">
        <PawAIAvatar size={44} />
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {started === null ? (
        <form className="ask-form" onSubmit={start}>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={title} dir="auto" maxLength={300} />
          <button type="submit" className="pawai-go" aria-label="Start chat"><Icon name="arrow-right" size={20} /></button>
        </form>
      ) : (
        <ChatWindow compact productId={productId} petId={petId} initialMessage={started} suggestions={suggestions} placeholder="Type your message..." />
      )}
    </section>
  );
}
