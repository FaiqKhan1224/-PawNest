const compact = (n) => (n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n)));

/** Smooth-cornered line + area chart. data: [{ label, value }] */
export function LineChart({ data, height = 240, color = '#f0287f', format = compact }) {
  const W = 640;
  const H = height;
  const pad = { l: 46, r: 16, t: 16, b: 30 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const top = Math.ceil((max * 1.1) / (10 ** (String(Math.round(max)).length - 1))) * (10 ** (String(Math.round(max)).length - 1));
  const x = (i) => pad.l + (data.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (data.length - 1));
  const y = (v) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  const points = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`);
  const area = `${pad.l},${H - pad.b} ${points.join(' ')} ${x(data.length - 1).toFixed(1)},${H - pad.b}`;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart">
      <defs>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(top * t)} y2={y(top * t)} stroke="#e9e5f3" strokeDasharray="3 5" />
          <text x={pad.l - 8} y={y(top * t) + 4} textAnchor="end" className="chart-tick">{format(top * t)}</text>
        </g>
      ))}
      <polygon points={area} fill="url(#lc-fill)" />
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={d.label + i}>
          <circle cx={x(i)} cy={y(d.value)} r="4.5" fill="#fff" stroke={color} strokeWidth="2.5"><title>{`${d.label}: ${d.value.toLocaleString('en-US')}`}</title></circle>
          <text x={x(i)} y={H - 8} textAnchor="middle" className="chart-tick">{d.label}</text>
        </g>
      ))}
    </svg>
  );
}

/** Vertical bars. data: [{ label, value }] */
export function BarChart({ data, height = 220, color = '#8b5cf6', format = compact }) {
  const W = 640;
  const H = height;
  const pad = { l: 46, r: 12, t: 16, b: 30 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = (W - pad.l - pad.r) / Math.max(1, data.length);
  const bw = Math.min(46, step * 0.6);
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bar chart">
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(max * t)} y2={y(max * t)} stroke="#e9e5f3" strokeDasharray="3 5" />
          <text x={pad.l - 8} y={y(max * t) + 4} textAnchor="end" className="chart-tick">{format(max * t)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = pad.l + step * i + step / 2;
        return (
          <g key={d.label + i}>
            <rect x={cx - bw / 2} y={y(d.value)} width={bw} height={Math.max(0, H - pad.b - y(d.value))} rx="7" fill={color}><title>{`${d.label}: ${d.value.toLocaleString('en-US')}`}</title></rect>
            <text x={cx} y={H - 8} textAnchor="middle" className="chart-tick">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Horizontal ranked bars. items: [{ label, sub, value, display }] */
export function BarList({ items, color = '#f0287f' }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="muted small">No data yet.</p>;
  return (
    <ul className="bar-list">
      {items.map((i) => (
        <li key={i.label}>
          <div className="bar-list-top"><span className="truncate">{i.label}{i.sub && <small>{i.sub}</small>}</span><strong>{i.display}</strong></div>
          <span className="bar-list-track"><span style={{ width: `${(i.value / max) * 100}%`, background: color }} /></span>
        </li>
      ))}
    </ul>
  );
}

export function Donut({ data, size = 170 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 15.9155;
  let offset = 25;
  return (
    <div className="donut">
      <svg viewBox="0 0 42 42" width={size} height={size} role="img" aria-label="Distribution chart">
        <circle cx="21" cy="21" r={r} fill="none" stroke="#f0ecf8" strokeWidth="6" />
        {total > 0 && data.map((d) => {
          const pct = (d.value / total) * 100;
          const el = <circle key={d.label} cx="21" cy="21" r={r} fill="none" stroke={d.color} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset}><title>{`${d.label}: ${d.value}`}</title></circle>;
          offset -= pct;
          return el;
        })}
        <text x="21" y="22.5" textAnchor="middle" className="donut-num">{total}</text>
      </svg>
      <ul className="donut-legend">
        {data.map((d) => <li key={d.label}><span style={{ background: d.color }} />{d.label}<strong>{d.value}</strong></li>)}
      </ul>
    </div>
  );
}
