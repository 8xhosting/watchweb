import { db } from '@/lib/db'

/**
 * Global app configuration — read/write helpers for the AppSetting singleton.
 *
 * The panel writes; the user-facing APIs read. Every getter falls back to
 * safe defaults so the app keeps working even before the first save or when
 * the database is briefly unreachable (read-only failure mode).
 */
export interface AppConfig {
  bonusPercent: number
  orderMin: number
  orderMax: number
  maintenance: boolean
  announcement: string
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  bonusPercent: 12.5,
  orderMin: 700,
  orderMax: 9000,
  maintenance: false,
  announcement: '',
}

/** Read the global config, merging DB values over the defaults. */
export async function getAppConfig(): Promise<AppConfig> {
  try {
    const row = await db.appSetting.findUnique({ where: { id: 'global' } })
    if (!row) return { ...APP_CONFIG_DEFAULTS }
    return {
      bonusPercent: Number(row.bonusPercent),
      orderMin: Number(row.orderMin),
      orderMax: Number(row.orderMax),
      maintenance: Boolean(row.maintenance),
      announcement: String(row.announcement ?? ''),
    }
  } catch {
    return { ...APP_CONFIG_DEFAULTS }
  }
}

/** Create-or-update the singleton (MongoDB upsert). */
export async function saveAppConfig(patch: Partial<AppConfig>): Promise<AppConfig> {
  const current = await getAppConfig()
  const next: AppConfig = {
    bonusPercent: clamp(patch.bonusPercent ?? current.bonusPercent, 0, 100),
    orderMin: Math.max(1, patch.orderMin ?? current.orderMin),
    orderMax: Math.max(1, patch.orderMax ?? current.orderMax),
    maintenance: patch.maintenance ?? current.maintenance,
    announcement: (patch.announcement ?? current.announcement).slice(0, 200),
  }
  if (next.orderMax < next.orderMin) next.orderMax = next.orderMin
  await db.appSetting.upsert({
    where: { id: 'global' },
    update: { ...next },
    create: { id: 'global', ...next },
  })
  return next
}

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min
  return Math.min(max, Math.max(min, v))
}

/** Fire-and-forget audit log — never blocks or breaks the calling route. */
export async function adminLog(action: string, detail = ''): Promise<void> {
  try {
    await db.adminLog.create({ data: { action, detail: detail.slice(0, 300) } })
  } catch {
    // logging must never break the action it records
  }
}
