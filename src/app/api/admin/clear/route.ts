import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Delete in order due to foreign key constraints
    const deletedTransactions = await prisma.transaction.deleteMany({})
    const deletedPositions = await prisma.position.deleteMany({})
    const deletedMarkets = await prisma.market.deleteMany({})
    const deletedTrials = await prisma.trial.deleteMany({})

    // Reset all user balances to 1000
    await prisma.user.updateMany({
      data: { balance: 1000 }
    })

    return NextResponse.json({
      success: true,
      deleted: {
        transactions: deletedTransactions.count,
        positions: deletedPositions.count,
        markets: deletedMarkets.count,
        trials: deletedTrials.count
      }
    })
  } catch (error) {
    console.error('Clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    )
  }
}
