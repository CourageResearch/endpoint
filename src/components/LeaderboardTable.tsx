type LeaderboardEntry = {
  id: string
  name: string
  balance: number
  portfolioValue: number
  totalValue: number
  totalProfit: number
  tradesCount: number
}

type LeaderboardTableProps = {
  entries: LeaderboardEntry[]
  currentUserId?: string
}

export default function LeaderboardTable({
  entries,
  currentUserId
}: LeaderboardTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trader
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Balance
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Portfolio
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Profit
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Trades
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry, index) => (
            <tr
              key={entry.id}
              className={`${
                entry.id === currentUserId ? 'bg-blue-50' : ''
              } hover:bg-gray-50`}
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  {index < 3 ? (
                    <span
                      className={`text-lg ${
                        index === 0
                          ? 'text-yellow-500'
                          : index === 1
                          ? 'text-gray-400'
                          : 'text-amber-600'
                      }`}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">{index + 1}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.name}
                    {entry.id === currentUserId && (
                      <span className="ml-2 text-xs text-blue-600">(You)</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                {entry.balance.toFixed(0)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500 hidden sm:table-cell">
                {entry.portfolioValue.toFixed(0)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                {entry.totalValue.toFixed(0)}
              </td>
              <td
                className={`px-4 py-3 whitespace-nowrap text-right text-sm font-medium hidden md:table-cell ${
                  entry.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {entry.totalProfit >= 0 ? '+' : ''}
                {entry.totalProfit.toFixed(0)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500 hidden lg:table-cell">
                {entry.tradesCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
