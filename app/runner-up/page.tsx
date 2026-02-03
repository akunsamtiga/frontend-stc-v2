'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft,
  TrendingUp,
} from 'lucide-react'

type Period = 'daily' | 'weekly' | 'monthly' | 'all-time'

interface RunnerUp {
  id: string
  rank: number
  name: string
  displayName: string
  email: string
  displayEmail: string
  avatar: string
  profit: number
  profitPercentage: number
  trades: number
  winRate: number
  period: Period
  prize: number
  badge?: string
  streak?: number
  lastActive?: string
  country: string
}

const firstNames = [
  'John', 'Michael', 'David', 'James', 'Robert', 'William', 'Richard', 'Thomas', 'Charles', 'Daniel',
  'Matthew', 'Anthony', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian',
  'Wei', 'Ming', 'Li', 'Chen', 'Zhang', 'Hiroshi', 'Takeshi', 'Kenji', 'Yuki', 'Haruki',
  'Ahmed', 'Mohammed', 'Ali', 'Omar', 'Hassan', 'Ibrahim', 'Khalid', 'Yousef', 'Karim', 'Amir',
  'Ahmad', 'Budi', 'Citra', 'Denny', 'Eka', 'Fandi', 'Gita', 'Hadi', 'Indah', 'Joko',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Sang', 'Jin', 'Min', 'Soo', 'Hyun', 'Jun', 'Fatima', 'Aisha', 'Zainab', 'Maryam',
  'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas',
  'Eric', 'Stephen', 'Jonathan', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Frank',
  'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle'
]

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Tanaka', 'Suzuki', 'Takahashi', 'Watanabe', 'Ito',
  'Kim', 'Park', 'Choi', 'Jung', 'Kang', 'Setiawan', 'Prasetyo', 'Wijaya', 'Santoso', 'Kusuma',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen',
  'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson',
  'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Mueller', 'Schmidt', 'Fischer',
  'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Yang', 'Huang', 'Zhao',
  'Wu', 'Zhou', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Cho', 'Yoon', 'Jang',
  'Lim', 'Han', 'Rahman', 'Putra', 'Hidayat', 'Nugroho', 'Hartono', 'Lopez', 'Gonzalez', 'Hernandez'
]

const emailDomains = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com',
  'icloud.com', 'aol.com', 'mail.com', 'zoho.com', 'live.com'
]

const countries = [
  '🇺🇸 USA', '🇬🇧 UK', '🇨🇦 Canada', '🇦🇺 Australia', '🇩🇪 Germany',
  '🇫🇷 France', '🇯🇵 Japan', '🇰🇷 Korea', '🇨🇳 China', '🇸🇬 Singapore',
  '🇮🇩 Indonesia', '🇮🇳 India', '🇧🇷 Brazil', '🇲🇽 Mexico', '🇪🇸 Spain',
  '🇮🇹 Italy', '🇳🇱 Netherlands', '🇸🇪 Sweden', '🇨🇭 Switzerland', '🇦🇪 UAE'
]

// Simple hash function for seeding
const hashString = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const censorString = (str: string): string => {
  if (str.length <= 2) return str
  const len = str.length
  const censorCount = Math.ceil(len * 0.3)
  let result = str.split('')
  
  for (let i = 0; i < censorCount; i++) {
    const pos = 1 + ((i * 3) % (len - 1))
    if (result[pos] !== ' ') {
      result[pos] = '*'
    }
  }
  
  return result.join('')
}

const censorEmail = (email: string): string => {
  const [local, domain] = email.split('@')
  if (local.length <= 2) return email
  return `${local.substring(0, 2)}****@${domain}`
}

