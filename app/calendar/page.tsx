// app/calendar/page.tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  TrendingUp,
  AlertCircle,
  Filter,
  Search,
  X
} from 'lucide-react'

type EventImpact = 'high' | 'medium' | 'low'

interface EconomicEvent {
  id: string
  time: string
  currency: string
  event: string
  impact: EventImpact
  forecast?: string
  previous?: string
  actual?: string
}

const DUMMY_EVENTS: EconomicEvent[] = [
  { id: '1', time: '08:30', currency: 'USD', event: 'Non-Farm Payrolls', impact: 'high', forecast: '185K', previous: '187K' },
  { id: '2', time: '09:00', currency: 'EUR', event: 'ECB Interest Rate Decision', impact: 'high', forecast: '4.50%', previous: '4.50%' },
  { id: '3', time: '10:30', currency: 'GBP', event: 'GDP Growth Rate QoQ', impact: 'high', forecast: '0.2%', previous: '0.1%' },
  { id: '4', time: '12:00', currency: 'USD', event: 'Consumer Price Index (CPI)', impact: 'high', forecast: '3.1%', previous: '3.2%' },
  { id: '5', time: '14:00', currency: 'JPY', event: 'BoJ Monetary Policy Statement', impact: 'high' },
  { id: '6', time: '15:30', currency: 'USD', event: 'Crude Oil Inventories', impact: 'medium', forecast: '-2.1M', previous: '-1.5M' },
  { id: '7', time: '16:00', currency: 'CAD', event: 'Employment Change', impact: 'medium', forecast: '25K', previous: '27K' },
  { id: '8', time: '08:00', currency: 'AUD', event: 'Retail Sales MoM', impact: 'medium', forecast: '0.3%', previous: '0.2%' },
  { id: '9', time: '11:30', currency: 'CHF', event: 'SNB Interest Rate Decision', impact: 'high', forecast: '1.75%', previous: '1.75%' },
  { id: '10', time: '13:00', currency: 'EUR', event: 'Industrial Production', impact: 'low', forecast: '0.4%', previous: '0.6%' },
]

export default function CalendarPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedImpact, setSelectedImpact] = useState<EventImpact | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filteredEvents = useMemo(() => {
    return DUMMY_EVENTS.filter(event => {
      const matchesImpact = selectedImpact === 'all' || event.impact === selectedImpact
      const matchesSearch = event.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.currency.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesImpact && matchesSearch
    })
  }, [selectedImpact, searchQuery])

  const getImpactColor = (impact: EventImpact) => {
    switch (impact) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-orange-500'
      case 'low': return 'bg-yellow-500'
    }
  }

  const getImpactTextColor = (impact: EventImpact) => {
    switch (impact) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-orange-400'
      case 'low': return 'text-yellow-400'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date)
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* Header */}
      <div className="bg-[#1a1f2e] border-b border-gray-800/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#232936] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-blue-400" />
                <h1 className="text-2xl font-bold">Kalender Ekonomi</h1>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-[#2f3648] hover:bg-[#3a4360] transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => changeDate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#2f3648] hover:bg-[#3a4360] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 text-center">
              <div className="text-sm text-gray-400">Selected Date</div>
              <div className="text-lg font-bold">{formatDate(selectedDate)}</div>
            </div>

            <button
              onClick={() => changeDate(1)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#2f3648] hover:bg-[#3a4360] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[300px,1fr] gap-6">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-[#1a1f2e] rounded-xl p-4 space-y-4 sticky top-24">
              {/* Search */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Cari Event</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari event..."
                    className="w-full bg-[#0f1419] border border-gray-800/50 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-500/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Impact Filter */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Impact Level</label>
                <div className="space-y-2">
                  {[
                    { value: 'all' as const, label: 'All Events', color: 'blue' },
                    { value: 'high' as const, label: 'High Impact', color: 'red' },
                    { value: 'medium' as const, label: 'Medium Impact', color: 'orange' },
                    { value: 'low' as const, label: 'Low Impact', color: 'yellow' },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setSelectedImpact(filter.value)}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        selectedImpact === filter.value
                          ? `bg-${filter.color}-500/20 text-${filter.color}-400 border border-${filter.color}-500/50`
                          : 'bg-[#0f1419] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-300">
                    <p className="font-semibold text-blue-400 mb-1">Info Penting</p>
                    <p>Event dengan high impact dapat menyebabkan volatilitas tinggi. Trading dengan hati-hati saat event berlangsung.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="bg-[#1a1f2e] rounded-xl p-8 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Tidak ada event yang ditemukan</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#1a1f2e] rounded-xl p-4 hover:bg-[#232936] transition-colors border border-gray-800/50"
                >
                  <div className="flex items-start gap-4">
                    {/* Time */}
                    <div className="flex-shrink-0 text-center">
                      <div className="text-xs text-gray-500 mb-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        WIB
                      </div>
                      <div className="text-lg font-bold">{event.time}</div>
                    </div>

                    {/* Currency Flag */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-lg font-bold">{event.currency}</span>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1">{event.event}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${getImpactTextColor(event.impact)}`}>
                              <div className={`w-2 h-2 rounded-full ${getImpactColor(event.impact)}`}></div>
                              {event.impact.toUpperCase()} IMPACT
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Data */}
                      {(event.forecast || event.previous || event.actual) && (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          {event.forecast && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Forecast</div>
                              <div className="text-sm font-semibold text-blue-400">{event.forecast}</div>
                            </div>
                          )}
                          {event.previous && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Previous</div>
                              <div className="text-sm font-semibold text-gray-400">{event.previous}</div>
                            </div>
                          )}
                          {event.actual && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Actual</div>
                              <div className="text-sm font-semibold text-emerald-400">{event.actual}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}