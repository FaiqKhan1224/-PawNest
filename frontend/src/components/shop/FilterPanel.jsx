import { useEffect, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import PetIcon from '../ui/PetIcon.jsx';
import PriceRange from './PriceRange.jsx';
import { ANIMAL_ICON } from '../../utils/format.js';

const toggleIn = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

function Group({ title, children }) {
  return (
    <fieldset className="filter-group">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Filter sidebar. Changes are held in a draft and applied with the "Apply Filters" button
 * (as in the design), which writes them into the URL.
 */
export default function FilterPanel({ facets, animalNames, categoryNames, applied, onApply, onClear, onClose }) {
  const bound = Math.max(1000, Math.ceil(((facets && facets.priceRange && facets.priceRange.max) || 10000) / 500) * 500);
  const [draft, setDraft] = useState(applied);

  useEffect(() => { setDraft(applied); }, [applied]);

  const low = draft.minPrice === '' || draft.minPrice === undefined ? 0 : Number(draft.minPrice);
  const high = draft.maxPrice === '' || draft.maxPrice === undefined ? bound : Number(draft.maxPrice);

  const apply = () => {
    onApply({
      ...draft,
      minPrice: low > 0 ? String(low) : '',
      maxPrice: high < bound ? String(high) : '',
    });
    if (onClose) onClose();
  };

  return (
    <div className="filters-panel">
      <div className="filters-head">
        <h2>Filters</h2>
        {onClose && <button type="button" className="icon-btn" onClick={onClose} aria-label="Close filters"><Icon name="x" size={20} /></button>}
      </div>

      <Group title="Animal">
        {(facets ? facets.animals : []).map((a) => (
          <label key={a.value} className="check">
            <input type="checkbox" checked={draft.animal.includes(a.value)} onChange={() => setDraft({ ...draft, animal: toggleIn(draft.animal, a.value) })} />
            <span className="check-box" aria-hidden="true"><Icon name="check" size={12} /></span>
            <span className="check-label"><PetIcon name={ANIMAL_ICON[a.value]} size={18} color="#f0287f" />{animalNames[a.value] || a.value}</span>
            <span className="check-count">({a.count})</span>
          </label>
        ))}
      </Group>

      <Group title="Category">
        {(facets ? facets.categories : []).map((c) => (
          <label key={c.value} className="check">
            <input type="checkbox" checked={draft.category.includes(c.value)} onChange={() => setDraft({ ...draft, category: toggleIn(draft.category, c.value) })} />
            <span className="check-box" aria-hidden="true"><Icon name="check" size={12} /></span>
            <span className="check-label">{categoryNames[c.value] || c.value}</span>
            <span className="check-count">({c.count})</span>
          </label>
        ))}
      </Group>

      <Group title="Brand">
        {(facets ? facets.brands : []).map((b) => (
          <label key={b.value} className="check">
            <input type="checkbox" checked={draft.brand.includes(b.value)} onChange={() => setDraft({ ...draft, brand: toggleIn(draft.brand, b.value) })} />
            <span className="check-box" aria-hidden="true"><Icon name="check" size={12} /></span>
            <span className="check-label">{b.value}</span>
            <span className="check-count">({b.count})</span>
          </label>
        ))}
      </Group>

      <Group title="Rating">
        {[0, 4.5, 4, 3].map((r) => (
          <label key={r} className="check check-radio">
            <input type="radio" name="minRating" checked={String(draft.minRating || 0) === String(r)} onChange={() => setDraft({ ...draft, minRating: r ? String(r) : '' })} />
            <span className="check-box" aria-hidden="true" />
            <span className="check-label">{r === 0 ? 'All ratings' : `${r}★ & up`}</span>
          </label>
        ))}
      </Group>

      <Group title="Price Range">
        <PriceRange min={0} max={bound} low={low} high={high} onChange={(l, h) => setDraft({ ...draft, minPrice: String(l), maxPrice: String(h) })} />
        <p className="help">Products with a hidden price are not included when you filter by price.</p>
      </Group>

      <div className="filters-actions">
        <button type="button" className="btn btn-primary btn-block" onClick={apply}>Apply Filters</button>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => { onClear(); if (onClose) onClose(); }}>Clear all</button>
      </div>
    </div>
  );
}
