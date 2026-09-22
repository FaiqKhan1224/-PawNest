import GLYPHS from '../../assets/petGlyphs.js';

export default function PetIcon({ name = 'paw', size = 32, color = 'currentColor', detail = '#1b1d4b', className = '', title }) {
  const html = (GLYPHS[name] || GLYPHS.paw).split('{c}').join(color).split('{n}').join(detail);
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`pet-icon ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Three tiny glyphs (cat, dog, bird) used as a quiet brand accent. */
export function PetTrio({ size = 26 }) {
  return (
    <span className="pet-trio" aria-hidden="true">
      <span className="pet-trio-dot"><PetIcon name="dog" size={size} color="#f0287f" /></span>
      <span className="pet-trio-dot"><PetIcon name="cat" size={size} color="#9a6fe0" /></span>
      <span className="pet-trio-dot"><PetIcon name="bird" size={size} color="#38a3f0" /></span>
    </span>
  );
}
