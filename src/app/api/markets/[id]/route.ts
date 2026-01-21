import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMarketPrices } from '@/lib/amm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const market = await prisma.market.findUnique({
      where: { id },
      include: {
        trial: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        _count: {
          select: { positions: true, transactions: true }
        }
      }
    })

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      )
    }

    const prices = getMarketPrices(market.yesPool, market.noPool)

    return NextResponse.json({
      ...market,
      prices
    })
  } catch (error) {
    console.error('Error fetching market:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market' },
      { status: 500 }
    )
  }
}
