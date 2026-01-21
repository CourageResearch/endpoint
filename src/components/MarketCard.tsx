import Link from 'next/link'

type MarketCardProps = {
  market: {
    id: string
    question: string
    status: string
    resolvedOutcome?: string | null
    prices: {
      yes: number
      no: number
    }
    trial: {
      title: string
      phase?: string | null
      status?: string | null
      sponsor?: string | null
      conditions: string[]
    }
    _count?: {
      positions: number
      transactions: number
    }
  }
}

export default function MarketCard({ market }: MarketCardProps) {
  const yesPercent = Math.round(market.prices.yes * 100)
  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-800',
    RESOLVED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-gray-100 text-gray-800'
  }

  return (
    <Link href={`/markets/${market.id}`}>
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4">
        <div className="flex items-start justify-between mb-2">
          <span
            className={`text-xs px-2 py-1 rounded-full ${statusColors[market.status] || 'bg-gray-100 text-gray-800'}`}
          >
            {market.status}
            {market.resolvedOutcome && ` - ${market.resolvedOutcome}`}
          </span>
          {market.trial.phase && (
            <span className="text-xs text-gray-500">{market.trial.phase}</span>
          )}
        </div>

        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {market.question}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {market.trial.title}
        </p>

        {market.trial.sponsor && (
          <p className="text-xs text-gray-500 mb-2">
            Sponsor: {market.trial.sponsor}
          </p>
        )}

        {market.trial.conditions.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {market.trial.conditions.slice(0, 3).map((condition, i) => (
              <span
                key={i}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {condition}
              </span>
            ))}
            {market.trial.conditions.length > 3 && (
              <span className="text-xs text-gray-500">
                +{market.trial.conditions.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex gap-4">
            <div>
              <span className="text-xs text-gray-500">YES</span>
              <div className="text-lg font-semibold text-green-600">
                {yesPercent}%
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">NO</span>
              <div className="text-lg font-semibold text-red-600">
                {100 - yesPercent}%
              </div>
            </div>
          </div>

          {market._count && (
            <div className="text-xs text-gray-500">
              {market._count.transactions} trades
            </div>
          )}
        </div>

        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500"
            style={{ width: `${yesPercent}%` }}
          />
        </div>
      </div>
    </Link>
  )
}
