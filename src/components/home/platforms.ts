/**
 * Visual identity for each supported payout platform.
 * Brand-inspired colours for the logo circle, the "Payout Requests From"
 * badge and the card accent bar. Text-based logo marks (no trademark image
 * assets are copied) so every card still reads as a distinct brand.
 */

export interface PlatformStyle {
  /** short mark shown inside the circular logo */
  mark: string
  /** inline style for the logo circle background */
  circleBg: string
  /** logo mark text colour */
  markColor: string
  /** logo mark font style tweak (italic brands) */
  markClass: string
  /** tailwind classes for the small platform badge */
  badgeClass: string
  /** card left accent bar colour */
  accent: string
}

const DEFAULT_STYLE: PlatformStyle = {
  mark: 'WP',
  circleBg: 'linear-gradient(145deg, #0F2B1E, #0A1B12)',
  markColor: '#00E091',
  markClass: 'font-extrabold',
  badgeClass: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  accent: '#00D084',
}

export const PLATFORM_STYLES: Record<string, PlatformStyle> = {
  '1Win': {
    mark: '1Win',
    circleBg: 'linear-gradient(145deg, #1D5BD8, #123C92)',
    markColor: '#FFFFFF',
    markClass: 'font-extrabold italic',
    badgeClass: 'border-[#3D7BFF]/50 bg-[#17469E]/25 text-[#8FB3FF]',
    accent: '#3D7BFF',
  },
  Stake: {
    mark: 'Stake',
    circleBg: 'linear-gradient(145deg, #161C24, #0B0F14)',
    markColor: '#E8F0F8',
    markClass: 'font-bold italic tracking-tight',
    badgeClass: 'border-white/25 bg-white/[0.08] text-slate-200',
    accent: '#9AE6C2',
  },
  Parimatch: {
    mark: 'PM',
    circleBg: 'linear-gradient(145deg, #FFE34D, #F5C400)',
    markColor: '#151515',
    markClass: 'font-black italic',
    badgeClass: 'border-[#FACC15]/50 bg-[#FACC15]/10 text-[#FFE066]',
    accent: '#FACC15',
  },
  '4Rabet': {
    mark: '4RA',
    circleBg: 'linear-gradient(145deg, #1A2430, #0D141C)',
    markColor: '#FF7A59',
    markClass: 'font-black',
    badgeClass: 'border-[#FB7C4A]/40 bg-[#FB7C4A]/10 text-[#FFA385]',
    accent: '#FB7C4A',
  },
  '1xBet': {
    mark: '1x',
    circleBg: 'linear-gradient(145deg, #1663DB, #0B3E97)',
    markColor: '#FFFFFF',
    markClass: 'font-black',
    badgeClass: 'border-[#4F8DFD]/50 bg-[#0F52BA]/20 text-[#9DC0FF]',
    accent: '#4F8DFD',
  },
  MelBet: {
    mark: 'MEL',
    circleBg: 'linear-gradient(145deg, #FFD34D, #EFB100)',
    markColor: '#171200',
    markClass: 'font-black',
    badgeClass: 'border-[#FBBF24]/50 bg-[#FBBF24]/10 text-[#FCD34D]',
    accent: '#FBBF24',
  },
  Betway: {
    mark: 'BW',
    circleBg: 'linear-gradient(145deg, #0FA36B, #066A43)',
    markColor: '#FFFFFF',
    markClass: 'font-extrabold',
    badgeClass: 'border-[#34D399]/40 bg-[#34D399]/10 text-[#6EE7B7]',
    accent: '#34D399',
  },
  Dafabet: {
    mark: 'DAFA',
    circleBg: 'linear-gradient(145deg, #D91F35, #97101F)',
    markColor: '#FFFFFF',
    markClass: 'font-extrabold tracking-tight',
    badgeClass: 'border-[#F87171]/40 bg-[#F87171]/10 text-[#FCA5A5]',
    accent: '#F87171',
  },
  'BC.Game': {
    mark: 'BC',
    circleBg: 'linear-gradient(145deg, #1B1D26, #0D0E13)',
    markColor: '#FFE14D',
    markClass: 'font-black',
    badgeClass: 'border-[#EAB308]/40 bg-[#EAB308]/10 text-[#FDE047]',
    accent: '#EAB308',
  },
  Mostbet: {
    mark: 'M',
    circleBg: 'linear-gradient(145deg, #0B93DD, #075C96)',
    markColor: '#FFFFFF',
    markClass: 'font-black',
    badgeClass: 'border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#7DD3FC]',
    accent: '#38BDF8',
  },
}

export function platformStyle(source: string): PlatformStyle {
  return PLATFORM_STYLES[source] ?? DEFAULT_STYLE
}
