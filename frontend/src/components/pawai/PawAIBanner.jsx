import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import PawAIAvatar from './PawAIAvatar.jsx';

/** "Meet PawAI" strip: type a question and continue in the full chat page. */
export default function PawAIBanner({ title = 'Meet PawAI', subtitle = 'Your Pet Care Shopping Assistant', placeholder = 'What would you like to know about pet care?', extraQuery = '' }) {
  const [text, setText] = useState('');
  const navigate = useNavigate();
  const go = (e) => {
    e.preventDefault();
    const q = encodeURIComponent(text.trim());
    navigate(`/pawai${q ? `?q=${q}` : ''}${extraQuery}`);
  };
  return (
    <section className="pawai-banner" aria-label="PawAI assistant">
      <div className="pawai-banner-id">
        <PawAIAvatar size={64} />
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <form className="pawai-banner-form" onSubmit={go}>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label="Ask PawAI" dir="auto" maxLength={300} />
        <button type="submit" className="pawai-go" aria-label="Ask PawAI"><Icon name="arrow-right" size={20} /></button>
      </form>
    </section>
  );
}
