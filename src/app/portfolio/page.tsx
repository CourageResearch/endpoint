'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import PositionCard from '@/components/PositionCard'
import Link from 'next/link'

type Position = {
  id: string
  yesShares: number
  noShares: number
  totalInvested: number
  currentValue: number
  profit: number
  profitPercent: number
  market: {
    id: string
    question: string
    status: string
    resolvedOutcome?: string | null
    trial: {
      title: string
      phase?: string | null
    }
  }
  prices: { yes: number; no: number }
}

type PortfolioData = {
  user: {
    id: string
    name?: string | null
    email?: string | null
    balance: number
  }
  positions: Position[]
  summary: {
    balance: number
    portfolioValue: number
    totalValue: number
    totalProfit: number
  }
}

export default function PortfolioPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (authStatus === 'authenticated') {
      fetchPortfolio()
    }
  }, [authStatus, router])

  const fetchPortfolio = async () => {
    try {
      const response = await fetch('/api/user/portfolio')
      if (response.ok) {
        const portfolioData = await response.json()
        setData(portfolioData)
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-600">Failed to load portfolio</p>
      </div>
    )
  }

  const isProfitable = data.summary.totalProfit >= 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Portfolio</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Cash Balance</div>
          <div className="text-2xl font-bold text-gray-900">
            {data.summary.balance.toFixed(0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Portfolio Value</div>
          <div className="text-2xl font-bold text-gray-900">
            {data.summary.portfolioValue.toFixed(0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Total Value</div>
          <div className="text-2xl font-bold text-blue-600">
            {data.summary.totalValue.toFixed(0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Total P&L</div>
          <div
            className={`text-2xl font-bold ${
              isProfitable ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isProfitable ? '+' : ''}
            {data.summary.totalProfit.toFixed(0)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Positions</h2>
        <Link
          href="/portfolio/history"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View Transaction History
        </Link>
      </div>

      {data.positions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.positions.map(position => (
            <PositionCard key={position.id} position={position as any} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <p className="text-gray-600 mb-4">You don&apos;t have any positions yet.</p>
          <Link
            href="/markets"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Browse Markets
          </Link>
        </div>
      )}
    </div>
  )
}
