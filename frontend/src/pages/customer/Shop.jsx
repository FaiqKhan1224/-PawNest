import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import PetIcon from '../../components/ui/PetIcon.jsx';
import HeroArt from '../../assets/HeroArt.jsx';
import { EmptyState, ErrorState } from '../../components/ui/States.jsx';
import { Pagination } from '../../components/ui/Controls.jsx';
import ProductCard, { ProductCardSkeleton } from '../../components/shop/ProductCard.jsx';
import FilterPanel from '../../components/shop/FilterPanel.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { formatPrice, ANIMAL_LABEL, CATEGORY_LABEL } from '../../utils/format.js';

const SORTS = [
  { value: 'popular', label: 'Popularity' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
];

const list = (sp, key) => (sp.get(key) || '').split(',').filter(Boolean);

export default function Shop() {
  const [sp, setSp] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const q = sp.get('q') || '';
  const sort = sp.get('sort') || 'popular';
  const page = Math.max(1, Number(sp.get('page')) || 1);
  const deals = sp.get('deals') === 'true';
  const applied = useMemo(() => ({
    animal: list(sp, 'animal'),
    category: list(sp, 'category'),
    brand: list(sp, 'brand'),
    minPrice: sp.get('minPrice') || '',
    maxPrice: sp.get('maxPrice') || '',
    minRating: sp.get('minRating') || '',
  }), [sp]);

  const [term, setTerm] = useState(q);
  const debounced = useDebounce(term, 400);
  useEffect(() => { setTerm(q); }, [q]);

  const update = (changes, { keepPage = false } = {}) => {
    const next = new URLSearchParams(sp);
    Object.entries(changes).forEach(([k, v]) => {
      const value = Array.isArray(v) ? v.join(',') : v;
      if (value === '' || value === undefined || value === null || value === false) next.delete(k);
      else next.set(k, value);
    });
    if (!keepPage) next.delete('page');
    setSp(next);
  };

  useEffect(() => {
    if (debounced.trim() !== q.trim()) update({ q: debounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const key = sp.toString();
  const products = useFetch(() => api.get('/products', {
    ...applied, q, sort, page, limit: 12, deals: deals ? 'true' : undefined,
  }), [key]);
  const facets = useFetch(() => api.get('/products/facets', { animal: applied.animal, category: applied.category }), [applied.animal.join(), applied.category.join()]);
  const cats = useFetch(() => api.get('/categories'), []);

  const names = useMemo(() => {
    const animal = { ...ANIMAL_LABEL };
    const category = { ...CATEGORY_LABEL };
    if (cats.data) cats.data.categories.forEach((c) => { (c.kind === 'animal' ? animal : category)[c.slug] = c.name; });
    return { animal, category };
  }, [cats.data]);

  useTitle(applied.animal.length === 1 ? `${names.animal[applied.animal[0]] || 'Shop'}` : 'Shop');

  let bannerTitle = 'Premium Pet Food & Accessories';
  let bannerText = 'For every breed, every need, every pet.';
  if (applied.animal.length === 1) {
    bannerTitle = `${names.animal[applied.animal[0]] || 'Pet'} Food, Treats & Care`;
    bannerText = 'Choose from trusted brands, filtered for your pet.';
  } else if (applied.category.length === 1) {
    bannerTitle = `${names.category[applied.category[0]] || 'Products'} for Every Pet`;
  } else if (deals) {
    bannerTitle = 'Special Offers';
    bannerText = 'Discounted favourites, while stocks last.';
  }

  const chips = [
    ...applied.animal.map((v) => ({ label: names.animal[v] || v, remove: () => update({ animal: applied.animal.filter((x) => x !== v) }) })),
    ...applied.category.map((v) => ({ label: names.category[v] || v, remove: () => update({ category: applied.category.filter((x) => x !== v) }) })),
    ...applied.brand.map((v) => ({ label: v, remove: () => update({ brand: applied.brand.filter((x) => x !== v) }) })),
    ...(applied.minPrice || applied.maxPrice ? [{ label: `${formatPrice(applied.minPrice || 0)} - ${applied.maxPrice ? formatPrice(applied.maxPrice) : 'any'}`, remove: () => update({ minPrice: '', maxPrice: '' }) }] : []),
    ...(applied.minRating ? [{ label: `${applied.minRating}★ & up`, remove: () => update({ minRating: '' }) }] : []),
    ...(deals ? [{ label: 'On offer', remove: () => update({ deals: '' }) }] : []),
    ...(q ? [{ label: `"${q}"`, remove: () => update({ q: '' }) }] : []),
  ];

  const clearAll = () => setSp(new URLSearchParams());
  const panel = (onClose) => (
    <FilterPanel facets={facets.data} animalNames={names.animal} categoryNames={names.category} applied={applied} onApply={(d) => update(d)} onClear={clearAll} onClose={onClose} />
  );

  const data = products.data;

  return (
    <div className="shop container">
      <aside className="filters" aria-label="Product filters">{panel(null)}</aside>

      <section className="shop-main">
        <div className="shop-banner">
          <div>
            <h1>{bannerTitle}</h1>
            <p>{bannerText}</p>
            <div className="shop-banner-pets" aria-hidden="true">
              <PetIcon name="dog" size={26} color="#f0287f" /><PetIcon name="cat" size={26} color="#9a6fe0" /><PetIcon name="bird" size={26} color="#38a3f0" />
            </div>
          </div>
          <div className="shop-banner-art" aria-hidden="true"><HeroArt /></div>
        </div>

        <div className="shop-search">
          <Icon name="search" size={18} />
          <input type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search for pet products..." aria-label="Search products" />
        </div>

        <div className="shop-toolbar">
          <button type="button" className="btn btn-outline btn-sm filters-open" onClick={() => setShowFilters(true)}><Icon name="sliders" size={16} /> Filters{chips.length ? ` (${chips.length})` : ''}</button>
          <p className="shop-count" aria-live="polite">{data ? `${data.total} product${data.total === 1 ? '' : 's'}` : 'Loading products...'}</p>
          <label className="shop-sort">
            <Icon name="sliders" size={16} className="sort-icon" />
            <span>Sort by:</span>
            <select value={sort} onChange={(e) => update({ sort: e.target.value === 'popular' ? '' : e.target.value })} aria-label="Sort products">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>

        {chips.length > 0 && (
          <div className="chip-row" aria-label="Active filters">
            {chips.map((c) => (
              <button key={c.label} type="button" className="filter-chip" onClick={c.remove} aria-label={`Remove filter ${c.label}`}>{c.label}<Icon name="x" size={13} /></button>
            ))}
            <button type="button" className="link-btn" onClick={clearAll}>Clear all</button>
          </div>
        )}

        {products.error ? (
          <ErrorState error={products.error} onRetry={products.reload} title="We couldn't load the products" />
        ) : products.loading ? (
          <div className="product-grid">{Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
        ) : data.products.length === 0 ? (
          <EmptyState pet="cat" title="No products match your filters" text="Try removing a filter or searching for something else." action={<button type="button" className="btn btn-primary" onClick={clearAll}>Clear filters</button>} />
        ) : (
          <>
            <div className="product-grid">{data.products.map((p) => <ProductCard key={p._id} product={p} />)}</div>
            <Pagination page={data.page} pages={data.pages} onChange={(n) => { update({ page: n === 1 ? '' : String(n) }, { keepPage: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </>
        )}
      </section>

      {showFilters && (
        <div className="drawer-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowFilters(false); }}>
          <div className="drawer" role="dialog" aria-modal="true" aria-label="Filters">{panel(() => setShowFilters(false))}</div>
        </div>
      )}
    </div>
  );
}
