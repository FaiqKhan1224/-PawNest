export default function PawAIAvatar({ size = 56 }) {
  return (
    <svg className="pawai-avatar" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="32" cy="8" r="4" fill="#f0287f" />
      <path d="M32 12 v8" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="9" cy="34" r="6" fill="#c4a9ee" /><circle cx="55" cy="34" r="6" fill="#c4a9ee" />
      <rect x="10" y="18" width="44" height="38" rx="18" fill="#ffffff" stroke="#c4a9ee" strokeWidth="3" />
      <rect x="16" y="26" width="32" height="22" rx="11" fill="#1b1d4b" />
      <ellipse cx="25" cy="36" rx="4.5" ry="5.5" fill="#7ee0ff" /><ellipse cx="39" cy="36" rx="4.5" ry="5.5" fill="#7ee0ff" />
      <circle cx="26.2" cy="34.6" r="1.6" fill="#fff" /><circle cx="40.2" cy="34.6" r="1.6" fill="#fff" />
      <path d="M28 43 q4 3 8 0" stroke="#ff8fbe" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
