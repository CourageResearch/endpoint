'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type TradingPanelProps = {
  marketId: string
  yesPrice: number
  noPrice: number
  userPosition?: {
    yesShares: number
    noShares: number
  } | null
  userBalance?: number
  isOpen: boolean
}

export default function TradingPanel({
  marketId,
  yesPrice,
  noPrice,
  userPosition,
  userBalance = 0,
  isOpen
}: TradingPanelProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [side, setSide] = useState<'YES' | 'NO'>('YES')
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentPrice = side === 'YES' ? yesPrice : noPrice
  const estimatedShares = amount ? parseFloat(amount) / currentPrice : 0
  const maxSell = side === 'YES' ? userPosition?.yesShares || 0 : userPosition?.noShares || 0

  const handleTrade = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (action === 'BUY' && numAmount > userBalance) {
      setError('Insufficient balance')
      return
    }

    if (action === 'SELL' && numAmount > maxSell) {
      setError('Insufficient shares')
      return
    }

    setLoading(true)
    setError('')

    try {
      const type = `${action}_${side}`
      const response = await fetch(`/api/markets/${marketId}/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount: numAmount })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Trade failed')
      }

      setAmount('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-center">
        <p className="text-gray-600">This market is closed for trading</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="font-semibold text-lg mb-4">Trade</h3>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSide('YES')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            side === 'YES'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          YES ({Math.round(yesPrice * 100)}%)
        </button>
        <button
          onClick={() => setSide('NO')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            side === 'NO'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          NO ({Math.round(noPrice * 100)}%)
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setAction('BUY')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            action === 'BUY'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setAction('SELL')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            action === 'SELL'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">
          {action === 'BUY' ? 'Amount to spend' : 'Shares to sell'}
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {action === 'BUY' && session && (
          <p className="text-xs text-gray-500 mt-1">
            Balance: {userBalance.toFixed(2)} points
          </p>
        )}
        {action === 'SELL' && session && (
          <p className="text-xs text-gray-500 mt-1">
            Available: {maxSell.toFixed(2)} shares
          </p>
        )}
      </div>

      {amount && parseFloat(amount) > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {action === 'BUY' ? 'Est. shares' : 'Est. payout'}
            </span>
            <span className="font-medium">
              {action === 'BUY'
                ? estimatedShares.toFixed(2)
                : (parseFloat(amount) * currentPrice).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Price per share</span>
            <span className="font-medium">{currentPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleTrade}
        disabled={loading || !amount}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          loading || !amount
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : side === 'YES'
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        {loading ? 'Processing...' : `${action} ${side}`}
      </button>

      {userPosition && (userPosition.yesShares > 0 || userPosition.noShares > 0) && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your Position</h4>
          <div className="flex justify-between text-sm">
            <span className="text-green-600">YES shares</span>
            <span>{userPosition.yesShares.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-red-600">NO shares</span>
            <span>{userPosition.noShares.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
