import Icon from './Icon.jsx';

export function Toggle({ checked, onChange, label, disabled, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`toggle ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
    </button>
  );
}

export function QtyStepper({ value, onChange, min = 1, max = 99, size = 'md' }) {
  return (
    <div className={`qty qty-${size}`}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease quantity"><Icon name="minus" size={14} /></button>
      <span aria-live="polite" aria-label={`Quantity ${value}`}>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase quantity"><Icon name="plus" size={14} /></button>
    </div>
  );
}

export function Badge({ tone = 'gray', children, className = '' }) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const items = [];
  const add = (n) => items.push(n);
  const span = 1;
  for (let n = 1; n <= pages; n += 1) {
    if (n === 1 || n === pages || (n >= page - span && n <= page + span)) add(n);
    else if (items[items.length - 1] !== '...') add('...');
  }
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="page-btn" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page"><Icon name="chevron-left" size={16} /></button>
      {items.map((n, i) => (n === '...'
        ? <span key={`gap${i}`} className="page-gap" aria-hidden="true">...</span>
        : <button type="button" key={n} className={`page-btn ${n === page ? 'is-active' : ''}`} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined} aria-label={`Page ${n}`}>{n}</button>))}
      <button type="button" className="page-btn" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page"><Icon name="chevron-right" size={16} /></button>
    </nav>
  );
}

export function Field({ label, error, help, children, htmlFor, className = '' }) {
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label && <label className="label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {help && !error && <p className="help">{help}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
