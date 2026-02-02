'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  TrendingUp,
  AlertCircle,
  Clock,
  Globe,
  Star,
  ChevronDown
} from 'lucide-react'

type EventImpact = 'high' | 'medium' | 'low'
type EventCategory = 'interest-rate' | 'gdp' | 'employment' | 'inflation' | 'manufacturing' | 'consumer' | 'central-bank' | 'other'

interface EconomicEvent {
  id: string
  date: string
  time: string
  currency: string
  country: string
  event: string
  impact: EventImpact
  category: EventCategory
  actual?: string
  forecast?: string
  previous?: string
}

const generateMockEvents = (): EconomicEvent[] => {
  const events: EconomicEvent[] = []
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY']
  const countries = ['United States', 'Eurozone', 'United Kingdom', 'Japan', 'Australia', 'Canada', 'Switzerland', 'China']
  
  const eventTemplates = [
    { event: 'Interest Rate Decision', impact: 'high' as EventImpact, category: 'interest-rate' as EventCategory },
    { event: 'Non-Farm Payrolls', impact: 'high' as EventImpact, category: 'employment' as EventCategory },
    { event: 'GDP Growth Rate', impact: 'high' as EventImpact, category: 'gdp' as EventCategory },
    { event: 'CPI (Consumer Price Index)', impact: 'high' as EventImpact, category: 'inflation' as EventCategory },
    { event: 'Unemployment Rate', impact: 'high' as EventImpact, category: 'employment' as EventCategory },
    { event: 'FOMC Meeting Minutes', impact: 'high' as EventImpact, category: 'central-bank' as EventCategory },
    { event: 'Retail Sales', impact: 'high' as EventImpact, category: 'consumer' as EventCategory },
    { event: 'Core CPI', impact: 'high' as EventImpact, category: 'inflation' as EventCategory },
    { event: 'Manufacturing PMI', impact: 'medium' as EventImpact, category: 'manufacturing' as EventCategory },
    { event: 'Services PMI', impact: 'medium' as EventImpact, category: 'manufacturing' as EventCategory },
    { event: 'Trade Balance', impact: 'medium' as EventImpact, category: 'other' as EventCategory },
    { event: 'Industrial Production', impact: 'medium' as EventImpact, category: 'manufacturing' as EventCategory },
    { event: 'Consumer Confidence', impact: 'medium' as EventImpact, category: 'consumer' as EventCategory },
    { event: 'Producer Price Index', impact: 'medium' as EventImpact, category: 'inflation' as EventCategory },
    { event: 'Housing Starts', impact: 'medium' as EventImpact, category: 'other' as EventCategory },
    { event: 'Building Permits', impact: 'low' as EventImpact, category: 'other' as EventCategory },
    { event: 'Factory Orders', impact: 'low' as EventImpact, category: 'manufacturing' as EventCategory },
    { event: 'Wholesale Inventories', impact: 'low' as EventImpact, category: 'other' as EventCategory },
    { event: 'Import Prices', impact: 'low' as EventImpact, category: 'other' as EventCategory },
  ]

  const times = ['02:00', '07:30', '08:30', '09:00', '10:00', '12:30', '13:00', '14:00', '15:00', '20:30']

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(2026, month, 0).getDate()
    const eventsThisMonth = 30 + Math.floor(Math.random() * 20)
    
    for (let i = 0; i < eventsThisMonth; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1
      const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)]
      const currencyIndex = Math.floor(Math.random() * currencies.length)
      
      const dateStr = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const time = times[Math.floor(Math.random() * times.length)]

      let actual, forecast, previous
      if (template.category === 'interest-rate') {
        const rate = (Math.random() * 5).toFixed(2)
        forecast = `${rate}%`
        previous = `${(parseFloat(rate) - 0.25).toFixed(2)}%`
      } else if (template.category === 'gdp') {
        const gdp = (Math.random() * 4 + 1).toFixed(1)
        forecast = `${gdp}%`
        previous = `${(parseFloat(gdp) - 0.2).toFixed(1)}%`
      } else if (template.category === 'employment') {
        if (template.event.includes('Unemployment')) {
          const rate = (Math.random() * 5 + 3).toFixed(1)
          forecast = `${rate}%`
          previous = `${(parseFloat(rate) + 0.1).toFixed(1)}%`
        } else {
          const jobs = Math.floor(Math.random() * 400 + 100)
          forecast = `${jobs}K`
          previous = `${jobs - 50}K`
        }
      } else if (template.category === 'inflation') {
        const rate = (Math.random() * 3 + 2).toFixed(1)
        forecast = `${rate}%`
        previous = `${(parseFloat(rate) - 0.1).toFixed(1)}%`
      } else {
        const value = (Math.random() * 60 + 40).toFixed(1)
        forecast = value
        previous = (parseFloat(value) - 1).toFixed(1)
      }

      const eventDate = new Date(dateStr)
      const currentDate = new Date('2026-02-02')
      if (eventDate < currentDate) {
        const forecastNum = parseFloat(forecast || '0')
        const variation = (Math.random() - 0.5) * 2
        actual = template.category === 'interest-rate' || template.category === 'inflation' || template.category === 'gdp'
          ? `${(forecastNum + variation).toFixed(1)}%`
          : template.event.includes('Non-Farm')
          ? `${Math.floor(forecastNum + variation * 50)}K`
          : (forecastNum + variation).toFixed(1)
      }

      events.push({
        id: `${dateStr}-${i}`,
        date: dateStr,
        time,
        currency: currencies[currencyIndex],
        country: countries[currencyIndex],
        event: template.event,
        impact: template.impact,
        category: template.category,
        actual,
        forecast,
        previous
      })
    }
  }

  return events.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return a.time.localeCompare(b.time)
  })
}

