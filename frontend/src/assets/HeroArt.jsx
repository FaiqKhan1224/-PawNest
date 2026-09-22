// Illustrated golden retriever + tabby cat used in the hero when no custom hero image has been uploaded.
const Heart = ({ x, y, s = 1, o = 0.9, c = '#ff8fbe' }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} opacity={o} fill={c} d="M0 -8 C-14 -30 -44 -8 0 30 C44 -8 14 -30 0 -8 Z" />
);

export default function HeroArt({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 540 430" role="img" aria-label="A golden retriever and a kitten sitting together">
      <defs>
        <linearGradient id="hd-fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2b757" /><stop offset="1" stopColor="#dc9433" /></linearGradient>
        <linearGradient id="hd-ear" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c98428" /><stop offset="1" stopColor="#a8661c" /></linearGradient>
        <linearGradient id="hd-cat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c7cad6" /><stop offset="1" stopColor="#a4a8ba" /></linearGradient>
        <radialGradient id="hd-glow" cx=".5" cy=".55" r=".6"><stop offset="0" stopColor="#ffffff" stopOpacity=".95" /><stop offset="1" stopColor="#ffd9ea" stopOpacity="0" /></radialGradient>
      </defs>

      <ellipse cx="270" cy="230" rx="250" ry="190" fill="url(#hd-glow)" />
      <Heart x={60} y={90} s={0.9} />
      <Heart x={470} y={70} s={0.7} o={0.75} />
      <Heart x={505} y={190} s={0.5} o={0.6} c="#c9a7f2" />
      <Heart x={30} y={230} s={0.45} o={0.6} c="#c9a7f2" />
      <Heart x={330} y={40} s={0.4} o={0.7} />
      <circle cx="120" cy="40" r="5" fill="#fff" opacity=".9" />
      <circle cx="430" cy="140" r="4" fill="#fff" opacity=".9" />

      {/* --- dog --- */}
      <ellipse cx="200" cy="405" rx="165" ry="95" fill="url(#hd-fur)" />
      <ellipse cx="200" cy="380" rx="70" ry="80" fill="#f8dfae" />
      <path d="M108 150 C58 158 44 262 88 306 C122 308 134 246 132 190 Z" fill="url(#hd-ear)" />
      <path d="M292 150 C342 158 356 262 312 306 C278 308 266 246 268 190 Z" fill="url(#hd-ear)" />
      <ellipse cx="200" cy="205" rx="106" ry="100" fill="url(#hd-fur)" />
      <ellipse cx="200" cy="148" rx="30" ry="46" fill="#f7cf85" opacity=".75" />
      <ellipse cx="200" cy="258" rx="60" ry="48" fill="#fbe9c9" />
      <path d="M180 270 q20 46 40 0 q-20 10 -40 0 z" fill="#ff7fa8" />
      <path d="M200 244 v16 M200 260 q-24 22 -44 4 M200 260 q24 22 44 4" stroke="#2a1f2d" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <ellipse cx="200" cy="228" rx="21" ry="14" fill="#2a1f2d" />
      <ellipse cx="193" cy="223" rx="6" ry="3" fill="#fff" opacity=".35" />
      <circle cx="158" cy="192" r="14" fill="#3b2416" /><circle cx="242" cy="192" r="14" fill="#3b2416" />
      <circle cx="153" cy="187" r="4.5" fill="#fff" /><circle cx="237" cy="187" r="4.5" fill="#fff" />
      <path d="M140 170 q18 -12 36 -2 M224 168 q18 -10 36 2" stroke="#b9772a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M116 322 Q200 358 284 322 L286 346 Q200 382 114 346 Z" fill="#f0287f" />
      <circle cx="200" cy="366" r="16" fill="#fff" stroke="#f0287f" strokeWidth="4" />
      <path d="M200 361 c-5 0 -8 4 -6 8 c2 3 6 3 6 3 s4 0 6 -3 c2 -4 -1 -8 -6 -8 z" fill="#f0287f" />

      {/* --- cat --- */}
      <ellipse cx="398" cy="405" rx="100" ry="72" fill="url(#hd-cat)" />
      <ellipse cx="398" cy="388" rx="36" ry="48" fill="#fff" />
      <path d="M332 262 L326 190 L384 236 Z" fill="url(#hd-cat)" />
      <path d="M464 262 L470 190 L412 236 Z" fill="url(#hd-cat)" />
      <path d="M338 252 L335 212 L368 238 Z" fill="#ffb6d3" /><path d="M458 252 L461 212 L428 238 Z" fill="#ffb6d3" />
      <ellipse cx="398" cy="298" rx="76" ry="64" fill="url(#hd-cat)" />
      <path d="M390 240 v22 M405 240 v22 M375 244 l3 18 M420 244 l-3 18" stroke="#858aa3" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="398" cy="322" rx="34" ry="25" fill="#fff" />
      <ellipse cx="370" cy="290" rx="12" ry="14" fill="#9fe0b4" /><ellipse cx="426" cy="290" rx="12" ry="14" fill="#9fe0b4" />
      <ellipse cx="370" cy="291" rx="4.5" ry="10" fill="#1b1d4b" /><ellipse cx="426" cy="291" rx="4.5" ry="10" fill="#1b1d4b" />
      <circle cx="366" cy="285" r="3" fill="#fff" /><circle cx="422" cy="285" r="3" fill="#fff" />
      <path d="M389 309 h18 l-9 10 z" fill="#ff8fb6" />
      <path d="M398 319 q-9 11 -18 4 M398 319 q9 11 18 4" stroke="#6b6f8f" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M340 316 l-30 -5 M340 326 l-30 6 M456 316 l30 -5 M456 326 l30 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".95" />
    </svg>
  );
}
