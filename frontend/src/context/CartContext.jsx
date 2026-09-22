import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useToast } from './ToastContext.jsx';

const KEY = 'pawnest_cart';
const CartContext = createContext(null);

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    return {
      items: Array.isArray(data && data.items) ? data.items.filter((i) => i && i.productId && i.quantity > 0) : [],
      coupon: (data && data.coupon) || '',
    };
  } catch (err) {
    return { items: [], coupon: '' };
  }
}

/**
 * The browser only stores product ids + quantities. Every price, discount, shipping
 * fee and total comes from POST /api/cart/quote, calculated from the database.
 */
export function CartProvider({ children }) {
  const toast = useToast();
  const [state, setState] = useState(load);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state)); }, [state]);

  useEffect(() => {
    if (!state.items.length) { setQuote(null); setLoading(false); setError(''); return undefined; }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      api.post('/cart/quote', { items: state.items, coupon: state.coupon })
        .then((q) => { if (!cancelled) { setQuote(q); setError(''); } })
        .catch((e) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 120);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [state]);

  // Keep quantities within available stock once the server tells us the limits.
  useEffect(() => {
    if (!quote) return;
    const fixes = quote.lines.filter((l) => l.maxQuantity > 0 && l.quantity > l.maxQuantity);
    if (!fixes.length) return;
    setState((s) => ({
      ...s,
      items: s.items.map((i) => {
        const f = fixes.find((l) => l.productId === i.productId);
        return f ? { ...i, quantity: f.maxQuantity } : i;
      }),
    }));
    toast.info('We adjusted a quantity to match the available stock.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote]);

  const add = useCallback((product, quantity = 1) => {
    if (product.priceHidden) { toast.error('This price is not listed. Please contact the store to order it.'); return false; }
    if (!product.inStock) { toast.error('Sorry, this item is out of stock.'); return false; }
    const existing = state.items.find((i) => i.productId === product._id);
    const current = existing ? existing.quantity : 0;
    if (current >= product.stock) {
      toast.info(`You already have the maximum available (${product.stock}) in your cart.`);
      return false;
    }
    const next = Math.min(current + quantity, product.stock);
    setState((s) => {
      const found = s.items.some((i) => i.productId === product._id);
      const items = found
        ? s.items.map((i) => (i.productId === product._id ? { ...i, quantity: next } : i))
        : [...s.items, { productId: product._id, quantity: next }];
      return { ...s, items };
    });
    toast.success(`${product.name} added to your cart`);
    return true;
  }, [state.items, toast]);

  const setQty = useCallback((productId, quantity) => {
    setState((s) => ({
      ...s,
      items: quantity < 1 ? s.items.filter((i) => i.productId !== productId) : s.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    }));
  }, []);

  const remove = useCallback((productId) => setState((s) => ({ ...s, items: s.items.filter((i) => i.productId !== productId) })), []);
  const clear = useCallback(() => setState({ items: [], coupon: '' }), []);
  const setCoupon = useCallback((coupon) => setState((s) => ({ ...s, coupon: String(coupon || '').trim().toUpperCase() })), []);

  const count = useMemo(() => state.items.reduce((sum, i) => sum + i.quantity, 0), [state.items]);

  const value = useMemo(() => ({
    items: state.items, coupon: state.coupon, quote, loading, error, count, add, setQty, remove, clear, setCoupon,
  }), [state, quote, loading, error, count, add, setQty, remove, clear, setCoupon]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
