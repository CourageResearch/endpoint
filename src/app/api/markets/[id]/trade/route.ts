import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { executeTrade } from '@/lib/market'

const VALID_TRADE_TYPES = ['BUY_YES', 'BUY_NO', 'SELL_YES', 'SELL_NO']

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
    const { type, amount } = body

    if (!type || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid trade parameters' },
        { status: 400 }
      )
    }

    if (!VALID_TRADE_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid trade type' },
        { status: 400 }
      )
    }

    const result = await executeTrade({
      userId: session.user.id,
      marketId,
      type,
      amount
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Trade error:', error)
    const message = error instanceof Error ? error.message : 'Trade failed'
    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
