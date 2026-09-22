import { Link } from 'react-router-dom';
import { EmptyState, ErrorState } from '../../components/ui/States.jsx';
import ProductCard, { ProductCardSkeleton } from '../../components/shop/ProductCard.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useWishlist } from '../../context/WishlistContext.jsx';

export default function Wishlist() {
  useTitle('Wishlist');
  const wishlist = useWishlist();
  const key = wishlist.ids.join(',');
  const { data, loading, error, reload } = useFetch(() => (wishlist.ids.length ? api.post('/products/by-ids', { ids: wishlist.ids }) : Promise.resolve({ products: [] })), [key]);

  return (
    <div className="container section">
      <h1 className="page-title">My Wishlist</h1>
      {error ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? (
        <div className="product-grid">{Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
      ) : !data || data.products.length === 0 ? (
        <EmptyState pet="cat" title="Your wishlist is empty" text="Tap the heart on any product to save it for later." action={<Link to="/shop" className="btn btn-primary">Browse products</Link>} />
      ) : (
        <div className="product-grid">{data.products.map((p) => <ProductCard key={p._id} product={p} />)}</div>
      )}
    </div>
  );
}
