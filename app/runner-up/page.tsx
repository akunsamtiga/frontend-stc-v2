// app/(main)/runner-up/page.tsx - Top Traders Leaderboard
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Award,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Zap,
  Crown,
  Medal,
  Star,
  BarChart3,
  Calendar
} from 'lucide-react'

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'alltime'

interface TopTrader {
  rank: number
  userId: string
  username: string
  country: string
  totalProfit: number
  totalTrades: number
  winRate: number
  avgProfit: number
  bestTrade: number
  consecutiveWins: number
  badge?: 'legendary' | 'master' | 'expert'
}

const TOP_TRADERS: Record<TimeFrame, TopTrader[]> = {
  daily: [
    { rank: 1, userId: '1', username: 'QuickProfit', country: 'SG', totalProfit: 15420, totalTrades: 42, winRate: 92.8, avgProfit: 367, bestTrade: 2100, consecutiveWins: 12, badge: 'legendary' },
    { rank: 2, userId: '2', username: 'SpeedTrader', country: 'US', totalProfit: 12890, totalTrades: 38, winRate: 89.5, avgProfit: 339, bestTrade: 1850, consecutiveWins: 10 },
    { rank: 3, userId: '3', username: 'DayMaster', country: 'UK', totalProfit: 11200, totalTrades: 35, winRate: 88.6, avgProfit: 320, bestTrade: 1650, consecutiveWins: 9 },
    { rank: 4, userId: '4', username: 'FastGains', country: 'ID', totalProfit: 9870, totalTrades: 31, winRate: 87.1, avgProfit: 318, bestTrade: 1420, consecutiveWins: 8 },
    { rank: 5, userId: '5', username: 'LightningFX', country: 'JP', totalProfit: 8920, totalTrades: 29, winRate: 86.2, avgProfit: 307, bestTrade: 1380, consecutiveWins: 7 },
  ],
  weekly: [
    { rank: 1, userId: '1', username: 'WeeklyKing', country: 'US', totalProfit: 87450, totalTrades: 234, winRate: 88.5, avgProfit: 374, bestTrade: 4200, consecutiveWins: 18, badge: 'legendary' },
    { rank: 2, userId: '2', username: 'ConsistentWin', country: 'UK', totalProfit: 76200, totalTrades: 198, winRate: 87.4, avgProfit: 385, bestTrade: 3950, consecutiveWins: 16, badge: 'master' },
    { rank: 3, userId: '3', username: 'WeekWarrior', country: 'SG', totalProfit: 68900, totalTrades: 187, winRate: 86.1, avgProfit: 368, bestTrade: 3600, consecutiveWins: 14, badge: 'master' },
    { rank: 4, userId: '4', username: 'ProfitSeeker', country: 'AU', totalProfit: 62100, totalTrades: 176, winRate: 84.7, avgProfit: 353, bestTrade: 3400, consecutiveWins: 13 },
    { rank: 5, userId: '5', username: 'TradeElite', country: 'CA', totalProfit: 58300, totalTrades: 165, winRate: 83.6, avgProfit: 353, bestTrade: 3200, consecutiveWins: 12 },
  ],
  monthly: [
    { rank: 1, userId: '1', username: 'MonthlyChamp', country: 'US', totalProfit: 345600, totalTrades: 892, winRate: 86.2, avgProfit: 387, bestTrade: 8900, consecutiveWins: 24, badge: 'legendary' },
    { rank: 2, userId: '2', username: 'ProfitMachine', country: 'UK', totalProfit: 298700, totalTrades: 765, winRate: 85.3, avgProfit: 390, bestTrade: 7800, consecutiveWins: 22, badge: 'legendary' },
    { rank: 3, userId: '3', username: 'TradeMaster88', country: 'SG', totalProfit: 267800, totalTrades: 698, winRate: 84.1, avgProfit: 383, bestTrade: 7200, consecutiveWins: 20, badge: 'master' },
    { rank: 4, userId: '4', username: 'GoldTrader', country: 'JP', totalProfit: 245300, totalTrades: 654, winRate: 82.9, avgProfit: 375, bestTrade: 6800, consecutiveWins: 19, badge: 'master' },
    { rank: 5, userId: '5', username: 'ForexKing', country: 'AU', totalProfit: 228900, totalTrades: 612, winRate: 81.8, avgProfit: 374, bestTrade: 6500, consecutiveWins: 18, badge: 'expert' },
  ],
  alltime: [
    { rank: 1, userId: '1', username: 'LegendTrader', country: 'US', totalProfit: 2456700, totalTrades: 5432, winRate: 84.7, avgProfit: 452, bestTrade: 25000, consecutiveWins: 38, badge: 'legendary' },
    { rank: 2, userId: '2', username: 'ProElite99', country: 'UK', totalProfit: 2198900, totalTrades: 4876, winRate: 83.9, avgProfit: 451, bestTrade: 22000, consecutiveWins: 35, badge: 'legendary' },
    { rank: 3, userId: '3', username: 'MasterTrader', country: 'SG', totalProfit: 1987600, totalTrades: 4321, winRate: 82.8, avgProfit: 460, bestTrade: 21000, consecutiveWins: 32, badge: 'legendary' },
    { rank: 4, userId: '4', username: 'GlobalTrader', country: 'JP', totalProfit: 1845300, totalTrades: 3987, winRate: 81.6, avgProfit: 463, bestTrade: 19500, consecutiveWins: 30, badge: 'master' },
    { rank: 5, userId: '5', username: 'OptionsMaster', country: 'AU', totalProfit: 1723800, totalTrades: 3765, winRate: 80.9, avgProfit: 458, bestTrade: 18500, consecutiveWins: 28, badge: 'master' },
  ],
}

