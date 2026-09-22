import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stars, StarInput } from '../ui/Stars.jsx';
import { EmptyState, ErrorState, Skeleton } from '../ui/States.jsx';
import { Pagination, Field } from '../ui/Controls.jsx';
import Icon from '../ui/Icon.jsx';
import useFetch from '../../hooks/useFetch.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/format.js';

function ReviewForm({ productId, onDone }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!rating) { setError('Please choose a star rating.'); return; }
    if (comment.trim().length < 5) { setError('Please write a few words about the product.'); return; }
    setBusy(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, title, comment });
      toast.success('Thanks! Your review is live.');
      setRating(0); setTitle(''); setComment('');
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit} noValidate>
      <h3>Write a review</h3>
      <StarInput value={rating} onChange={setRating} />
      <Field label="Headline (optional)" htmlFor="rv-title"><input id="rv-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Sum it up in a few words" /></Field>
      <Field label="Your review" htmlFor="rv-comment" error={error}><textarea id="rv-comment" className="textarea" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1500} placeholder="What did you and your pet think?" /></Field>
      <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Posting...' : 'Post review'}</button>
    </form>
  );
}

export default function Reviews({ product, onChanged }) {
  const { user } = useAuth();
  const location = useLocation();
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => api.get(`/products/${product._id}/reviews`, { sort, page, limit: 5 }), [product._id, sort, page]);

  const dist = data ? data.distribution : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const total = Object.values(dist).reduce((a, b) => a + b, 0);

  return (
    <div className="reviews" id="reviews">
      <div className="reviews-summary">
        <div className="reviews-score">
          <strong>{product.reviewCount ? product.rating.toFixed(1) : '-'}</strong>
          <Stars value={product.rating} size={18} />
          <span className="muted">{product.reviewCount} review{product.reviewCount === 1 ? '' : 's'}</span>
        </div>
        <ul className="reviews-bars" aria-label="Rating breakdown">
          {[5, 4, 3, 2, 1].map((n) => (
            <li key={n}>
              <span>{n}★</span>
              <span className="bar"><span style={{ width: `${total ? (dist[n] / total) * 100 : 0}%` }} /></span>
              <span className="muted">{dist[n]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="reviews-list-head">
        <h3>Customer reviews</h3>
        <label className="inline-select">Sort
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort reviews">
            <option value="newest">Newest</option><option value="highest">Highest rated</option><option value="lowest">Lowest rated</option>
          </select>
        </label>
      </div>

      {error ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? (
        <div className="stack">{[1, 2, 3].map((i) => <Skeleton key={i} height={84} radius={14} />)}</div>
      ) : data.reviews.length === 0 ? (
        <EmptyState compact pet="paw" title="No reviews yet" text="Be the first to share your experience." />
      ) : (
        <ul className="review-list">
          {data.reviews.map((r) => (
            <li key={r._id} className="review">
              <div className="review-top">
                <span className="review-avatar">{r.name.charAt(0)}</span>
                <div>
                  <strong>{r.name}</strong>
                  <div className="review-meta"><Stars value={r.rating} size={14} /> <span>{formatDate(r.createdAt)}</span>{r.verifiedPurchase && <span className="verified"><Icon name="check-circle" size={13} /> Verified purchase</span>}</div>
                </div>
              </div>
              {r.title && <h4>{r.title}</h4>}
              <p dir="auto">{r.comment}</p>
              {r.adminReply && <div className="review-reply"><strong>PawNest replied:</strong> {r.adminReply.text}</div>}
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination page={page} pages={data.pages} onChange={setPage} />}

      {user ? (
        <ReviewForm productId={product._id} onDone={() => { setPage(1); setSort('newest'); reload(); onChanged(); }} />
      ) : (
        <div className="review-signin"><p>Bought this product? <Link to={`/login?next=${encodeURIComponent(location.pathname)}`}>Sign in</Link> to write a review.</p></div>
      )}
    </div>
  );
}
