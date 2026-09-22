import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/ui/States.jsx';
import useTitle from '../../hooks/useTitle.js';

export default function NotFound() {
  useTitle('Page not found');
  return (
    <div className="container section">
      <EmptyState pet="dog" title="We couldn't find that page" text="It may have moved, or the link might be mistyped." action={<Link to="/" className="btn btn-primary">Back to home</Link>} />
    </div>
  );
}
