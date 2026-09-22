import Icon from './Icon.jsx';

/** Star row with fractional fill (e.g. 4.6 fills 92%). */
export function Stars({ value = 0, size = 16, label = true }) {
  const pct = Math.max(0, Math.min(100, (Number(value) / 5) * 100));
  return (
    <span className="stars" style={{ fontSize: size, '--pct': `${pct}%` }} role={label ? 'img' : undefined} aria-label={label ? `${Number(value).toFixed(1)} out of 5 stars` : undefined} aria-hidden={label ? undefined : true}>
      <span className="stars-base">★★★★★</span>
      <span className="stars-fill">★★★★★</span>
    </span>
  );
}

/** Compact "★ 4.6 (128)" used on cards. */
export function RatingLine({ value = 0, count = 0 }) {
  if (!count) return <span className="rating-line rating-none">No reviews yet</span>;
  return (
    <span className="rating-line">
      <span className="rating-star" aria-hidden="true">★</span>
      <strong>{Number(value).toFixed(1)}</strong>
      <span className="rating-count">({count})</span>
      <span className="sr-only">{`Rated ${Number(value).toFixed(1)} out of 5 from ${count} reviews`}</span>
    </span>
  );
}

/** Clickable 1-5 star picker. */
export function StarInput({ value, onChange, size = 28 }) {
  return (
    <div className="star-input" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={`star-input-btn ${n <= value ? 'is-on' : ''}`}
          onClick={() => onChange(n)}
        >
          <Icon name="star" size={size} />
        </button>
      ))}
    </div>
  );
}
