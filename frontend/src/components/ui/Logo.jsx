import { Link } from 'react-router-dom';

export default function Logo({
  variant = 'customer',
  to = '/',
  onClick,
  showTagline = false
}) {
  const admin = variant === 'admin';

  return (
    <Link
      to={admin ? '/admin' : to}
      className={`logo ${admin ? 'logo-admin' : ''}`}
      onClick={onClick}
      aria-label={admin ? 'PawNest Admin' : 'PawNest home'}
    >
      {/* PawNest Logo Image */}
      <span className="logo-mark">
        <img
          src="/logo.png"
          alt="PawNest"
          className="pawnest-logo-image" style={{ width: "120px", height: "60px", objectFit: "contain" }}
        />
      </span>

      {/* Brand Name */}
      <span className="logo-text">
        <span className="logo-name">PawNest</span>

        {admin && (
          <>
            <span className="logo-sep" aria-hidden="true">
              |
            </span>
            <span className="logo-role">Admin</span>
          </>
        )}

        {showTagline && !admin && (
          <span className="logo-tag">
            Better Care. Happier Pets.
          </span>
        )}
      </span>
    </Link>
  );
}
