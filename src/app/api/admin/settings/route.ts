import { NextResponse } from 'next/server'
import { getAdminFromRequest, adminUnauthorized } from '@/lib/admin-session'
import { getAppConfig, saveAppConfig, adminLog } from '@/lib/app-config'

/**
 * GET   /api/admin/settings — current global app configuration
 * PATCH /api/admin/settings — { bonusPercent?, orderMin?, orderMax?,
 *                               maintenance?, announcement?,
 *                               disabledPlatforms? (string[]) }
 */
export async function GET(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()
  const config = await getAppConfig()
  return NextResponse.json({ ok: true, config })
}

export async function PATCH(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const body = await req.json().catch(() => ({}))
    const patch: Record<string, unknown> = {}
    if (body?.bonusPercent !== undefined) patch.bonusPercent = Number(body.bonusPercent)
    if (body?.orderMin !== undefined) patch.orderMin = Number(body.orderMin)
    if (body?.orderMax !== undefined) patch.orderMax = Number(body.orderMax)
    if (body?.maintenance !== undefined) patch.maintenance = Boolean(body.maintenance)
    if (body?.announcement !== undefined) patch.announcement = String(body.announcement)
    if (Array.isArray(body?.disabledPlatforms)) {
      // keep only real platform names — never let junk into the config
      const ALL = [
        '1Win', 'Stake', 'Parimatch', '4Rabet', '1xBet',
        'MelBet', 'Betway', 'Dafabet', 'BC.Game', 'Mostbet',
      ]
      patch.disabledPlatforms = body.disabledPlatforms
        .map((p: unknown) => String(p))
        .filter((p: string) => ALL.includes(p))
    }

    const config = await saveAppConfig(patch)
    void adminLog('settings.update', JSON.stringify(patch).slice(0, 200))
    return NextResponse.json({ ok: true, config })
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not save settings' }, { status: 500 })
  }
}
