import { useCallback, useEffect, useRef, useState } from 'react';

/** Runs an async loader whenever `deps` change and exposes loading / error / reload. */
export default function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const counter = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback((silent = false) => {
    const id = ++counter.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    return loaderRef.current()
      .then((data) => { if (id === counter.current) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (id === counter.current) setState((s) => ({ data: silent ? s.data : null, loading: false, error })); });
  }, []);

  useEffect(() => {
    run();
    return () => { counter.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: run, setData: (updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })) };
}
