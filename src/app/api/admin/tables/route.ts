import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAILS = ['curatedao@gmail.com']

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table')

  try {
    switch (table) {
      case 'users':
        const users = await prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            balance: true,
            emailVerified: true,
            createdAt: true,
            _count: {
              select: {
                positions: true,
                transactions: true
              }
            }
          }
        })
        return NextResponse.json(users)

      case 'positions':
        const positions = await prisma.position.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { email: true } },
            market: {
              select: {
                question: true,
                status: true,
                trial: { select: { nctId: true } }
              }
            }
          },
          take: 100
        })
        return NextResponse.json(positions)

      case 'transactions':
        const transactions = await prisma.transaction.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { email: true } },
            market: {
              select: {
                question: true,
                trial: { select: { nctId: true } }
              }
            }
          },
          take: 100
        })
        return NextResponse.json(transactions)

      case 'markets':
        const markets = await prisma.market.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            trial: { select: { nctId: true, title: true } },
            _count: {
              select: {
                positions: true,
                transactions: true
              }
            }
          },
          take: 100
        })
        return NextResponse.json(markets)

      case 'trials':
        const trials = await prisma.trial.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            market: { select: { id: true, status: true } }
          },
          take: 100
        })
        return NextResponse.json(trials)

      default:
        return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching table:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
