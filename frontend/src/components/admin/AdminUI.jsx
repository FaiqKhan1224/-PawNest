import Icon from '../ui/Icon.jsx';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="a-page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="a-page-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon, tone = 'pink', hint }) {
  return (
    <div className={`a-stat tone-${tone}`}>
      <span className="a-stat-icon"><Icon name={icon} size={20} /></span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </div>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`a-card ${className}`}>
      {(title || actions) && (
        <header className="a-card-head">
          {title && <h2>{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function TableWrap({ children }) {
  return <div className="a-table-wrap"><table className="a-table">{children}</table></div>;
}

export function Tabs({ tabs, value, onChange, label = 'Tabs' }) {
  return (
    <div className="a-tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.value} type="button" role="tab" aria-selected={value === t.value} className={`a-tab ${value === t.value ? 'is-active' : ''}`} onClick={() => onChange(t.value)}>
          {t.label}{t.count !== undefined && <span className="a-tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  return (
    <label className="a-search">
      <Icon name="search" size={16} />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </label>
  );
}
