import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const KEY = 'pawnest_wishlist';
const WishlistContext = createContext(null);

const readLocal = () => {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch (err) { return []; }
};

export function WishlistProvider({ children }) {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [ids, setIds] = useState(readLocal);

  // When someone signs in, merge their guest wishlist into their account.
  useEffect(() => {
    if (loading) return;
    if (!user) { setIds(readLocal()); return; }
    api.post('/wishlist/merge', { ids: readLocal() })
      .then((d) => { setIds(d.ids); localStorage.removeItem(KEY); })
      .catch(() => {});
  }, [user, loading]);

  const toggle = useCallback(async (productId) => {
    if (user) {
      try {
        const d = await api.post('/wishlist/toggle', { productId });
        setIds(d.ids);
        toast.success(d.added ? 'Saved to your wishlist' : 'Removed from your wishlist');
      } catch (err) { toast.error(err.message); }
      return;
    }
    setIds((current) => {
      const has = current.includes(productId);
      const next = has ? current.filter((i) => i !== productId) : [...current, productId];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
    toast.success(ids.includes(productId) ? 'Removed from your wishlist' : 'Saved to your wishlist');
  }, [user, toast, ids]);

  const value = useMemo(() => ({ ids, has: (id) => ids.includes(id), toggle, count: ids.length }), [ids, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
