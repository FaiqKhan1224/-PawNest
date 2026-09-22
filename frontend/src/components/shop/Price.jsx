import { useSettings } from '../../context/SettingsContext.jsx';
import { formatPrice } from '../../utils/format.js';

/** Shows the price - or, when the store has hidden it, "Price unavailable" (the number never reaches the browser). */
export default function Price({ product, size = 'md' }) {
  const { settings } = useSettings();
  if (product.priceHidden) {
    const href = settings.contactEmail
      ? `mailto:${settings.contactEmail}?subject=${encodeURIComponent(`Price inquiry: ${product.name}`)}`
      : null;
    return (
      <div className={`price price-${size} price-hidden`}>
        <span className="price-unavailable">Price unavailable</span>
        {size !== 'sm' && href && <a className="price-contact" href={href}>Contact us for price</a>}
      </div>
    );
  }
  return (
    <div className={`price price-${size}`}>
      <span className="price-now">{formatPrice(product.price)}</span>
      {product.comparePrice ? <s className="price-old">{formatPrice(product.comparePrice)}</s> : null}
      {product.discountPercent > 0 && size !== 'sm' ? <span className="chip-off">{product.discountPercent}% OFF</span> : null}
    </div>
  );
}
