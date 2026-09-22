import { Link } from 'react-router-dom';
import PetIcon from '../../components/ui/PetIcon.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Stars } from '../../components/ui/Stars.jsx';
import { ErrorState } from '../../components/ui/States.jsx';
import ProductCard, { ProductCardSkeleton } from '../../components/shop/ProductCard.jsx';
import PawAIBanner from '../../components/pawai/PawAIBanner.jsx';
import useFetch from '../../hooks/useFetch.js';
import useTitle from '../../hooks/useTitle.js';
import { api } from '../../services/api.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ANIMAL_ICON } from '../../utils/format.js';

const TILE_TONES = ['pink', 'lilac', 'sky', 'peach', 'mint', 'rose'];

export default function Home() {
  useTitle();

  const { settings } = useSettings();

  const animals = useFetch(
    () => api.get('/categories', { kind: 'animal' }),
    []
  );

  const types = useFetch(
    () => api.get('/categories', { kind: 'type' }),
    []
  );

  const featured = useFetch(
    () => api.get('/products', {
      featured: 'true',
      limit: 8
    }),
    []
  );

  const deals = useFetch(
    () => api.get('/products', {
      deals: 'true',
      limit: 4,
      sort: 'rating'
    }),
    []
  );

  const facets = useFetch(
    () => api.get('/products/facets'),
    []
  );

  const reviews = useFetch(
    () => api.get('/reviews/featured'),
    []
  );

  return (
    <div className="home">

      {/* =====================================================
          PAWNEST HERO
          ===================================================== */}

      <section className="hero">
        <div className="hero-theme">

          <img
            src="/theme.png"
            alt="PawNest - Healthy Pets, Happy Lives"
            className="hero-theme-image" style={{ width: "100%", height: "500px", objectFit: "cover", display: "block" }}
          />

          <div className="hero-theme-actions">

            <Link
              to="/shop"
              className="hero-theme-shop"
            >
              Shop Now
            </Link>

            <a
              href="#shop-by-pet"
              className="hero-theme-explore"
            >
              Explore
            </a>

          </div>

        </div>
      </section>


      {/* =====================================================
          SHOP BY PET
          ===================================================== */}

      <section
        className="section container"
        id="shop-by-pet"
        aria-labelledby="pet-title"
      >
<div className="section-head">
          <div>
            <span className="section-eyebrow">
              Find what they love
            </span>

            <h2
              className="section-title"
              id="pet-title"
            >
              Shop by Pet
            </h2>
          </div>
        </div>

        {animals.error ? (

          <ErrorState
            error={animals.error}
            onRetry={animals.reload}
          />

        ) : (

          <div className="pet-tiles">

            {(
              animals.data
                ? animals.data.categories
                : Array.from({ length: 6 })
            ).map((a, i) => (

              a ? (

                <Link
                  key={a.slug}
                  to={`/shop?animal=${a.slug}`}
                  className={`pet-tile tone-${
                    TILE_TONES[i % TILE_TONES.length]
                  }`}
                >

                  <span className="pet-tile-art">

                    <PetIcon
                      name={
                        ANIMAL_ICON[a.slug] || a.icon
                      }
                      size={54}
                      color="#f0287f"
                    />

                  </span>

                  <strong>
                    {a.name}
                  </strong>

                  <span className="pet-tile-link">

                    Explore

                    <Icon
                      name="chevron-right"
                      size={14}
                    />

                  </span>

                </Link>

              ) : (

                <span
                  key={i}
                  className="pet-tile skeleton"
                  style={{ height: 150 }}
                />

              )

            ))}

          </div>

        )}

        {types.data && (

          <div
            className="type-row"
            aria-label="Shop by category"
          >

            {types.data.categories.map((t) => (

              <Link
                key={t.slug}
                to={`/shop?category=${t.slug}`}
                className="type-chip"
              >

                <PetIcon
                  name={t.icon}
                  size={20}
                  color="#9a6fe0"
                />

                {t.name}

              </Link>

            ))}

          </div>

        )}

      </section>


      {/* =====================================================
          FEATURED PRODUCTS
          ===================================================== */}

      <section
        className="section container"
        aria-labelledby="featured-title"
      >

        <div className="section-head">

          <div>
            <span className="section-eyebrow">
              Loved by pet parents
            </span>

            <h2
              className="section-title"
              id="featured-title"
            >
              Featured Products
            </h2>
          </div>

          <Link
            to="/shop"
            className="link-arrow"
          >
            View all

            <Icon
              name="arrow-right"
              size={16}
            />

          </Link>

        </div>

        {featured.error ? (

          <ErrorState
            error={featured.error}
            onRetry={featured.reload}
          />

        ) : (

          <div className="product-grid">

            {featured.loading

              ? Array.from({ length: 4 }).map((_, i) => (

                  <ProductCardSkeleton
                    key={i}
                  />

                ))

              : featured.data.products
                  .slice(0, 8)
                  .map((p) => (

                    <ProductCard
                      key={p._id}
                      product={p}
                    />

                  ))

            }

          </div>

        )}

      </section>


      {/* =====================================================
          TRUSTED BRANDS
          ===================================================== */}

      {facets.data &&
        facets.data.brands.length > 0 && (

          <section
            className="section container"
            aria-labelledby="brands-title"
          >

            <div className="section-head">

              <div>

                <span className="section-eyebrow">
                  Quality you can trust
                </span>

                <h2
                  className="section-title"
                  id="brands-title"
                >
                  Trusted Brands
                </h2>

              </div>

            </div>

            <div className="brand-row">

              {facets.data.brands
                .slice(0, 12)
                .map((b) => (

                  <Link
                    key={b.value}
                    to={`/shop?brand=${encodeURIComponent(
                      b.value
                    )}`}
                    className="brand-chip"
                  >

                    <strong>
                      {b.value}
                    </strong>

                    <span>
                      {b.count} products
                    </span>

                  </Link>

                ))}

            </div>

          </section>

        )}


      {/* =====================================================
          SPECIAL DEALS
          ===================================================== */}

      {deals.data &&
        deals.data.products.length > 0 && (

          <section
            className="section container deals"
            aria-labelledby="deals-title"
          >

            <div className="section-head">

              <div>

                <span className="section-eyebrow">
                  Treat them today
                </span>

                <h2
                  className="section-title"
                  id="deals-title"
                >

                  <span className="deal-tag">
                    Deals
                  </span>

                  {' '}
                  Special Offers

                </h2>

              </div>

              <Link
                to="/shop?deals=true"
                className="link-arrow"
              >

                See all offers

                <Icon
                  name="arrow-right"
                  size={16}
                />

              </Link>

            </div>

            <div className="product-grid">

              {deals.data.products.map((p) => (

                <ProductCard
                  key={p._id}
                  product={p}
                />

              ))}

            </div>

          </section>

        )}


      {/* =====================================================
          PAW AI
          ===================================================== */}

      {settings.aiEnabled && (

        <section className="section container">

          <PawAIBanner />

        </section>

      )}


      {/* =====================================================
          CUSTOMER REVIEWS
          ===================================================== */}

      <section
        className="section container"
        aria-labelledby="reviews-title"
      >

        <div className="section-head">

          <div>

            <span className="section-eyebrow">
              Happy pets, happy parents
            </span>

            <h2
              className="section-title"
              id="reviews-title"
            >
              What Our Customers Say
            </h2>

          </div>

        </div>

        <div className="quote-grid">

          {reviews.loading &&

            Array.from({ length: 3 }).map((_, i) => (

              <span
                key={i}
                className="quote skeleton"
                style={{ height: 170 }}
              />

            ))

          }

          {reviews.data &&
            reviews.data.reviews.map((r) => (

              <figure
                key={r._id}
                className="quote"
              >

                <Stars
                  value={r.rating}
                  size={15}
                />

                <blockquote>
                  &ldquo;
                  {r.comment}
                  &rdquo;
                </blockquote>

                <figcaption>

                  <span className="quote-avatar">
                    {r.name.charAt(0)}
                  </span>

                  <span>

                    <strong>
                      {r.name}
                    </strong>

                    <small>
                      {r.role}
                    </small>

                  </span>

                </figcaption>

              </figure>

            ))}

        </div>

      </section>

    </div>
  );
}



