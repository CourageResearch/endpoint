/**
 * Automated Market Maker (AMM) using Constant Product Formula
 *
 * The constant product formula: yesPool * noPool = k
 * Price of YES = noPool / (yesPool + noPool)
 * Price of NO = yesPool / (yesPool + noPool)
 */

export type AMMState = {
  yesPool: number
  noPool: number
}

export type TradeResult = {
  sharesReceived: number
  pricePerShare: number
  newYesPool: number
  newNoPool: number
}

/**
 * Calculate current prices for YES and NO shares
 */
export function getMarketPrices(yesPool: number, noPool: number) {
  const total = yesPool + noPool
  return {
    yes: noPool / total,
    no: yesPool / total
  }
}

/**
 * Calculate how many YES shares you receive for a given amount
 * Formula: shares = yesPool - (k / (noPool + amount))
 */
export function calculateBuyYes(
  yesPool: number,
  noPool: number,
  amount: number
): TradeResult {
  if (amount <= 0) throw new Error('Amount must be positive')

  const k = yesPool * noPool
  const newNoPool = noPool + amount
  const newYesPool = k / newNoPool
  const sharesReceived = yesPool - newYesPool
  const pricePerShare = amount / sharesReceived

  return {
    sharesReceived,
    pricePerShare,
    newYesPool,
    newNoPool
  }
}

/**
 * Calculate how many NO shares you receive for a given amount
 * Formula: shares = noPool - (k / (yesPool + amount))
 */
export function calculateBuyNo(
  yesPool: number,
  noPool: number,
  amount: number
): TradeResult {
  if (amount <= 0) throw new Error('Amount must be positive')

  const k = yesPool * noPool
  const newYesPool = yesPool + amount
  const newNoPool = k / newYesPool
  const sharesReceived = noPool - newNoPool
  const pricePerShare = amount / sharesReceived

  return {
    sharesReceived,
    pricePerShare,
    newYesPool,
    newNoPool
  }
}

/**
 * Calculate how much you receive for selling YES shares
 * Formula: amount = noPool - (k / (yesPool + shares))
 */
export function calculateSellYes(
  yesPool: number,
  noPool: number,
  shares: number
): TradeResult {
  if (shares <= 0) throw new Error('Shares must be positive')

  const k = yesPool * noPool
  const newYesPool = yesPool + shares
  const newNoPool = k / newYesPool
  const amountReceived = noPool - newNoPool
  const pricePerShare = amountReceived / shares

  return {
    sharesReceived: amountReceived,
    pricePerShare,
    newYesPool,
    newNoPool
  }
}

/**
 * Calculate how much you receive for selling NO shares
 * Formula: amount = yesPool - (k / (noPool + shares))
 */
export function calculateSellNo(
  yesPool: number,
  noPool: number,
  shares: number
): TradeResult {
  if (shares <= 0) throw new Error('Shares must be positive')

  const k = yesPool * noPool
  const newNoPool = noPool + shares
  const newYesPool = k / newNoPool
  const amountReceived = yesPool - newYesPool
  const pricePerShare = amountReceived / shares

  return {
    sharesReceived: amountReceived,
    pricePerShare,
    newYesPool,
    newNoPool
  }
}

/**
 * Estimate shares for a buy without executing
 */
export function estimateBuyShares(
  yesPool: number,
  noPool: number,
  amount: number,
  side: 'YES' | 'NO'
): number {
  if (side === 'YES') {
    return calculateBuyYes(yesPool, noPool, amount).sharesReceived
  } else {
    return calculateBuyNo(yesPool, noPool, amount).sharesReceived
  }
}

/**
 * Estimate payout for a sell without executing
 */
export function estimateSellPayout(
  yesPool: number,
  noPool: number,
  shares: number,
  side: 'YES' | 'NO'
): number {
  if (side === 'YES') {
    return calculateSellYes(yesPool, noPool, shares).sharesReceived
  } else {
    return calculateSellNo(yesPool, noPool, shares).sharesReceived
  }
}

/**
 * Calculate the value of a position if the market resolved now
 */
export function calculatePositionValue(
  yesShares: number,
  noShares: number,
  yesPrice: number
): { yesValue: number; noValue: number; totalValue: number } {
  const noPrice = 1 - yesPrice
  const yesValue = yesShares * yesPrice
  const noValue = noShares * noPrice
  return {
    yesValue,
    noValue,
    totalValue: yesValue + noValue
  }
}
