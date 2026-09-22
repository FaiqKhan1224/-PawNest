import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import PetIcon from '../../components/ui/PetIcon.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx';
import { OrderStatusBadge } from './Orders.jsx';
import InlineAsk from '../../components/pawai/InlineAsk.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { ANIMAL_ICON, ANIMAL_SINGULAR, formatDate, formatPrice } from '../../utils/format.js';

const ageText = (y) => (y ? `${y} year${y === 1 ? '' : 's'}` : 'Under 1 year');

export default function Dashboard() {
  useTitle('My Dashboard');
  const { user } = useAuth();
  const { settings } = useSettings();
  const wishlist = useWishlist();
  const pets = useFetch(() => api.get('/pets'), []);
  const orders = useFetch(() => api.get('/orders/mine'), []);
  const firstPet = pets.data && pets.data.pets[0];

  return (
    <div className="dash container">
      <section className="dash-welcome">
        <div>
          <p className="dash-eyebrow">Customer dashboard</p>
          <h1>Hi, {user.name.split(' ')[0]}!</h1>
          <p>Manage your pets, follow your orders and get personalised advice.</p>
        </div>
        <dl className="dash-stats">
          <div><dt>Pets</dt><dd>{pets.data ? pets.data.pets.length : '-'}</dd></div>
          <div><dt>Orders</dt><dd>{orders.data ? orders.data.orders.length : '-'}</dd></div>
          <div><dt>Wishlist</dt><dd>{wishlist.count}</dd></div>
        </dl>
      </section>

      <section className="dash-section" aria-labelledby="pets-title">
        <div className="section-head">
          <h2 className="section-title" id="pets-title">My Pets</h2>
          <Link to="/pets/new" className="btn btn-primary btn-sm"><Icon name="plus" size={16} /> Add Pet</Link>
        </div>
        {pets.error ? <ErrorState error={pets.error} onRetry={pets.reload} /> : pets.loading ? (
          <div className="pet-cards"><Skeleton height={150} radius={22} /><Skeleton height={150} radius={22} /></div>
        ) : pets.data.pets.length === 0 ? (
          <EmptyState pet="dog" title="Add your first pet" text="Tell us about your pet and PawAI can recommend food and care that fits." action={<Link to="/pets/new" className="btn btn-primary">Add Pet</Link>} />
        ) : (
          <div className="pet-cards">
            {pets.data.pets.map((p) => (
              <article key={p._id} className="pet-card">
                <span className="pet-card-avatar"><PetIcon name={ANIMAL_ICON[p.animal]} size={52} color="#f0287f" /></span>
                <div className="pet-card-info">
                  <h3>{p.name}</h3>
                  <p>{p.breed || ANIMAL_SINGULAR[p.animal]} &middot; {ageText(p.ageYears)}</p>
                  <div className="pet-card-actions">
                    <Link to={`/pets/${p._id}`} className="btn btn-outline btn-sm"><Icon name="edit" size={14} /> Edit Profile</Link>
                    <Link to={`/pawai?pet=${p._id}`} className="btn btn-primary btn-sm">Ask PawAI</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="dash-cols">
        <section className="dash-section" aria-labelledby="orders-title">
          <div className="section-head">
            <h2 className="section-title" id="orders-title">Recent Orders</h2>
            <Link to="/orders" className="link-arrow">All orders <Icon name="arrow-right" size={16} /></Link>
          </div>
          {orders.loading ? <Skeleton height={160} radius={18} /> : orders.error ? <ErrorState error={orders.error} onRetry={orders.reload} /> : orders.data.orders.length === 0 ? (
            <EmptyState compact pet="cat" title="No orders yet" action={<Link to="/shop" className="btn btn-primary btn-sm">Start shopping</Link>} />
          ) : (
            <ul className="order-list compact">
              {orders.data.orders.slice(0, 4).map((o) => (
                <li key={o._id}>
                  <Link to={`/orders/${o._id}`} className="order-row">
                    <div><strong>#{o.orderNumber}</strong><small>{formatDate(o.createdAt)}</small></div>
                    <OrderStatusBadge status={o.status} />
                    <strong className="order-row-total">{formatPrice(o.total)}</strong>
                    <Icon name="chevron-right" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="quick-links">
            <Link to="/wishlist" className="btn btn-soft btn-sm"><Icon name="heart" size={15} /> Wishlist</Link>
            <Link to="/profile" className="btn btn-soft btn-sm"><Icon name="settings" size={15} /> Account settings</Link>
            <Link to="/track-order" className="btn btn-soft btn-sm"><Icon name="truck" size={15} /> Track order</Link>
          </div>
        </section>

        {settings.aiEnabled && (
          <InlineAsk
            title="Ask PawAI anything about your pet"
            subtitle="Get instant advice on care, food, health."
            placeholder={firstPet ? `Ask about ${firstPet.name}'s food, grooming or training...` : 'Ask about pet care...'}
            petId={firstPet ? firstPet._id : ''}
          />
        )}
      </div>
    </div>
  );
}
