'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import LeaderboardTable from '@/components/LeaderboardTable'

type LeaderboardEntry = {
  id: string
  name: string
  balance: number
  portfolioValue: number
  totalValue: number
  totalProfit: number
  tradesCount: number
}

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard')
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.leaderboard)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="bg-white rounded-lg shadow-sm border p-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b last:border-b-0">
                <div className="h-6 w-6 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/6 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Leaderboard</h1>

      <div className="mb-6 text-sm text-gray-600">
        <p>Rankings based on total portfolio value (balance + positions)</p>
      </div>

      {leaderboard.length > 0 ? (
        <LeaderboardTable
          entries={leaderboard}
          currentUserId={session?.user?.id}
        />
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <p className="text-gray-600">No traders yet. Be the first!</p>
        </div>
      )}
    </div>
  )
}
