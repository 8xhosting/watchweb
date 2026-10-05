import { NextResponse } from 'next/server'
import { getAppConfig } from '@/lib/app-config'

/**
 * GET /api/app-config — PUBLIC endpoint.
 * The user app polls this (15s) so the Admin Master Control panel can push
 * live changes to every device: maintenance mode + announcement banner.
 */
export async function GET() {
  const config = await getAppConfig()
  return NextResponse.json({
    ok: true,
    maintenance: config.maintenance,
    announcement: config.announcement,
    bonusPercent: config.bonusPercent,
  })
}
