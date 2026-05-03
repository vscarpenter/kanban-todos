/**
 * Cascade brand mark — gradient plum square with three white horizontal lines.
 * Ported from design_handoff_cascade_redesign/icons.jsx (I.Logo).
 */
interface LogoProps {
  size?: number;
  className?: string;
  title?: string;
}

export function Logo({ size = 28, className, title = "Cascade" }: LogoProps) {
  const gradientId = "cascade-logo-gradient";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 28 28"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={className}
    >
      <rect x="0.5" y="0.5" width="27" height="27" rx="7" fill={`url(#${gradientId})`} />
      <rect x="0.5" y="0.5" width="27" height="27" rx="7" fill="none" stroke="rgba(0,0,0,0.18)" />
      <path
        d="M7 9.5h6.5M7 14h10M7 18.5h7.5"
        stroke="#FFFEFB"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8E62AB" />
          <stop offset="1" stopColor="#553A6C" />
        </linearGradient>
      </defs>
    </svg>
  );
}
