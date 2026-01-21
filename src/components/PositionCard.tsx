import Link from 'next/link'

type PositionCardProps = {
  position: {
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
    prices: {
      yes: number
      no: number
    }
  }
}

export default function PositionCard({ position }: PositionCardProps) {
  const isProfitable = position.profit >= 0

  return (
    <Link href={`/markets/${position.market.id}`}>
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4">
        <div className="flex items-start justify-between mb-2">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              position.market.status === 'OPEN'
                ? 'bg-green-100 text-green-800'
                : position.market.status === 'RESOLVED'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {position.market.status}
            {position.market.resolvedOutcome && ` - ${position.market.resolvedOutcome}`}
          </span>
          {position.market.trial.phase && (
            <span className="text-xs text-gray-500">
              {position.market.trial.phase}
            </span>
          )}
        </div>

        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {position.market.question}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-1">
          {position.market.trial.title}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <span className="text-xs text-gray-500">YES Shares</span>
            <div className="font-semibold text-green-600">
              {position.yesShares.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500">NO Shares</span>
            <div className="font-semibold text-red-600">
              {position.noShares.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Invested</span>
            <span>{position.totalInvested.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Current Value</span>
            <span>{position.currentValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">P&L</span>
            <span
              className={`font-medium ${
                isProfitable ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isProfitable ? '+' : ''}
              {position.profit.toFixed(2)} ({position.profitPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
