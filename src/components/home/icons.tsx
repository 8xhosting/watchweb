import type { ReactNode } from 'react'

/* ------------------------------------------------------------------ */
/*  Inline SVG icon set for the home page (Lucide-style strokes)       */
/* ------------------------------------------------------------------ */

function Icon({
  className,
  children,
  filled = false,
}: {
  className?: string
  children: ReactNode
  filled?: boolean
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  )
}

export const IconMenu = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </Icon>
)

export const IconWallet = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
  </Icon>
)

export const IconMoon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </Icon>
)

export const IconSun = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </Icon>
)

export const IconMegaphone = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </Icon>
)

export const IconChevronRight = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
)

export const IconArrowUpDown = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="m21 16-4 4-4-4" />
    <path d="M17 20V4" />
    <path d="m3 8 4-4 4 4" />
    <path d="M7 4v16" />
  </Icon>
)

export const IconSliders = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <line x1="21" x2="14" y1="4" y2="4" />
    <line x1="10" x2="3" y1="4" y2="4" />
    <line x1="21" x2="12" y1="12" y2="12" />
    <line x1="8" x2="3" y1="12" y2="12" />
    <line x1="21" x2="16" y1="20" y2="20" />
    <line x1="12" x2="3" y1="20" y2="20" />
    <line x1="14" x2="14" y1="2" y2="6" />
    <line x1="8" x2="8" y1="10" y2="14" />
    <line x1="16" x2="16" y1="18" y2="22" />
  </Icon>
)

export const IconClock = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Icon>
)

export const IconGift = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </Icon>
)

export const IconBolt = ({ className }: { className?: string }) => (
  <Icon className={className} filled>
    <path d="M13 2 4.6 12.4a.55.55 0 0 0 .42.9h5.1l-1.5 8.3a.4.4 0 0 0 .72.32L19.4 11.6a.55.55 0 0 0-.42-.9h-5.1l1.5-8.3a.4.4 0 0 0-.72-.32Z" />
  </Icon>
)

export const IconBan = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="m4.9 4.9 14.2 14.2" />
  </Icon>
)

export const IconLoader = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </Icon>
)

export const IconClipboardList = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </Icon>
)

export const IconHome = ({ className }: { className?: string }) => (
  <Icon className={className} filled>
    <path d="M3 10.2 12 3l9 7.2V20a1.4 1.4 0 0 1-1.4 1.4h-4.5V15a1 1 0 0 0-1-1h-4.2a1 1 0 0 0-1 1v6.4H4.4A1.4 1.4 0 0 1 3 20Z" />
  </Icon>
)

export const IconUser = ({ className }: { className?: string }) => (
  <Icon className={className} filled>
    <path d="M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z" />
    <path d="M12 13.8c-4.4 0-7.6 2.4-7.6 5.6 0 .9.7 1.6 1.6 1.6h12c.9 0 1.6-.7 1.6-1.6 0-3.2-3.2-5.6-7.6-5.6Z" />
  </Icon>
)

export const IconUserStroke = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
)

export const IconFileText = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </Icon>
)

export const IconChartBar = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <rect x="7" y="11" width="3" height="6" rx="0.5" />
    <rect x="12" y="7" width="3" height="10" rx="0.5" />
    <rect x="17" y="13" width="3" height="4" rx="0.5" />
    <path d="m7 6 4 3 4-4 5 2" opacity="0" />
  </Icon>
)

export const IconTrendUp = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </Icon>
)

export const IconShieldCheck = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
)

export const IconBank = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <line x1="3" x2="21" y1="22" y2="22" />
    <line x1="6" x2="6" y1="18" y2="11" />
    <line x1="10" x2="10" y1="18" y2="11" />
    <line x1="14" x2="14" y1="18" y2="11" />
    <line x1="18" x2="18" y1="18" y2="11" />
    <polygon points="12 2 20 7 4 7" />
  </Icon>
)

export const IconTimer = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <line x1="10" x2="14" y1="2" y2="2" />
    <line x1="12" x2="15" y1="14" y2="11" />
    <circle cx="12" cy="14" r="8" />
  </Icon>
)

export const IconCheckCircle = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </Icon>
)

export const IconLogout = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </Icon>
)

export const IconSmartphone = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </Icon>
)
