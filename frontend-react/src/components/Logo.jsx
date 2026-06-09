export default function Logo({ size = 36 }) {
  const id = 'lg'
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}a`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
        </linearGradient>
        <filter id={`${id}glow`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer lens ring */}
      <circle cx="24" cy="24" r="21.5" stroke={`url(#${id}a)`} strokeWidth="1.5" fill="none" />

      {/* Inner subtle ring */}
      <circle cx="24" cy="24" r="15" stroke={`url(#${id}b)`} strokeWidth="1" fill="none" />

      {/* Neural network — nodes */}
      <circle cx="24" cy="10" r="2.5" fill={`url(#${id}a)`} filter={`url(#${id}glow)`} />
      <circle cx="13" cy="18" r="2" fill={`url(#${id}a)`} opacity="0.85" />
      <circle cx="35" cy="18" r="2" fill={`url(#${id}a)`} opacity="0.85" />
      <circle cx="24" cy="24" r="3" fill={`url(#${id}a)`} filter={`url(#${id}glow)`} />
      <circle cx="14" cy="31" r="2" fill={`url(#${id}a)`} opacity="0.75" />
      <circle cx="34" cy="31" r="2" fill={`url(#${id}a)`} opacity="0.75" />
      <circle cx="24" cy="38" r="2.5" fill={`url(#${id}a)`} opacity="0.65" />

      {/* Neural network — connections */}
      <line x1="24" y1="10" x2="13" y2="18" stroke={`url(#${id}a)`} strokeWidth="0.9" opacity="0.5" />
      <line x1="24" y1="10" x2="35" y2="18" stroke={`url(#${id}a)`} strokeWidth="0.9" opacity="0.5" />
      <line x1="13" y1="18" x2="24" y2="24" stroke={`url(#${id}a)`} strokeWidth="0.9" opacity="0.5" />
      <line x1="35" y1="18" x2="24" y2="24" stroke={`url(#${id}a)`} strokeWidth="0.9" opacity="0.5" />
      <line x1="13" y1="18" x2="35" y2="18" stroke={`url(#${id}a)`} strokeWidth="0.7" opacity="0.25" />
      <line x1="24" y1="24" x2="14" y2="31" stroke={`url(#${id}a)`} strokeWidth="0.9" opacity="0.5" />
      <line x1="24" y1="24" x2="34" y2="31" stroke={`url(#${id}a)`} strokeWidth="0.9" opacity="0.5" />
      <line x1="14" y1="31" x2="34" y2="31" stroke={`url(#${id}a)`} strokeWidth="0.7" opacity="0.25" />
      <line x1="14" y1="31" x2="24" y2="38" stroke={`url(#${id}a)`} strokeWidth="0.9" opacity="0.45" />
      <line x1="34" y1="31" x2="24" y2="38" stroke={`url(#${id}a)`} strokeWidth="0.9" opacity="0.45" />
      <line x1="13" y1="18" x2="14" y2="31" stroke={`url(#${id}a)`} strokeWidth="0.6" opacity="0.2" />
      <line x1="35" y1="18" x2="34" y2="31" stroke={`url(#${id}a)`} strokeWidth="0.6" opacity="0.2" />
    </svg>
  )
}
