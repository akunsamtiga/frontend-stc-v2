// app/(main)/tournament/page.tsx - Trading Tournament
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Trophy,
  ChevronLeft,
  Medal,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Crown,
  Award,
  Target,
  Zap
} from 'lucide-react'

interface Tournament {
  id: string
  name: string
  prize: string
  participants: number
  startDate: string
  endDate: string
  status: 'active' | 'upcoming' | 'ended'
  minDeposit: number
}

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatar?: string
  profit: number
  trades: number
  winRate: number
  roi: number
}

const TOURNAMENTS: Tournament[] = [
  {
    id: '1',
    name: 'Monthly Trading Championship',
    prize: '$50,000',
    participants: 1247,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: 'active',
    minDeposit: 100,
  },
  {
    id: '2',
    name: 'VIP Elite Tournament',
    prize: '$100,000',
    participants: 358,
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    status: 'upcoming',
    minDeposit: 1000,
  },
  {
    id: '3',
    name: 'New Year Grand Prix',
    prize: '$200,000',
    participants: 5432,
    startDate: '2023-12-15',
    endDate: '2024-01-15',
    status: 'ended',
    minDeposit: 50,
  },
]

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: '1', username: 'TradeMaster', profit: 125430, trades: 342, winRate: 87.5, roi: 252.3 },
  { rank: 2, userId: '2', username: 'ProTrader99', profit: 98750, trades: 289, winRate: 84.2, roi: 197.5 },
  { rank: 3, userId: '3', username: 'BullRunner', profit: 87200, trades: 256, winRate: 81.8, roi: 174.4 },
  { rank: 4, userId: '4', username: 'WolfOfWallSt', profit: 76890, trades: 298, winRate: 79.3, roi: 153.8 },
  { rank: 5, userId: '5', username: 'MarketKing', profit: 68450, trades: 234, winRate: 77.6, roi: 136.9 },
  { rank: 6, userId: '6', username: 'GoldenTrader', profit: 62100, trades: 287, winRate: 76.2, roi: 124.2 },
  { rank: 7, userId: '7', username: 'DiamondHands', profit: 57890, trades: 245, winRate: 75.1, roi: 115.8 },
  { rank: 8, userId: '8', username: 'ChartWizard', profit: 54320, trades: 312, winRate: 73.8, roi: 108.6 },
  { rank: 9, userId: '9', username: 'OptionsPro', profit: 51200, trades: 267, winRate: 72.5, roi: 102.4 },
  { rank: 10, userId: '10', username: 'SwingMaster', profit: 48900, trades: 223, winRate: 71.3, roi: 97.8 },
]

export default function TournamentPage() {
  const router = useRouter()
  const [selectedTournament, setSelectedTournament] = useState(TOURNAMENTS[0])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />
      case 2: return <Medal className="w-5 h-5 text-gray-400" />
      case 3: return <Medal className="w-5 h-5 text-orange-400" />
      default: return <span className="text-sm font-bold text-gray-500">#{rank}</span>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
      case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'ended': return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* Header */}
      <div className="bg-[#1a1f2e] border-b border-gray-800/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#232936] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h1 className="text-2xl font-bold">Trading Tournament</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tournament Selection */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {TOURNAMENTS.map((tournament) => (
            <button
              key={tournament.id}
              onClick={() => setSelectedTournament(tournament)}
              className={`text-left bg-[#1a1f2e] rounded-xl p-4 transition-all border-2 ${
                selectedTournament.id === tournament.id
                  ? 'border-yellow-500/50 ring-2 ring-yellow-500/20'
                  : 'border-gray-800/50 hover:border-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusColor(tournament.status)}`}>
                  {tournament.status.toUpperCase()}
                </span>
              </div>
              <h3 className="font-bold mb-2">{tournament.name}</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  <span className="text-yellow-400 font-semibold">{tournament.prize} Prize</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  <span>{tournament.participants.toLocaleString()} participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{tournament.startDate} - {tournament.endDate}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Tournament Info Banner */}
        <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                {selectedTournament.name}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-lg">{selectedTournament.prize}</span>
                  <span className="text-gray-400">Total Prize</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-bold">{selectedTournament.participants.toLocaleString()}</span>
                  <span className="text-gray-400">Participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">${selectedTournament.minDeposit}</span>
                  <span className="text-gray-400">Min Deposit</span>
                </div>
              </div>
            </div>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-lg transition-colors flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Join Tournament
            </button>
          </div>
        </div>

        {/* Prize Distribution */}
        <div className="bg-[#1a1f2e] rounded-xl p-6 mb-6 border border-gray-800/50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            Prize Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { rank: '1st', prize: '40%', color: 'yellow' },
              { rank: '2nd', prize: '25%', color: 'gray' },
              { rank: '3rd', prize: '15%', color: 'orange' },
              { rank: '4-5', prize: '10%', color: 'blue' },
              { rank: '6-10', prize: '10%', color: 'purple' },
            ].map((item) => (
              <div key={item.rank} className={`bg-${item.color}-500/10 border border-${item.color}-500/30 rounded-lg p-3 text-center`}>
                <div className={`text-xs text-${item.color}-400 mb-1`}>{item.rank} Place</div>
                <div className={`text-lg font-bold text-${item.color}-400`}>{item.prize}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-[#1a1f2e] rounded-xl overflow-hidden border border-gray-800/50">
          <div className="p-4 border-b border-gray-800/50">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Live Leaderboard
            </h3>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0f1419] text-xs text-gray-400">
                <tr>
                  <th className="text-left p-4">Rank</th>
                  <th className="text-left p-4">Trader</th>
                  <th className="text-right p-4">Profit</th>
                  <th className="text-right p-4">Trades</th>
                  <th className="text-right p-4">Win Rate</th>
                  <th className="text-right p-4">ROI</th>
                </tr>
              </thead>
              <tbody>
                {LEADERBOARD.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={`border-b border-gray-800/30 hover:bg-[#232936] transition-colors ${
                      entry.rank <= 3 ? getRankBg(entry.rank) : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="font-bold">{entry.username[0]}</span>
                        </div>
                        <span className="font-semibold">{entry.username}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-emerald-400 font-bold">${entry.profit.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-gray-400">{entry.trades}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-blue-400 font-semibold">{entry.winRate}%</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-purple-400 font-semibold">+{entry.roi}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2 p-4">
            {LEADERBOARD.map((entry) => (
              <div
                key={entry.userId}
                className={`rounded-lg p-4 border ${getRankBg(entry.rank)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getRankIcon(entry.rank)}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="font-bold">{entry.username[0]}</span>
                    </div>
                    <span className="font-semibold">{entry.username}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Profit</div>
                    <div className="text-emerald-400 font-bold">${entry.profit.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Trades</div>
                    <div className="text-gray-400">{entry.trades}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Win Rate</div>
                    <div className="text-blue-400 font-semibold">{entry.winRate}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">ROI</div>
                    <div className="text-purple-400 font-semibold">+{entry.roi}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}