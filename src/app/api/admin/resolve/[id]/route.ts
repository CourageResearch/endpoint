import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveMarket, cancelMarket } from '@/lib/market'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: marketId } = await params
    const body = await request.json()
    const { outcome } = body

    if (!outcome || !['YES', 'NO', 'CANCEL'].includes(outcome)) {
      return NextResponse.json(
        { error: 'Invalid outcome. Must be YES, NO, or CANCEL' },
        { status: 400 }
      )
    }

    if (outcome === 'CANCEL') {
      await cancelMarket(marketId)
    } else {
      await resolveMarket(marketId, outcome as 'YES' | 'NO')
    }

    return NextResponse.json({
      success: true,
      marketId,
      outcome
    })
  } catch (error) {
    console.error('Resolution error:', error)
    const message = error instanceof Error ? error.message : 'Failed to resolve market'
    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