const MOCK_EVENTS = generateMockEvents()

const IMPACT_COLORS = {
  high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  medium: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  low: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date('2026-02-02'))
  const [selectedImpact, setSelectedImpact] = useState<EventImpact | 'all'>('all')
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const currentMonth = selectedDate.getMonth()
  const currentYear = selectedDate.getFullYear()

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const todayEvents = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0]
    return MOCK_EVENTS.filter(event => {
      const matchesDate = event.date === dateStr
      const matchesImpact = selectedImpact === 'all' || event.impact === selectedImpact
      const matchesCurrency = selectedCurrency === 'all' || event.currency === selectedCurrency
      return matchesDate && matchesImpact && matchesCurrency
    })
  }, [selectedDate, selectedImpact, selectedCurrency])

  const monthEvents = useMemo(() => {
    return MOCK_EVENTS.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
    })
  }, [currentMonth, currentYear])

  const getEventsForDate = (date: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    return monthEvents.filter(event => event.date === dateStr)
  }

  const hasHighImpactEvent = (date: number) => {
    return getEventsForDate(date).some(event => event.impact === 'high')
  }

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentYear, currentMonth + delta, 1)
    setSelectedDate(newDate)
  }

  const currencies = ['all', ...Array.from(new Set(MOCK_EVENTS.map(e => e.currency))).sort()]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-cyan-600" />
              <h1 className="text-2xl font-bold text-gray-900">Economic Calendar</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">{MONTHS[currentMonth]} {currentYear}</h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => changeMonth(1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const isSelected = selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentMonth &&
                    selectedDate.getFullYear() === currentYear
                  const hasEvents = getEventsForDate(day).length > 0
                  const hasHighImpact = hasHighImpactEvent(day)

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                      className={`
                        aspect-square rounded-lg text-sm font-medium transition-all relative
                        ${isSelected
                          ? 'bg-cyan-600 text-white shadow-md'
                          : hasEvents
                          ? 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                          : 'text-gray-500 hover:bg-gray-50'
                        }
                      `}
                    >
                      {day}
                      {hasHighImpact && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between mb-3"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-700" />
                  <span className="font-semibold text-gray-900">Filters</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {showFilters && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block font-medium">Impact Level</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['all', 'high', 'medium', 'low'].map((impact) => (
                        <button
                          key={impact}
                          onClick={() => setSelectedImpact(impact as any)}
                          className={`
                            px-3 py-2 rounded-lg text-sm font-medium transition-all border
                            ${selectedImpact === impact
                              ? impact === 'all'
                                ? 'bg-cyan-600 text-white border-cyan-600'
                                : `${IMPACT_COLORS[impact as EventImpact].bg} ${IMPACT_COLORS[impact as EventImpact].text} ${IMPACT_COLORS[impact as EventImpact].border}`
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }
                          `}
                        >
                          {impact.charAt(0).toUpperCase() + impact.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-2 block font-medium">Currency</label>
                    <select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 text-gray-900"
                    >
                      {currencies.map(currency => (
                        <option key={currency} value={currency}>
                          {currency === 'all' ? 'All Currencies' : currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="font-semibold mb-3 text-sm text-gray-900">Impact Legend</h3>
              <div className="space-y-2">
                {[
                  { impact: 'high', label: 'High Impact', desc: 'Major market movers' },
                  { impact: 'medium', label: 'Medium Impact', desc: 'Moderate volatility' },
                  { impact: 'low', label: 'Low Impact', desc: 'Minor effect' },
                ].map(item => (
                  <div key={item.impact} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${IMPACT_COLORS[item.impact as EventImpact].dot}`} />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">{item.label}</div>
                      <div className="text-[10px] text-gray-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {todayEvents.length} events scheduled
                  </p>
                </div>
                <CalendarIcon className="w-8 h-8 text-cyan-600" />
              </div>
            </div>

            <div className="space-y-3">
              {todayEvents.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No events scheduled for this date</p>
                </div>
              ) : (
                todayEvents.map(event => (
                  <div
                    key={event.id}
                    className={`
                      bg-white rounded-xl p-4 border transition-all hover:shadow-md
                      ${IMPACT_COLORS[event.impact].border}
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-2 min-w-[60px]">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{event.time}</span>
                        </div>
                        <div className={`
                          w-full text-center py-1 rounded text-[10px] font-bold uppercase
                          ${IMPACT_COLORS[event.impact].bg} ${IMPACT_COLORS[event.impact].text}
                        `}>
                          {event.impact}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                <Globe className="w-3 h-3" />
                                {event.currency}
                              </span>
                              <span className="text-xs text-gray-500">{event.country}</span>
                            </div>
                            <h3 className="font-semibold text-gray-900">{event.event}</h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm">
                          {event.actual && (
                            <div>
                              <div className="text-[10px] text-gray-500 mb-0.5">ACTUAL</div>
                              <div className={`font-bold ${
                                event.forecast && parseFloat(event.actual) > parseFloat(event.forecast)
                                  ? 'text-emerald-600'
                                  : event.forecast && parseFloat(event.actual) < parseFloat(event.forecast)
                                  ? 'text-red-600'
                                  : 'text-gray-700'
                              }`}>
                                {event.actual}
                              </div>
                            </div>
                          )}
                          {event.forecast && (
                            <div>
                              <div className="text-[10px] text-gray-500 mb-0.5">FORECAST</div>
                              <div className="font-semibold text-gray-700">{event.forecast}</div>
                            </div>
                          )}
                          {event.previous && (
                            <div>
                              <div className="text-[10px] text-gray-500 mb-0.5">PREVIOUS</div>
                              <div className="text-gray-600">{event.previous}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}