const generateTrader = (index: number, period: Period, seed: number): RunnerUp => {
  const periodMultiplier = {
    'daily': 1,
    'weekly': 7,
    'monthly': 30,
    'all-time': 365
  }[period]
  
  // Generate deterministic but varied data
  const firstName = firstNames[index % firstNames.length]
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length]
  const fullName = `${firstName} ${lastName}`
  
  const displayName = `${censorString(firstName)} ${censorString(lastName)}`
  
  const emailDomain = emailDomains[index % emailDomains.length]
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}`
  const displayEmail = censorEmail(email)
  
  const country = countries[index % countries.length]
  
  // Generate profit with variation based on seed
  const baseProfit = 15000 + (index * 1500)
  const variation = seededRandom(seed + index)
  const profit = Math.floor(baseProfit * (1 + variation * 0.5) * periodMultiplier)
  
  const profitPercentage = Math.floor(15 + (index * 1.2) + variation * 50)
  const trades = Math.floor((100 + index * 8) * periodMultiplier)
  const winRate = Math.round((60 + index * 0.35 - variation * 10) * 10) / 10
  const streak = Math.floor(1 + (index * 0.2) + variation * 15)
  
  const lastActiveMinutes = Math.floor(variation * 480)
  let lastActive = 'Just now'
  if (lastActiveMinutes >= 60) {
    lastActive = `${Math.floor(lastActiveMinutes / 60)}h ago`
  } else if (lastActiveMinutes > 0) {
    lastActive = `${lastActiveMinutes}m ago`
  }
  
  return {
    id: `trader-${period}-${index}`,
    rank: index + 1,
    name: fullName,
    displayName,
    email,
    displayEmail,
    avatar: `${firstName[0]}${lastName[0]}`.toUpperCase(),
    profit,
    profitPercentage,
    trades,
    winRate: Math.min(95, Math.max(55, winRate)),
    period,
    prize: 0,
    streak: Math.max(1, Math.min(20, streak)),
    lastActive,
    country
  }
}

const getNextMonth = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
}

const getMonthName = (date: Date) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[date.getMonth()]
}

export default function RunnerUpPage() {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('monthly')
  const [updateSeed, setUpdateSeed] = useState(0)

  const eventDates = useMemo(() => {
    const nextMonth = getNextMonth()
    return {
      monthName: getMonthName(nextMonth),
      year: nextMonth.getFullYear()
    }
  }, [])

  // Auto update every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateSeed(prev => prev + 1)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const allTraders = useMemo(() => {
    const traders: RunnerUp[] = []
    
    for (let i = 0; i < 100; i++) {
      traders.push(generateTrader(i, selectedPeriod, updateSeed))
    }
    
    // Sort by profit
    traders.sort((a, b) => b.profit - a.profit)
    
    // Assign ranks and prizes
    const prizes = [5000, 3000, 2000, 1000, 800, 600, 400, 300, 200, 100, ...Array(90).fill(0)]
    
    traders.forEach((trader, index) => {
      trader.rank = index + 1
      trader.prize = prizes[index] || 0
      
      if (trader.rank === 1) trader.badge = 'CHAMPION'
      else if (trader.rank === 2) trader.badge = 'RUNNER UP'
      else if (trader.rank === 3) trader.badge = '3RD PLACE'
    })
    
    return traders
  }, [selectedPeriod, updateSeed])

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-rose-600', 'bg-indigo-600',
      'bg-orange-600', 'bg-cyan-600', 'bg-pink-600', 'bg-teal-600', 'bg-amber-600',
      'bg-violet-600', 'bg-fuchsia-600', 'bg-lime-600', 'bg-sky-600', 'bg-red-600'
    ]
    return colors[index % colors.length]
  }

  const topTraders = allTraders.slice(0, 3)
  const totalProfit = allTraders.reduce((sum, t) => sum + t.profit, 0)
  const averageWinRate = allTraders.reduce((sum, t) => sum + t.winRate, 0) / allTraders.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Global Leaderboard</h1>
              <p className="text-sm text-gray-500">Trading Competition {eventDates.monthName} {eventDates.year}</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { value: 'daily' as const, label: 'Daily' },
              { value: 'weekly' as const, label: 'Weekly' },
              { value: 'monthly' as const, label: 'Monthly' },
              { value: 'all-time' as const, label: 'All Time' },
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedPeriod === period.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Prize Info Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 mb-6 text-white shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Total Prize Pool $15,000
            </h2>
            <p className="text-blue-100">
              Competition starts {eventDates.monthName} {eventDates.year}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/20">
              <div className="text-3xl font-bold mb-1">$5,000</div>
              <div className="text-sm text-blue-100">1st Place</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/20">
              <div className="text-3xl font-bold mb-1">$3,000</div>
              <div className="text-sm text-blue-100">2nd Place</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/20">
              <div className="text-3xl font-bold mb-1">$2,000</div>
              <div className="text-sm text-blue-100">3rd Place</div>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {topTraders.map((runner, index) => (
            <div
              key={runner.id}
              className={`bg-white rounded-xl p-6 border-2 hover:shadow-lg transition-all relative overflow-hidden ${
                runner.rank === 1 ? 'border-yellow-400' : 
                runner.rank === 2 ? 'border-gray-300' : 
                'border-orange-300'
              }`}
            >
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                      {runner.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-2xl font-bold text-gray-400 mb-1">#{runner.rank}</div>
                      <h3 className="font-bold text-gray-900 text-base truncate">{runner.displayName}</h3>
                      <p className="text-xs text-gray-500 truncate">{runner.displayEmail}</p>
                      <p className="text-xs text-gray-400 mt-1">{runner.country} • {runner.lastActive}</p>
                    </div>
                  </div>
                  {runner.badge && (
                    <div className="px-2 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-md text-xs font-bold shrink-0">
                      {runner.badge}
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Total Profit</div>
                    <div className="text-2xl font-bold text-emerald-600">${runner.profit.toLocaleString()}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">ROI</div>
                      <div className="text-sm font-bold text-blue-600">+{runner.profitPercentage}%</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Win Rate</div>
                      <div className="text-sm font-bold text-purple-600">{runner.winRate}%</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Trades</div>
                      <div className="text-sm font-bold text-gray-900">{runner.trades}</div>
                    </div>
                  </div>

                  {runner.streak && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                      <div className="text-xs text-orange-600 font-medium">
                        🔥 {runner.streak} Day Streak
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prize</span>
                    <span className="text-xl font-bold text-yellow-600">${runner.prize.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full Leaderboard Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  Complete Rankings
                </h3>
                <p className="text-sm text-gray-500 mt-1">{allTraders.length} active traders worldwide</p>
              </div>
              <div className="text-xs text-gray-400">
                Live data • Auto-updates
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trader</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Profit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">ROI</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Win Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Trades</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Prize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allTraders.map((runner, index) => (
                  <tr key={runner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <span className={`font-bold ${runner.rank <= 3 ? 'text-xl' : 'text-lg'} ${
                        runner.rank === 1 ? 'text-yellow-600' :
                        runner.rank === 2 ? 'text-gray-500' :
                        runner.rank === 3 ? 'text-orange-600' :
                        'text-gray-900'
                      }`}>
                        #{runner.rank}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                          {runner.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{runner.displayName}</div>
                          <div className="text-xs text-gray-500 truncate">{runner.displayEmail}</div>
                          <div className="text-xs text-gray-400">{runner.country} • {runner.lastActive}</div>
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
                      {runner.prize > 0 ? (
                        <span className="font-bold text-yellow-600">${runner.prize.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mt-6 grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-500 mb-2">Active Traders</div>
            <div className="text-3xl font-bold text-gray-900">{allTraders.length}</div>
            <div className="text-xs text-green-600 mt-2">↑ Global participants</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-500 mb-2">Prize Pool</div>
            <div className="text-3xl font-bold text-gray-900">$15,000</div>
            <div className="text-xs text-blue-600 mt-2">Top 10 winners</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-500 mb-2">Total Profit</div>
            <div className="text-3xl font-bold text-gray-900">${(totalProfit / 1000000).toFixed(1)}M</div>
            <div className="text-xs text-emerald-600 mt-2">Combined earnings</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-500 mb-2">Avg Win Rate</div>
            <div className="text-3xl font-bold text-gray-900">{averageWinRate.toFixed(1)}%</div>
            <div className="text-xs text-purple-600 mt-2">All traders average</div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-center text-white shadow-lg">
          <h3 className="text-2xl font-bold mb-3">Want to Join the Leaderboard?</h3>
          <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
            Start trading now and compete with traders worldwide. 
            Win up to $5,000 in prizes every month!
          </p>
          <button className="bg-white hover:bg-gray-100 text-indigo-600 px-8 py-3 rounded-lg font-semibold transition-all inline-flex items-center gap-2 shadow-md">
            <TrendingUp className="w-5 h-5" />
            Start Trading Now
          </button>
        </div>

        {/* Competition Rules */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Terms & Conditions</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Competition runs monthly from the 1st to the last day of each month</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Minimum 50 trades required to be eligible for prizes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Winners determined by highest total profit</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Prizes transferred within 7 business days after competition ends</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Leaderboard updates automatically every 30 seconds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Privacy: Trader names and emails are partially censored for security</span>
            </li>
          </ul>
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