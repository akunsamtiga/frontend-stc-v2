'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Award,
  ChevronLeft,
  Trophy,
  Medal,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Star,
  Crown,
  Sparkles,
  Filter
} from 'lucide-react'

type Period = 'daily' | 'weekly' | 'monthly' | 'all-time'

interface RunnerUp {
  id: string
  rank: number
  name: string
  avatar: string
  profit: number
  profitPercentage: number
  trades: number
  winRate: number
  period: Period
  prize: number
  badge?: string
}

const getNextMonth = () => {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth
}

const getMonthName = (date: Date) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[date.getMonth()]
}

export default function RunnerUpPage() {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('monthly')

  const eventDates = useMemo(() => {
    const nextMonth = getNextMonth()
    const monthName = getMonthName(nextMonth)
    const year = nextMonth.getFullYear()
    
    return {
      monthName,
      year
    }
  }, [])

  const DUMMY_RUNNERS: RunnerUp[] = [
    {
      id: '1',
      rank: 1,
      name: 'Ahmad Trader',
      avatar: '🥇',
      profit: 125000,
      profitPercentage: 125,
      trades: 450,
      winRate: 89,
      period: 'monthly',
      prize: 5000,
      badge: 'CHAMPION'
    },
    {
      id: '2',
      rank: 2,
      name: 'Budi Pro',
      avatar: '🥈',
      profit: 98000,
      profitPercentage: 98,
      trades: 380,
      winRate: 85,
      period: 'monthly',
      prize: 3000
    },
    {
      id: '3',
      rank: 3,
      name: 'Citra Elite',
      avatar: '🥉',
      profit: 87000,
      profitPercentage: 87,
      trades: 320,
      winRate: 82,
      period: 'monthly',
      prize: 2000
    },
    {
      id: '4',
      rank: 4,
      name: 'Denny Expert',
      avatar: '👤',
      profit: 75000,
      profitPercentage: 75,
      trades: 290,
      winRate: 80,
      period: 'monthly',
      prize: 1000
    },
    {
      id: '5',
      rank: 5,
      name: 'Eka Master',
      avatar: '👤',
      profit: 68000,
      profitPercentage: 68,
      trades: 275,
      winRate: 78,
      period: 'monthly',
      prize: 800
    },
    {
      id: '6',
      rank: 6,
      name: 'Fandi Profit',
      avatar: '👤',
      profit: 62000,
      profitPercentage: 62,
      trades: 260,
      winRate: 76,
      period: 'monthly',
      prize: 600
    },
    {
      id: '7',
      rank: 7,
      name: 'Gita Success',
      avatar: '👤',
      profit: 58000,
      profitPercentage: 58,
      trades: 245,
      winRate: 74,
      period: 'monthly',
      prize: 400
    },
    {
      id: '8',
      rank: 8,
      name: 'Hadi Winner',
      avatar: '👤',
      profit: 54000,
      profitPercentage: 54,
      trades: 230,
      winRate: 72,
      period: 'monthly',
      prize: 300
    },
    {
      id: '9',
      rank: 9,
      name: 'Indah Smart',
      avatar: '👤',
      profit: 51000,
      profitPercentage: 51,
      trades: 220,
      winRate: 70,
      period: 'monthly',
      prize: 200
    },
    {
      id: '10',
      rank: 10,
      name: 'Joko Trader',
      avatar: '👤',
      profit: 48000,
      profitPercentage: 48,
      trades: 210,
      winRate: 68,
      period: 'monthly',
      prize: 100
    }
  ]

  const filteredRunners = DUMMY_RUNNERS.filter(runner => runner.period === selectedPeriod)

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-50 to-yellow-100 border-yellow-300'
      case 2: return 'from-gray-50 to-gray-100 border-gray-300'
      case 3: return 'from-orange-50 to-orange-100 border-orange-300'
      default: return 'from-white to-gray-50 border-gray-200'
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-600" />
      case 2: return <Medal className="w-5 h-5 text-gray-600" />
      case 3: return <Medal className="w-5 h-5 text-orange-600" />
      default: return <Trophy className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Top Traders</h1>
                <p className="text-xs text-gray-500">Leaderboard {eventDates.monthName} {eventDates.year}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { value: 'daily' as const, label: 'Daily', icon: Calendar },
              { value: 'weekly' as const, label: 'Weekly', icon: Calendar },
              { value: 'monthly' as const, label: 'Monthly', icon: Calendar },
              { value: 'all-time' as const, label: 'All Time', icon: Trophy },
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedPeriod === period.value
                    ? 'bg-yellow-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <period.icon className="w-4 h-4" />
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border border-yellow-200 rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Top 10 Traders Bulan Depan
            </h2>
          </div>
          <p className="text-center text-gray-600 mb-4">
            Leaderboard akan dimulai pada <span className="font-bold text-gray-900">{eventDates.monthName} {eventDates.year}</span>
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur rounded-lg p-4 text-center border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">$5,000</div>
              <div className="text-xs text-gray-600">1st Prize</div>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-lg p-4 text-center border border-gray-300">
              <div className="text-2xl font-bold text-gray-600">$3,000</div>
              <div className="text-xs text-gray-600">2nd Prize</div>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-lg p-4 text-center border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">$2,000</div>
              <div className="text-xs text-gray-600">3rd Prize</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {filteredRunners.slice(0, 3).map((runner, index) => (
            <div
              key={runner.id}
              className={`bg-gradient-to-br ${getRankColor(runner.rank)} rounded-xl p-6 border-2 hover:shadow-xl transition-all relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{runner.avatar}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getRankBadge(runner.rank)}
                        <span className="text-lg font-bold text-gray-900">#{runner.rank}</span>
                      </div>
                      <h3 className="font-bold text-gray-900">{runner.name}</h3>
                    </div>
                  </div>
                  {runner.badge && (
                    <div className="px-2 py-1 bg-red-500 text-white rounded-md text-xs font-bold">
                      {runner.badge}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Profit</span>
                    <span className="font-bold text-emerald-600">${runner.profit.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ROI</span>
                    <span className="font-bold text-blue-600">+{runner.profitPercentage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Win Rate</span>
                    <span className="font-bold text-purple-600">{runner.winRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Trades</span>
                    <span className="font-bold text-gray-900">{runner.trades}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-300/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prize</span>
                    <span className="text-lg font-bold text-yellow-600">${runner.prize.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gray-600" />
                Full Leaderboard
              </h3>
              <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trader</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Profit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">ROI</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Win Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Trades</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Prize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRunners.map((runner) => (
                  <tr key={runner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getRankBadge(runner.rank)}
                        <span className="font-bold text-gray-900">#{runner.rank}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{runner.avatar}</div>
                        <div>
                          <div className="font-semibold text-gray-900">{runner.name}</div>
                          {runner.badge && (
                            <div className="text-xs text-red-600 font-medium">{runner.badge}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-emerald-600">${runner.profit.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-blue-600">+{runner.profitPercentage}%</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-purple-600">{runner.winRate}%</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-medium text-gray-900">{runner.trades}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-yellow-600">${runner.prize.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{filteredRunners.length.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Active Traders</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <DollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">$15,000</div>
            <div className="text-sm text-gray-600">Total Prize Pool</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">125%</div>
            <div className="text-sm text-gray-600">Highest ROI</div>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6 text-center">
          <Sparkles className="w-12 h-12 text-cyan-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ingin Masuk Leaderboard?</h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Mulai trading sekarang dan raih kesempatan untuk menjadi Top Trader dan menangkan hadiah fantastis setiap bulannya!
          </p>
          <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2 shadow-sm">
            <TrendingUp className="w-5 h-5" />
            Start Trading
          </button>
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