import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMarketPrices } from '@/lib/amm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { trial: { title: { contains: search, mode: 'insensitive' } } },
        { trial: { sponsor: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [markets, total] = await Promise.all([
      prisma.market.findMany({
        where,
        include: { trial: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.market.count({ where })
    ])

    const marketsWithPrices = markets.map(market => ({
      ...market,
      prices: getMarketPrices(market.yesPool, market.noPool)
    }))

    return NextResponse.json({
      markets: marketsWithPrices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching markets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    )
  }
}