export default function RunnerUpPage() {
  const router = useRouter()
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('monthly')

  const traders = TOP_TRADERS[selectedTimeFrame]

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />
      case 2: return <Medal className="w-6 h-6 text-gray-400" />
      case 3: return <Medal className="w-6 h-6 text-orange-400" />
      default: return <span className="text-lg font-bold text-gray-500">#{rank}</span>
    }
  }

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50'
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50'
      case 3: return 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50'
      default: return 'bg-[#1a1f2e] border-gray-800/50'
    }
  }

  const getBadgeConfig = (badge?: string) => {
    switch (badge) {
      case 'legendary':
        return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', label: 'LEGENDARY' }
      case 'master':
        return { color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50', label: 'MASTER' }
      case 'expert':
        return { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50', label: 'EXPERT' }
      default:
        return null
    }
  }

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'US': '🇺🇸',
      'UK': '🇬🇧',
      'SG': '🇸🇬',
      'JP': '🇯🇵',
      'AU': '🇦🇺',
      'CA': '🇨🇦',
      'ID': '🇮🇩',
    }
    return flags[country] || '🌍'
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* Header */}
      <div className="bg-[#1a1f2e] border-b border-gray-800/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#232936] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-bold">Trader Terbaik</h1>
            </div>
          </div>

          {/* TimeFrame Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { value: 'daily' as const, label: 'Today', icon: Zap },
              { value: 'weekly' as const, label: 'This Week', icon: Calendar },
              { value: 'monthly' as const, label: 'This Month', icon: TrendingUp },
              { value: 'alltime' as const, label: 'All Time', icon: Crown },
            ].map((tf) => (
              <button
                key={tf.value}
                onClick={() => setSelectedTimeFrame(tf.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedTimeFrame === tf.value
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-[#2f3648] text-gray-400 hover:bg-[#3a4360] border border-gray-800/50'
                }`}
              >
                <tf.icon className="w-4 h-4" />
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {traders.slice(0, 3).map((trader) => {
            const badgeConfig = getBadgeConfig(trader.badge)
            return (
              <div
                key={trader.userId}
                className={`rounded-xl p-6 border-2 ${getRankBg(trader.rank)}`}
              >
                <div className="text-center mb-4">
                  {getRankIcon(trader.rank)}
                </div>
                <div className="flex justify-center mb-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-2xl font-bold border-4 border-white/10">
                    {trader.username[0]}
                  </div>
                </div>
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-lg font-bold">{trader.username}</span>
                    <span className="text-xl">{getCountryFlag(trader.country)}</span>
                  </div>
                  {badgeConfig && (
                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${badgeConfig.bg} ${badgeConfig.color} border ${badgeConfig.border}`}>
                      <Star className="w-3 h-3 inline mr-1" />
                      {badgeConfig.label}
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Profit:</span>
                    <span className="text-emerald-400 font-bold">${trader.totalProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="text-blue-400 font-semibold">{trader.winRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Best Trade:</span>
                    <span className="text-yellow-400 font-semibold">${trader.bestTrade.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Traders', value: '12,847', icon: Users, color: 'blue' },
            { label: 'Avg Win Rate', value: '76.4%', icon: Target, color: 'emerald' },
            { label: 'Total Trades', value: '2.4M', icon: BarChart3, color: 'purple' },
            { label: 'Best Streak', value: '38 wins', icon: Zap, color: 'yellow' },
          ].map((stat) => (
            <div key={stat.label} className={`bg-${stat.color}-500/10 border border-${stat.color}-500/30 rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{stat.label}</span>
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
              <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Full Leaderboard */}
        <div className="bg-[#1a1f2e] rounded-xl overflow-hidden border border-gray-800/50">
          <div className="p-4 border-b border-gray-800/50">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Complete Rankings
            </h3>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0f1419] text-xs text-gray-400">
                <tr>
                  <th className="text-left p-4">Rank</th>
                  <th className="text-left p-4">Trader</th>
                  <th className="text-right p-4">Total Profit</th>
                  <th className="text-right p-4">Trades</th>
                  <th className="text-right p-4">Win Rate</th>
                  <th className="text-right p-4">Avg Profit</th>
                  <th className="text-right p-4">Best Trade</th>
                  <th className="text-right p-4">Streak</th>
                </tr>
              </thead>
              <tbody>
                {traders.map((trader) => {
                  const badgeConfig = getBadgeConfig(trader.badge)
                  return (
                    <tr
                      key={trader.userId}
                      className={`border-b border-gray-800/30 hover:bg-[#232936] transition-colors ${
                        trader.rank <= 3 ? getRankBg(trader.rank) : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(trader.rank)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center font-bold">
                            {trader.username[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{trader.username}</span>
                              <span>{getCountryFlag(trader.country)}</span>
                            </div>
                            {badgeConfig && (
                              <span className={`text-xs ${badgeConfig.color}`}>{badgeConfig.label}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-emerald-400 font-bold">${trader.totalProfit.toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-gray-400">{trader.totalTrades}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-blue-400 font-semibold">{trader.winRate}%</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-purple-400">${trader.avgProfit}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-yellow-400 font-semibold">${trader.bestTrade.toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-orange-400">{trader.consecutiveWins}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3 p-4">
            {traders.map((trader) => {
              const badgeConfig = getBadgeConfig(trader.badge)
              return (
                <div
                  key={trader.userId}
                  className={`rounded-xl p-4 border ${getRankBg(trader.rank)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getRankIcon(trader.rank)}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center font-bold">
                        {trader.username[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{trader.username}</span>
                          <span>{getCountryFlag(trader.country)}</span>
                        </div>
                        {badgeConfig && (
                          <span className={`text-xs ${badgeConfig.color}`}>{badgeConfig.label}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Profit</div>
                      <div className="text-emerald-400 font-bold">${trader.totalProfit.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Win Rate</div>
                      <div className="text-blue-400 font-semibold">{trader.winRate}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Best Trade</div>
                      <div className="text-yellow-400 font-semibold">${trader.bestTrade.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Streak</div>
                      <div className="text-orange-400">{trader.consecutiveWins} wins</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}