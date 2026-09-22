import PetIcon from './PetIcon.jsx';
import Icon from './Icon.jsx';

export function Spinner({ label = 'Loading' }) {
  return <span className="spinner" role="status" aria-label={label} />;
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader-paw"><PetIcon name="paw" size={44} color="#f0287f" /></span>
      <p>{label}</p>
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', radius = 8, className = '', style }) {
  return <span className={`skeleton ${className}`} style={{ height, width, borderRadius: radius, ...style }} aria-hidden="true" />;
}

export function EmptyState({ pet = 'paw', title, text, action, compact }) {
  return (
    <div className={`empty ${compact ? 'empty-compact' : ''}`}>
      <div className="empty-art">
        <PetIcon name={pet} size={compact ? 48 : 64} color="#f6a9cb" />
      </div>
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="empty error-state" role="alert">
      <div className="empty-art empty-art-error"><Icon name="alert" size={34} /></div>
      <h3>{title}</h3>
      <p className="muted">{(error && error.message) || 'Please try again.'}</p>
      {onRetry && <button type="button" className="btn btn-primary btn-sm" onClick={() => onRetry()}><Icon name="refresh" size={16} /> Try again</button>}
    </div>
  );
}
