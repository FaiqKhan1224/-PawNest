import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { Badge, Toggle } from '../../components/ui/Controls.jsx';
import { ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { Card, PageHeader, StatCard, TableWrap } from '../../components/admin/AdminUI.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/format.js';

const STATUS = {
  online: { tone: 'green', label: 'Online', text: 'PawAI is answering with OpenAI.' },
  basic: { tone: 'amber', label: 'Basic mode', text: 'No OPENAI_API_KEY is set on the server, so PawAI uses its built-in answers. Add the key to backend/.env and restart for full AI.' },
  offline: { tone: 'red', label: 'Offline', text: 'PawAI is switched off. Customers see a friendly notice instead.' },
};
const LANG = { en: 'English', ur: 'Urdu', 'roman-ur': 'Roman Urdu', mixed: 'Mixed' };

export default function AIManagement() {
  useTitle('AI Management');
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/ai/overview'), []);
  const [busy, setBusy] = useState(false);

  const toggle = async (aiEnabled) => {
    setBusy(true);
    try { await api.patch('/admin/ai/enabled', { aiEnabled }); toast.success(aiEnabled ? 'PawAI switched on' : 'PawAI switched off'); reload(true); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  if (error) return <ErrorState error={error} onRetry={reload} />;
  const st = data && STATUS[data.status];

  return (
    <>
      <PageHeader title="AI Management" subtitle="Monitor PawAI, the shopping assistant." actions={<button type="button" className="btn btn-outline btn-sm" onClick={() => reload(true)}><Icon name="refresh" size={15} /> Refresh</button>} />
      {loading && !data ? <Skeleton height={320} /> : (
        <>
          <Card>
            <div className="a-ai-status">
              <div><span className="a-ai-label">AI Status</span><Badge tone={st.tone}><span className="a-dot" /> {st.label}</Badge></div>
              <div><span className="a-ai-label">Provider</span><strong>{data.provider}</strong></div>
              <div><span className="a-ai-label">Model</span><strong>{data.model}</strong></div>
              <div className="a-ai-switch"><span className="a-ai-label">PawAI enabled</span><Toggle checked={data.aiEnabled} disabled={busy} onChange={toggle} label="Enable PawAI" /></div>
            </div>
            <p className="a-muted small">{st.text}</p>
            {data.lastError && <p className="a-form-error"><Icon name="alert" size={15} /> Last OpenAI problem ({formatDate(data.lastError.at, true)}): {data.lastError.message}. Customers were served basic answers meanwhile.</p>}
          </Card>

          <div className="a-stats">
            <StatCard label="Questions today" value={data.usage.todayQuestions} icon="message" />
            <StatCard label="Total questions" value={data.usage.totalQuestions.toLocaleString('en-US')} icon="cpu" tone="purple" />
            <StatCard label="Tokens today" value={data.usage.tokensToday.toLocaleString('en-US')} icon="activity" tone="blue" />
            <StatCard label="Total tokens" value={data.usage.tokensTotal.toLocaleString('en-US')} icon="layers" tone="green" />
          </div>

          <div className="a-grid-2">
            <Card title="Popular Questions">
              {data.popularQuestions.length === 0 ? <p className="a-muted">No questions asked yet.</p> : (
                <ul className="a-questions">{data.popularQuestions.map((p) => <li key={p.question}><Icon name="message" size={15} /><span dir="auto">{p.question}</span><Badge tone="purple">{p.count}x</Badge></li>)}</ul>
              )}
            </Card>
            <Card title="Languages & modes">
              <ul className="a-list a-kv">
                {data.languages.map((l) => <li key={l.language}><span>{LANG[l.language] || l.language}</span><strong>{l.count}</strong></li>)}
                {data.modes.map((m) => <li key={m.mode}><span>{m.mode === 'openai' ? 'Answered by OpenAI' : 'Answered in basic mode'}</span><strong>{m.count}</strong></li>)}
                {!data.languages.length && !data.modes.length && <li className="a-muted">Nothing yet.</li>}
              </ul>
            </Card>
          </div>

          <Card title="Recent conversations">
            {data.recent.length === 0 ? <p className="a-muted">Conversations will appear here.</p> : (
              <TableWrap>
                <thead><tr><th>When</th><th>Customer</th><th>Question</th><th>Language</th><th>Mode</th><th>Products</th></tr></thead>
                <tbody>
                  {data.recent.map((r) => (
                    <tr key={r._id}>
                      <td className="a-muted">{formatDate(r.createdAt, true)}</td>
                      <td>{r.user}</td>
                      <td className="a-wrap" dir="auto">{r.question}</td>
                      <td>{LANG[r.language] || r.language}</td>
                      <td><Badge tone={r.mode === 'openai' ? 'green' : 'amber'}>{r.mode === 'openai' ? 'OpenAI' : 'Basic'}</Badge>{r.error && <small className="a-block a-muted">fallback</small>}</td>
                      <td>{r.products}</td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>
        </>
      )}
    </>
  );
}
