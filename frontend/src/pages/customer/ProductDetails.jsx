import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { Stars } from '../../components/ui/Stars.jsx';
import { Badge, QtyStepper } from '../../components/ui/Controls.jsx';
import { ErrorState, Skeleton } from '../../components/ui/States.jsx';
import Price from '../../components/shop/Price.jsx';
import ProductCard from '../../components/shop/ProductCard.jsx';
import Reviews from '../../components/shop/Reviews.jsx';
import InlineAsk from '../../components/pawai/InlineAsk.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ANIMAL_SINGULAR, CATEGORY_LABEL, imageOf, toSlugLabel } from '../../utils/format.js';

const TABS = [
  { id: 'description', label: 'Description' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'usage', label: 'Usage' },
  { id: 'reviews', label: 'Reviews' },
];

export default function ProductDetails() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useFetch(() => api.get(`/products/${slug}`), [slug]);
  const { add } = useCart();
  const wishlist = useWishlist();
  const { settings } = useSettings();
  const [image, setImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');

  const product = data && data.product;
  useTitle(product ? product.name : 'Product');
  useEffect(() => { setImage(0); setQty(1); setTab('description'); }, [slug]);

  if (error) {
    return (
      <div className="container section">
        <ErrorState error={error} onRetry={error.status === 404 ? null : reload} title={error.status === 404 ? 'Product not found' : 'We could not load this product'} />
        <p className="center"><Link to="/shop" className="btn btn-primary">Back to shop</Link></p>
      </div>
    );
  }
  if (loading || !product) {
    return (
      <div className="container section pd-skeleton">
        <Skeleton height={420} radius={24} />
        <div className="stack"><Skeleton height={24} width="70%" /><Skeleton height={16} width="40%" /><Skeleton height={36} width="35%" /><Skeleton height={160} /></div>
      </div>
    );
  }

  const liked = wishlist.has(product._id);
  const specs = [
    ['Brand', product.brand],
    ['Animal', product.animals.map((a) => ANIMAL_SINGULAR[a] || toSlugLabel(a)).join(', ')],
    ['Breed', product.breedSize],
    ['Category', CATEGORY_LABEL[product.category] || toSlugLabel(product.category)],
    ['Weight', product.weight],
    ['Age Group', product.ageGroup],
  ].filter(([, v]) => v);

  const mailHref = settings.contactEmail ? `mailto:${settings.contactEmail}?subject=${encodeURIComponent(`Price inquiry: ${product.name}`)}` : null;
  const canBuy = product.inStock && !product.priceHidden;

  const tabContent = {
    description: <p dir="auto">{product.description || 'No description yet.'}</p>,
    ingredients: <p dir="auto">{product.ingredients || 'Ingredient information is not available for this product.'}</p>,
    benefits: product.benefits.length ? <ul className="tick-list">{product.benefits.map((b) => <li key={b}><Icon name="check-circle" size={18} />{b}</li>)}</ul> : <p>No benefits listed.</p>,
    usage: <p dir="auto">{product.usage || 'Follow the guidance on the pack.'}</p>,
  };

  return (
    <div className="pd container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link><Icon name="chevron-right" size={14} />
        <Link to="/shop">Shop</Link><Icon name="chevron-right" size={14} />
        <Link to={`/shop?category=${product.category}`}>{CATEGORY_LABEL[product.category] || toSlugLabel(product.category)}</Link>
      </nav>

      <div className="pd-top">
        <div className="pd-gallery">
          {product.images.length > 1 && (
            <div className="pd-thumbs" role="tablist" aria-label="Product images">
              {product.images.map((src, i) => (
                <button key={src} type="button" role="tab" aria-selected={i === image} className={`pd-thumb ${i === image ? 'is-active' : ''}`} onClick={() => setImage(i)} aria-label={`Show image ${i + 1}`}>
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          <div className="pd-main-img"><img src={imageOf(product, image)} alt={product.name} /></div>
        </div>

        <div className="pd-info">
          <Link to={`/shop?brand=${encodeURIComponent(product.brand)}`} className="pd-brand">{product.brand}</Link>
          <h1>{product.name}</h1>
          <div className="pd-rating">
            <Stars value={product.rating} size={18} />
            <strong>{product.reviewCount ? product.rating.toFixed(1) : ''}</strong>
            <button type="button" className="link-btn" onClick={() => { setTab('reviews'); document.getElementById('pd-tabs')?.scrollIntoView({ behavior: 'smooth' }); }}>
              {product.reviewCount ? `(${product.reviewCount} reviews)` : 'No reviews yet'}
            </button>
          </div>

          <div className="pd-price-row">
            <Price product={product} size="lg" />
            {product.stockStatus === 'out_of_stock' ? <Badge tone="red">Out of Stock</Badge> : product.stockStatus === 'low_stock' ? <Badge tone="amber">Only {product.stock} left</Badge> : <Badge tone="green"><Icon name="check" size={12} /> In Stock</Badge>}
          </div>

          <dl className="specs">
            {specs.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>

          {canBuy ? (
            <div className="pd-buy">
              <QtyStepper value={qty} onChange={setQty} max={Math.max(1, product.stock)} />
              <button type="button" className="btn btn-primary btn-lg pd-add" onClick={() => add(product, qty)}><Icon name="cart" size={18} /> Add to Cart</button>
              <button type="button" className={`btn btn-outline btn-lg pd-wish ${liked ? 'is-on' : ''}`} onClick={() => wishlist.toggle(product._id)} aria-pressed={liked}><Icon name="heart" size={18} /> {liked ? 'In Wishlist' : 'Add to Wishlist'}</button>
            </div>
          ) : (
            <div className="pd-buy pd-buy-off">
              {product.priceHidden ? (
                <>
                  <p className="notice"><Icon name="info" size={18} /> The price for this item is not listed online. Get in touch and we&apos;ll be happy to help.</p>
                  {mailHref && <a className="btn btn-primary btn-lg" href={mailHref}><Icon name="mail" size={18} /> Contact us for price</a>}
                  {settings.contactPhone && <a className="btn btn-outline btn-lg" href={`tel:${settings.contactPhone.replace(/\s/g, '')}`}><Icon name="phone" size={18} /> {settings.contactPhone}</a>}
                </>
              ) : (
                <button type="button" className="btn btn-primary btn-lg" disabled>Out of Stock</button>
              )}
              <button type="button" className={`btn btn-outline btn-lg pd-wish ${liked ? 'is-on' : ''}`} onClick={() => wishlist.toggle(product._id)} aria-pressed={liked}><Icon name="heart" size={18} /> {liked ? 'In Wishlist' : 'Add to Wishlist'}</button>
            </div>
          )}
        </div>
      </div>

      <div className="pd-tabs" id="pd-tabs">
        <div className="tab-list" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} className={`tab ${tab === t.id ? 'is-active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}{t.id === 'reviews' && product.reviewCount ? ` (${product.reviewCount})` : ''}
            </button>
          ))}
        </div>
        <div className="tab-panel" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'reviews' ? <Reviews product={product} onChanged={() => reload(true)} /> : tabContent[tab]}
        </div>
      </div>

      {settings.aiEnabled && (
        <InlineAsk
          title="Ask PawAI about this product"
          placeholder="Get nutrition advice, compare products, or ask anything..."
          productId={product._id}
          suggestions={['Is this suitable for my pet?', 'Show similar products', 'How much should I feed?']}
        />
      )}

      {data.related.length > 0 && (
        <section className="related" aria-labelledby="related-title">
          <h2 className="section-title" id="related-title">Related Products</h2>
          <div className="product-grid">{data.related.map((p) => <ProductCard key={p._id} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}
