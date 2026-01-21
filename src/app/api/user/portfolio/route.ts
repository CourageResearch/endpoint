import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMarketPrices } from '@/lib/amm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, balance: true, name: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const positions = await prisma.position.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { yesShares: { gt: 0 } },
          { noShares: { gt: 0 } }
        ]
      },
      include: {
        market: {
          include: { trial: true }
        }
      }
    })

    const positionsWithValues = positions.map(position => {
      const prices = getMarketPrices(position.market.yesPool, position.market.noPool)
      const currentValue =
        position.yesShares * prices.yes + position.noShares * prices.no
      const profit = currentValue - position.totalInvested

      return {
        ...position,
        prices,
        currentValue,
        profit,
        profitPercent: position.totalInvested > 0
          ? (profit / position.totalInvested) * 100
          : 0
      }
    })

    const totalPortfolioValue = positionsWithValues.reduce(
      (sum, p) => sum + p.currentValue,
      0
    )

    const totalProfit = positionsWithValues.reduce(
      (sum, p) => sum + p.profit,
      0
    )

    return NextResponse.json({
      user,
      positions: positionsWithValues,
      summary: {
        balance: user.balance,
        portfolioValue: totalPortfolioValue,
        totalValue: user.balance + totalPortfolioValue,
        totalProfit
      }
    })
  } catch (error) {
    console.error('Portfolio error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}
