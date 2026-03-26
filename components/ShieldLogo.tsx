export default function ShieldLogo({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ShadowwSOS Shield Logo"
    >
      {/* Shield */}
      <path
        d="M60 8 L104 26 L104 72 C104 98 84 118 60 128 C36 118 16 98 16 72 L16 26 Z"
        fill="url(#shieldGrad)"
        stroke="#a855f7"
        strokeWidth="2"
      />
      {/* Shield inner glow */}
      <path
        d="M60 18 L96 33 L96 72 C96 94 79 111 60 120 C41 111 24 94 24 72 L24 33 Z"
        fill="url(#innerGrad)"
        opacity="0.4"
      />

      {/* Woman silhouette facing sideways (right profile) */}
      {/* Head */}
      <circle cx="68" cy="42" r="10" fill="#f9a8d4" />
      {/* Hair flowing back */}
      <path d="M68 33 Q80 30 82 38 Q84 46 76 50 Q72 48 68 52" fill="#7c3aed" />
      {/* Neck */}
      <rect x="64" y="51" width="6" height="7" rx="2" fill="#f9a8d4" />
      {/* Body / torso */}
      <path d="M55 58 Q60 55 70 57 L74 80 L50 80 Z" fill="#a855f7" />
      {/* Arm raised (fist up) */}
      <path d="M70 60 Q82 52 86 44" stroke="#f9a8d4" strokeWidth="5" strokeLinecap="round" />
      {/* Fist */}
      <circle cx="86" cy="42" r="5" fill="#f9a8d4" />
      {/* Legs */}
      <path d="M54 80 L50 105 L58 105 L62 88 L66 105 L74 105 L70 80 Z" fill="#7c3aed" />

      {/* Star accent */}
      <path d="M38 50 L40 44 L42 50 L48 50 L43 54 L45 60 L40 56 L35 60 L37 54 L32 50 Z" fill="#fbbf24" opacity="0.9" />

      <defs>
        <linearGradient id="shieldGrad" x1="60" y1="8" x2="60" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="innerGrad" x1="60" y1="18" x2="60" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
