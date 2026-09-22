import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { Stars } from '../../components/ui/Stars.jsx';
import { Badge, Pagination } from '../../components/ui/Controls.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { Card, PageHeader, SearchBox } from '../../components/admin/AdminUI.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/format.js';

export default function Reviews() {
  useTitle('Reviews');
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const product = sp.get('product') || '';
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(term, 350);
  const [reply, setReply] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPage(1); }, [status, rating, q, product]);

  const { data, loading, error, reload } = useFetch(() => api.get('/admin/reviews', { product, status, rating, q, page, limit: 8 }), [product, status, rating, q, page]);

  const setVisibility = async (r) => {
    try {
      await api.patch(`/admin/reviews/${r._id}/status`, { status: r.status === 'published' ? 'hidden' : 'published' });
      toast.success(r.status === 'published' ? 'Review hidden from the store' : 'Review published');
      reload(true);
    } catch (err) { toast.error(err.message); }
  };
  const saveReply = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.patch(`/admin/reviews/${reply._id}/reply`, { text: reply.text }); toast.success('Reply saved'); setReply(null); reload(true); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api.del(`/admin/reviews/${toDelete._id}`); toast.success('Review deleted'); setToDelete(null); reload(true); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Reviews" subtitle={data ? `${data.summary.published} published - ${data.summary.hidden} hidden` : 'Moderate what customers say.'} actions={product ? <button type="button" className="btn btn-outline btn-sm" onClick={() => setSp({})}><Icon name="x" size={14} /> Clear product filter</button> : null} />
      <Card>
        <div className="a-filters">
          <SearchBox value={term} onChange={setTerm} placeholder="Search reviews..." />
          <select className="select select-sm" value={rating} onChange={(e) => setRating(e.target.value)} aria-label="Filter by rating"><option value="">Any rating</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select>
          <select className="select select-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by visibility"><option value="">All reviews</option><option value="published">Published</option><option value="hidden">Hidden</option></select>
        </div>
        {error ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? <Skeleton height={320} /> : data.reviews.length === 0 ? <EmptyState compact pet="paw" title="No reviews found" /> : (
          <>
            <ul className="a-reviews">
              {data.reviews.map((r) => (
                <li key={r._id} className={r.status === 'hidden' ? 'is-hidden' : ''}>
                  <div className="a-review-main">
                    <div className="a-review-head">
                      <strong>{r.name}</strong><Stars value={r.rating} size={14} />
                      {r.verifiedPurchase && <Badge tone="green">Verified</Badge>}
                      {r.status === 'hidden' && <Badge tone="red">Hidden</Badge>}
                      <span className="a-muted">{formatDate(r.createdAt)}</span>
                    </div>
                    {r.title && <h4>{r.title}</h4>}
                    <p dir="auto">{r.comment}</p>
                    {r.adminReply && r.adminReply.text && <p className="a-reply"><Icon name="reply" size={14} /> {r.adminReply.text}</p>}
                    <small className="a-muted">On {r.product ? <Link to={`/admin/products/${r.product._id}`}>{r.product.name}</Link> : 'a deleted product'}</small>
                  </div>
                  <div className="a-actions">
                    <button type="button" className="btn btn-soft btn-sm" onClick={() => setVisibility(r)}><Icon name={r.status === 'published' ? 'eye-off' : 'eye'} size={14} /> {r.status === 'published' ? 'Hide' : 'Publish'}</button>
                    <button type="button" className="btn btn-soft btn-sm" onClick={() => setReply({ _id: r._id, text: (r.adminReply && r.adminReply.text) || '', name: r.name })}><Icon name="reply" size={14} /> Reply</button>
                    <button type="button" className="icon-btn icon-btn-danger" onClick={() => setToDelete(r)} aria-label="Delete review"><Icon name="trash" size={17} /></button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="a-table-foot"><span className="a-muted">{data.total} reviews</span><Pagination page={data.page} pages={data.pages} onChange={setPage} /></div>
          </>
        )}
      </Card>

      <Modal open={!!reply} onClose={() => setReply(null)} title={reply ? `Reply to ${reply.name}` : ''} footer={<><button type="button" className="btn btn-outline" onClick={() => setReply(null)}>Cancel</button><button type="submit" form="reply-form" className="btn btn-primary" disabled={busy}>Save reply</button></>}>
        {reply && <form id="reply-form" onSubmit={saveReply}><label className="label" htmlFor="rp-text">Public reply (leave empty to remove)</label><textarea id="rp-text" className="textarea" rows={4} maxLength={600} value={reply.text} onChange={(e) => setReply({ ...reply, text: e.target.value })} /></form>}
      </Modal>
      <ConfirmDialog open={!!toDelete} title="Delete this review?" message="It will be removed permanently and the product rating will be recalculated. To just hide it, use Hide instead." confirmLabel="Delete review" busy={busy} onConfirm={remove} onClose={() => setToDelete(null)} />
    </>
  );
}
