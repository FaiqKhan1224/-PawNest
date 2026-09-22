import { useEffect } from 'react';

export default function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | PawNest` : 'PawNest - Better Care. Happier Pets.';
  }, [title]);
}
