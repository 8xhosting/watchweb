import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, adminUnauthorized } from '@/lib/admin-session'

/**
 * GET /api/admin/logs — admin audit trail (latest 80 entries).
 */
export async function GET(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const logs = await db.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 80,
    })
    return NextResponse.json({
      ok: true,
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        detail: l.detail,
        createdAt: l.createdAt.toISOString(),
      })),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to load logs' }, { status: 500 })
  }
}
