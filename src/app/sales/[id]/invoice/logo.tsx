interface CilmaxLogoProps {
  size?: number
}

export function CilmaxLogo({ size = 56 }: CilmaxLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Cilmax"
      className="shrink-0"
    >
      <circle cx="32" cy="32" r="30" fill="#0D9488" />
      <circle cx="32" cy="32" r="30" stroke="#F59E0B" strokeWidth="2.5" />
      <path
        d="M32 13 L36.5 27.5 L51 27.5 L39 36.5 L43.5 51 L32 42 L20.5 51 L25 36.5 L13 27.5 L27.5 27.5 Z"
        fill="#FDE68A"
      />
      <path
        d="M32 13 L36.5 27.5 L51 27.5 L39 36.5 L43.5 51 L32 42 L20.5 51 L25 36.5 L13 27.5 L27.5 27.5 Z"
        fill="#FBBF24"
        fillOpacity="0.9"
      />
      <circle cx="32" cy="32" r="6" fill="#0D9488" />
    </svg>
  )
}
