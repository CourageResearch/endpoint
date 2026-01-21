import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getMarketPrices } from '@/lib/amm'
import MarketCard from '@/components/MarketCard'

export const dynamic = 'force-dynamic'

async function getFeaturedMarkets() {
  const markets = await prisma.market.findMany({
    where: { status: 'OPEN' },
    include: {
      trial: true,
      _count: { select: { transactions: true, positions: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 6
  })

  return markets.map(market => ({
    ...market,
    prices: getMarketPrices(market.yesPool, market.noPool)
  }))
}

async function getStats() {
  const [marketCount, userCount, transactionCount] = await Promise.all([
    prisma.market.count({ where: { status: 'OPEN' } }),
    prisma.user.count(),
    prisma.transaction.count()
  ])

  return { marketCount, userCount, transactionCount }
}

export default async function HomePage() {
  const [markets, stats] = await Promise.all([
    getFeaturedMarkets(),
    getStats()
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Endpoint
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Predict FDA approval outcomes for clinical trials. Trade with play money
          and compete with other traders.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/markets"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Markets
          </Link>
          <Link
            href="/auth/signup"
            className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {stats.marketCount}
          </div>
          <div className="text-gray-600">Open Markets</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats.userCount}
          </div>
          <div className="text-gray-600">Traders</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {stats.transactionCount}
          </div>
          <div className="text-gray-600">Total Trades</div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Markets</h2>
          <Link
            href="/markets"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </Link>
        </div>

        {markets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map(market => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <p className="text-gray-600 mb-4">No markets available yet.</p>
            <p className="text-sm text-gray-500">
              Markets are created automatically when clinical trials are synced.
            </p>
          </div>
        )}
      </section>

      <section className="mt-12 bg-white rounded-lg shadow-sm border p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-3xl mb-3">1</div>
            <h3 className="font-semibold text-lg mb-2">Sign Up</h3>
            <p className="text-gray-600">
              Create an account and receive 1,000 play money points to start trading.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-3">2</div>
            <h3 className="font-semibold text-lg mb-2">Research & Trade</h3>
            <p className="text-gray-600">
              Browse clinical trials, analyze the data, and buy YES or NO shares based
              on your prediction.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-3">3</div>
            <h3 className="font-semibold text-lg mb-2">Earn Rewards</h3>
            <p className="text-gray-600">
              When trials receive FDA decisions, markets resolve and winning positions
              pay out.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
