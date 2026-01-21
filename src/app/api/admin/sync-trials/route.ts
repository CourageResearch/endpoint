import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { syncTrials } from '@/lib/clinicaltrials'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const maxPages = Math.min(body.maxPages || 3, 10)

    const result = await syncTrials(maxPages)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync trials' },
      { status: 500 }
    )
  }
}
