import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [total, open, closed, resolved, cancelled] = await Promise.all([
      prisma.market.count(),
      prisma.market.count({ where: { status: 'OPEN' } }),
      prisma.market.count({ where: { status: 'CLOSED' } }),
      prisma.market.count({ where: { status: 'RESOLVED' } }),
      prisma.market.count({ where: { status: 'CANCELLED' } })
    ])

    return NextResponse.json({
      total,
      open,
      closed,
      resolved,
      cancelled
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
