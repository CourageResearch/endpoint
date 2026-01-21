import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMarketPrices } from '@/lib/amm'
import TradingPanel from '@/components/TradingPanel'

export const dynamic = 'force-dynamic'

async function getMarket(id: string) {
  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      trial: true,
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { name: true } }
        }
      },
      _count: { select: { positions: true, transactions: true } }
    }
  })

  if (!market) return null

  return {
    ...market,
    prices: getMarketPrices(market.yesPool, market.noPool)
  }
}

async function getUserPosition(userId: string, marketId: string) {
  return prisma.position.findUnique({
    where: { userId_marketId: { userId, marketId } }
  })
}

async function getUserBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true }
  })
  return user?.balance || 0
}

export default async function MarketDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const market = await getMarket(id)

  if (!market) {
    notFound()
  }

  const session = await getServerSession(authOptions)
  let userPosition = null
  let userBalance = 0

  if (session?.user?.id) {
    [userPosition, userBalance] = await Promise.all([
      getUserPosition(session.user.id, id),
      getUserBalance(session.user.id)
    ])
  }

  const yesPercent = Math.round(market.prices.yes * 100)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  market.status === 'OPEN'
                    ? 'bg-green-100 text-green-800'
                    : market.status === 'RESOLVED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {market.status}
                {market.resolvedOutcome && ` - ${market.resolvedOutcome}`}
              </span>
              {market.trial.phase && (
                <span className="text-xs text-gray-500">{market.trial.phase}</span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {market.question}
            </h1>

            <div className="flex items-center gap-8 mb-6">
              <div>
                <span className="text-sm text-gray-500">YES</span>
                <div className="text-3xl font-bold text-green-600">
                  {yesPercent}%
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">NO</span>
                <div className="text-3xl font-bold text-red-600">
                  {100 - yesPercent}%
                </div>
              </div>
            </div>

            <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-green-500"
                style={{ width: `${yesPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Trades</span>
                <div className="font-semibold">{market._count.transactions}</div>
              </div>
              <div>
                <span className="text-gray-500">Traders</span>
                <div className="font-semibold">{market._count.positions}</div>
              </div>
              <div>
                <span className="text-gray-500">YES Pool</span>
                <div className="font-semibold">{market.yesPool.toFixed(0)}</div>
              </div>
              <div>
                <span className="text-gray-500">NO Pool</span>
                <div className="font-semibold">{market.noPool.toFixed(0)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Trial Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Title</dt>
                <dd className="font-medium">{market.trial.title}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">NCT ID</dt>
                <dd className="font-medium">
                  <a
                    href={`https://clinicaltrials.gov/study/${market.trial.nctId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {market.trial.nctId}
                  </a>
                </dd>
              </div>
              {market.trial.sponsor && (
                <div>
                  <dt className="text-sm text-gray-500">Sponsor</dt>
                  <dd className="font-medium">{market.trial.sponsor}</dd>
                </div>
              )}
              {market.trial.status && (
                <div>
                  <dt className="text-sm text-gray-500">Trial Status</dt>
                  <dd className="font-medium">{market.trial.status}</dd>
                </div>
              )}
              {market.trial.conditions.length > 0 && (
                <div>
                  <dt className="text-sm text-gray-500">Conditions</dt>
                  <dd className="flex flex-wrap gap-2 mt-1">
                    {market.trial.conditions.map((condition, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                      >
                        {condition}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {market.trial.interventions.length > 0 && (
                <div>
                  <dt className="text-sm text-gray-500">Interventions</dt>
                  <dd className="flex flex-wrap gap-2 mt-1">
                    {market.trial.interventions.map((intervention, i) => (
                      <span
                        key={i}
                        className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm"
                      >
                        {intervention}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            {market.transactions.length > 0 ? (
              <div className="space-y-3">
                {market.transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div>
                      <span className="font-medium">
                        {tx.user.name || 'Anonymous'}
                      </span>
                      <span
                        className={`ml-2 text-sm ${
                          tx.type.includes('YES')
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {tx.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {tx.shares.toFixed(2)} shares @ {tx.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No activity yet</p>
            )}
          </div>
        </div>

        <div>
          <TradingPanel
            marketId={market.id}
            yesPrice={market.prices.yes}
            noPrice={market.prices.no}
            userPosition={userPosition}
            userBalance={userBalance}
            isOpen={market.status === 'OPEN'}
          />
        </div>
      </div>
    </div>
  )
}
