import { formatPrice } from '../../utils/format.js';

export default function PriceRange({ min = 0, max = 10000, low, high, onChange, step = 100 }) {
  const span = Math.max(1, max - min);
  const pct = (v) => ((v - min) / span) * 100;
  return (
    <div className="range">
      <div className="range-slider">
        <div className="range-track"><div className="range-fill" style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }} /></div>
        <input type="range" min={min} max={max} step={step} value={low} aria-label="Minimum price" onChange={(e) => onChange(Math.min(Number(e.target.value), high - step), high)} />
        <input type="range" min={min} max={max} step={step} value={high} aria-label="Maximum price" onChange={(e) => onChange(low, Math.max(Number(e.target.value), low + step))} />
      </div>
      <div className="range-values"><span>{formatPrice(low)}</span><span>{formatPrice(high)}</span></div>
    </div>
  );
}
