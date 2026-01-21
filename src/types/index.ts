import { Market, Trial, Position, Transaction, User } from '@prisma/client'

export type MarketWithTrial = Market & {
  trial: Trial
}

export type MarketWithDetails = Market & {
  trial: Trial
  positions: Position[]
  transactions: Transaction[]
}

export type PositionWithMarket = Position & {
  market: MarketWithTrial
}

export type TransactionWithMarket = Transaction & {
  market: MarketWithTrial
}

export type LeaderboardEntry = {
  id: string
  name: string | null
  balance: number
  totalProfit: number
  tradesCount: number
}

export type TradeRequest = {
  marketId: string
  type: 'BUY_YES' | 'BUY_NO' | 'SELL_YES' | 'SELL_NO'
  amount: number
}

export type TradeResult = {
  shares: number
  price: number
  newYesPool: number
  newNoPool: number
  newBalance: number
}

export type MarketPrice = {
  yes: number
  no: number
}
