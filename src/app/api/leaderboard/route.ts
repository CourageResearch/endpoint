import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMarketPrices } from '@/lib/amm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        balance: true,
        positions: {
          include: {
            market: true
          }
        },
        _count: {
          select: { transactions: true }
        }
      }
    })

    const leaderboard = users.map(user => {
      const portfolioValue = user.positions.reduce((sum, position) => {
        const prices = getMarketPrices(position.market.yesPool, position.market.noPool)
        return sum + position.yesShares * prices.yes + position.noShares * prices.no
      }, 0)

      const totalInvested = user.positions.reduce(
        (sum, p) => sum + p.totalInvested,
        0
      )

      const totalValue = user.balance + portfolioValue
      const initialBalance = 1000
      const totalProfit = totalValue - initialBalance

      return {
        id: user.id,
        name: user.name || 'Anonymous',
        balance: user.balance,
        portfolioValue,
        totalValue,
        totalProfit,
        tradesCount: user._count.transactions
      }
    })

    leaderboard.sort((a, b) => b.totalValue - a.totalValue)

    return NextResponse.json({
      leaderboard: leaderboard.slice(0, limit)
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
