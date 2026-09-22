import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { RatingLine } from '../ui/Stars.jsx';
import Price from './Price.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { imageOf } from '../../utils/format.js';

export default function ProductCard({ product, compact = false }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const { settings } = useSettings();
  const liked = wishlist.has(product._id);
  const url = `/product/${product.slug}`;

  let action;
  if (product.priceHidden) {
    const href = settings.contactEmail ? `mailto:${settings.contactEmail}?subject=${encodeURIComponent(`Price inquiry: ${product.name}`)}` : url;
    action = <a className="btn btn-primary btn-sm p-card-add" href={href}>Ask for price</a>;
  } else if (!product.inStock) {
    action = <button type="button" className="btn btn-primary btn-sm p-card-add" disabled>Out of Stock</button>;
  } else {
    action = <button type="button" className="btn btn-primary btn-sm p-card-add" onClick={() => add(product)}>Add to Cart</button>;
  }

  return (
    <article className={`p-card ${compact ? 'p-card-compact' : ''}`}>
      <div className="p-card-media">
        <Link to={url} className="p-card-img" tabIndex={-1} aria-hidden="true">
          <img src={imageOf(product)} alt="" loading="lazy" width="400" height="400" />
        </Link>
        <button
          type="button"
          className={`p-card-heart ${liked ? 'is-on' : ''}`}
          onClick={() => wishlist.toggle(product._id)}
          aria-pressed={liked}
          aria-label={liked ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Icon name="heart" size={17} />
        </button>
        {product.discountPercent > 0 && <span className="p-card-flag">{product.discountPercent}% OFF</span>}
        {product.stockStatus === 'out_of_stock' && <span className="p-card-flag p-card-flag-grey">Sold out</span>}
      </div>
      <div className="p-card-body">
        <p className="p-card-brand">{product.brand}</p>
        <h3 className="p-card-title"><Link to={url}>{product.name}</Link></h3>
        <RatingLine value={product.rating} count={product.reviewCount} />
        <Price product={product} size="sm" />
        {product.stockStatus === 'low_stock' && <p className="p-card-stock is-low">Only {product.stock} left</p>}
        <div className="p-card-actions">
          {action}
          <Link to={url} className="btn btn-soft btn-sm btn-icon" aria-label={`View details of ${product.name}`} title="View details"><Icon name="eye" size={16} /></Link>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="p-card p-card-skeleton" aria-hidden="true">
      <div className="p-card-media"><span className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} /></div>
      <div className="p-card-body">
        <span className="skeleton" style={{ height: 10, width: '40%' }} />
        <span className="skeleton" style={{ height: 14, width: '90%' }} />
        <span className="skeleton" style={{ height: 12, width: '50%' }} />
        <span className="skeleton" style={{ height: 34, width: '100%', borderRadius: 999 }} />
      </div>
    </div>
  );
}
