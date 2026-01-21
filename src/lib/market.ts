import { prisma } from './prisma'
import {
  calculateBuyYes,
  calculateBuyNo,
  calculateSellYes,
  calculateSellNo,
  getMarketPrices
} from './amm'

export type TradeInput = {
  userId: string
  marketId: string
  type: string
  amount: number
}

export type TradeOutput = {
  shares: number
  avgPrice: number
  newBalance: number
  newYesPool: number
  newNoPool: number
}

/**
 * Execute a trade on a market
 */
export async function executeTrade(input: TradeInput): Promise<TradeOutput> {
  const { userId, marketId, type, amount } = input

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const market = await tx.market.findUnique({ where: { id: marketId } })
    if (!market) throw new Error('Market not found')
    if (market.status !== 'OPEN') throw new Error('Market is not open')

    let position = await tx.position.findUnique({
      where: { userId_marketId: { userId, marketId } }
    })

    let shares: number
    let newYesPool: number
    let newNoPool: number
    let balanceChange: number
    let avgPrice: number

    if (type === 'BUY_YES' || type === 'BUY_NO') {
      if (user.balance < amount) throw new Error('Insufficient balance')

      if (type === 'BUY_YES') {
        const result = calculateBuyYes(market.yesPool, market.noPool, amount)
        shares = result.sharesReceived
        newYesPool = result.newYesPool
        newNoPool = result.newNoPool
        avgPrice = result.pricePerShare
      } else {
        const result = calculateBuyNo(market.yesPool, market.noPool, amount)
        shares = result.sharesReceived
        newYesPool = result.newYesPool
        newNoPool = result.newNoPool
        avgPrice = result.pricePerShare
      }

      balanceChange = -amount

      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } }
      })

      if (position) {
        await tx.position.update({
          where: { id: position.id },
          data: {
            yesShares: type === 'BUY_YES'
              ? { increment: shares }
              : position.yesShares,
            noShares: type === 'BUY_NO'
              ? { increment: shares }
              : position.noShares,
            totalInvested: { increment: amount }
          }
        })
      } else {
        await tx.position.create({
          data: {
            userId,
            marketId,
            yesShares: type === 'BUY_YES' ? shares : 0,
            noShares: type === 'BUY_NO' ? shares : 0,
            totalInvested: amount
          }
        })
      }
    } else {
      if (!position) throw new Error('No position to sell')

      const sharesToSell = amount

      if (type === 'SELL_YES') {
        if (position.yesShares < sharesToSell) throw new Error('Insufficient YES shares')
        const result = calculateSellYes(market.yesPool, market.noPool, sharesToSell)
        shares = sharesToSell
        balanceChange = result.sharesReceived
        newYesPool = result.newYesPool
        newNoPool = result.newNoPool
        avgPrice = result.pricePerShare
      } else {
        if (position.noShares < sharesToSell) throw new Error('Insufficient NO shares')
        const result = calculateSellNo(market.yesPool, market.noPool, sharesToSell)
        shares = sharesToSell
        balanceChange = result.sharesReceived
        newYesPool = result.newYesPool
        newNoPool = result.newNoPool
        avgPrice = result.pricePerShare
      }

      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: balanceChange } }
      })

      await tx.position.update({
        where: { id: position.id },
        data: {
          yesShares: type === 'SELL_YES'
            ? { decrement: shares }
            : position.yesShares,
          noShares: type === 'SELL_NO'
            ? { decrement: shares }
            : position.noShares
        }
      })
    }

    await tx.market.update({
      where: { id: marketId },
      data: { yesPool: newYesPool, noPool: newNoPool }
    })

    await tx.transaction.create({
      data: {
        userId,
        marketId,
        type,
        shares,
        price: avgPrice,
        amount: Math.abs(balanceChange)
      }
    })

    const updatedUser = await tx.user.findUnique({ where: { id: userId } })

    return {
      shares,
      avgPrice,
      newBalance: updatedUser!.balance,
      newYesPool,
      newNoPool
    }
  })
}

/**
 * Resolve a market and distribute payouts
 */
export async function resolveMarket(
  marketId: string,
  outcome: 'YES' | 'NO'
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const market = await tx.market.findUnique({
      where: { id: marketId },
      include: { positions: true }
    })

    if (!market) throw new Error('Market not found')
    if (market.status !== 'OPEN') throw new Error('Market already resolved')

    for (const position of market.positions) {
      const payout = outcome === 'YES'
        ? position.yesShares
        : position.noShares

      if (payout > 0) {
        await tx.user.update({
          where: { id: position.userId },
          data: { balance: { increment: payout } }
        })
      }
    }

    await tx.market.update({
      where: { id: marketId },
      data: {
        status: 'RESOLVED',
        resolvedOutcome: outcome,
        resolvedAt: new Date()
      }
    })
  })
}

/**
 * Cancel a market and refund all positions
 */
export async function cancelMarket(marketId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const market = await tx.market.findUnique({
      where: { id: marketId },
      include: { positions: true }
    })

    if (!market) throw new Error('Market not found')
    if (market.status !== 'OPEN') throw new Error('Market not open')

    for (const position of market.positions) {
      await tx.user.update({
        where: { id: position.userId },
        data: { balance: { increment: position.totalInvested } }
      })
    }

    await tx.market.update({
      where: { id: marketId },
      data: { status: 'CANCELLED' }
    })
  })
}

/**
 * Create a new market for a trial
 */
export async function createMarket(
  trialId: string,
  question: string
): Promise<string> {
  const market = await prisma.market.create({
    data: {
      trialId,
      question,
      yesPool: 1000,
      noPool: 1000,
      status: 'OPEN'
    }
  })
  return market.id
}

/**
 * Get market with current prices
 */
export async function getMarketWithPrices(marketId: string) {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { trial: true }
  })

  if (!market) return null

  const prices = getMarketPrices(market.yesPool, market.noPool)

  return {
    ...market,
    prices
  }
}
