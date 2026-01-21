'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type SyncResult = {
  success: boolean
  created: number
  updated: number
  marketsCreated: number
  marketsClosed: number
  error?: string
}

type MarketStats = {
  total: number
  open: number
  closed: number
  resolved: number
  cancelled: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [maxPages, setMaxPages] = useState(3)
  const [stats, setStats] = useState<MarketStats | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [clearResult, setClearResult] = useState<{ success: boolean; error?: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      checkAdmin()
      fetchStats()
    }
  }, [status, router])

  const checkAdmin = async () => {
    try {
      const response = await fetch('/api/admin/check')
      const data = await response.json()
      setIsAdmin(data.isAdmin)
    } catch (error) {
      setIsAdmin(false)
    } finally {
      setChecking(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/admin/sync-trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPages })
      })

      const data = await response.json()

      if (response.ok) {
        setSyncResult(data)
        fetchStats()
      } else {
        setSyncResult({ success: false, created: 0, updated: 0, marketsCreated: 0, marketsClosed: 0, error: data.error })
      }
    } catch (error) {
      setSyncResult({
        success: false,
        created: 0,
        updated: 0,
        marketsCreated: 0,
        marketsClosed: 0,
        error: 'Network error'
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('Are you sure you want to delete ALL trials, markets, positions, and transactions? User balances will be reset to 1000. This cannot be undone!')) {
      return
    }

    setClearing(true)
    setClearResult(null)

    try {
      const response = await fetch('/api/admin/clear', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setClearResult({ success: true })
        fetchStats()
        setSyncResult(null)
      } else {
        setClearResult({ success: false, error: data.error })
      }
    } catch (error) {
      setClearResult({ success: false, error: 'Network error' })
    } finally {
      setClearing(false)
    }
  }

  if (status === 'loading' || checking) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h1>
          <p className="text-red-600 mb-4">
            You don&apos;t have permission to access the admin panel.
          </p>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Markets</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-green-600">{stats.open}</div>
            <div className="text-sm text-gray-500">Open</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.closed}</div>
            <div className="text-sm text-gray-500">Closed</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.resolved}</div>
            <div className="text-sm text-gray-500">Resolved</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-500">Cancelled</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Sync Clinical Trials</h2>
        <p className="text-gray-600 mb-4">
          Fetch Phase 3 clinical trials from ClinicalTrials.gov and create prediction markets.
        </p>

        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-gray-600">
            Pages to fetch (50 trials/page):
          </label>
          <select
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={syncing}
          >
            <option value={1}>1 page (~50 trials)</option>
            <option value={2}>2 pages (~100 trials)</option>
            <option value={3}>3 pages (~150 trials)</option>
            <option value={5}>5 pages (~250 trials)</option>
            <option value={10}>10 pages (~500 trials)</option>
          </select>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            syncing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {syncing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Syncing...
            </span>
          ) : (
            'Sync Trials from ClinicalTrials.gov'
          )}
        </button>

        {syncResult && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              syncResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {syncResult.success ? (
              <div>
                <h3 className="font-semibold text-green-800 mb-2">Sync Complete</h3>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>New trials created: {syncResult.created}</li>
                  <li>Existing trials updated: {syncResult.updated}</li>
                  <li>New markets created: {syncResult.marketsCreated}</li>
                  {syncResult.marketsClosed > 0 && (
                    <li>Markets closed (trial ended): {syncResult.marketsClosed}</li>
                  )}
                </ul>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Sync Failed</h3>
                <p className="text-red-700 text-sm">{syncResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/markets"
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700"
          >
            View Markets
          </Link>
          <Link
            href="/leaderboard"
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700"
          >
            Leaderboard
          </Link>
        </div>
      </div>

      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-800">Danger Zone</h2>
        <p className="text-red-600 mb-4">
          Clear all trials, markets, positions, and transactions. User balances will be reset to 1000.
        </p>

        <button
          onClick={handleClear}
          disabled={clearing || syncing}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            clearing || syncing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {clearing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Clearing...
            </span>
          ) : (
            'Clear All Data'
          )}
        </button>

        {clearResult && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              clearResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-100 border border-red-300'
            }`}
          >
            {clearResult.success ? (
              <p className="text-green-800 font-medium">All data cleared successfully. User balances reset to 1000.</p>
            ) : (
              <p className="text-red-800 font-medium">Failed to clear: {clearResult.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
