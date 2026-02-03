'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Activity,
  ChevronLeft,
  Calendar,
  Users,
  Gift,
  Zap,
  Trophy,
  Clock,
  ArrowRight,
  CheckCircle2,
  Star
} from 'lucide-react'

type EventCategory = 'all' | 'bonus' | 'competition' | 'promotion'
type EventStatus = 'ongoing' | 'upcoming' | 'ended'

interface Event {
  id: string
  title: string
  description: string
  category: EventCategory
  status: EventStatus
  startDate: string
  endDate: string
  participants?: number
  prize?: string
  image: string
  badge?: string
  featured?: boolean
}

const getNextMonth = () => {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getEndOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

const getMonthName = (date: Date) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[date.getMonth()]
}

export default function EventPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all')
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | 'all'>('all')

  const eventDates = useMemo(() => {
    const nextMonth = getNextMonth()
    const monthStart = formatDate(nextMonth)
    const monthEnd = formatDate(getEndOfMonth(nextMonth))
    const monthName = getMonthName(nextMonth)
    const year = nextMonth.getFullYear()
    
    const yearStart = formatDate(new Date(nextMonth.getFullYear(), 0, 1))
    const yearEnd = formatDate(new Date(nextMonth.getFullYear(), 11, 31))
    
    return {
      monthStart,
      monthEnd,
      monthName,
      year,
      yearStart,
      yearEnd
    }
  }, [])

  const DUMMY_EVENTS: Event[] = [
    {
      id: '1',
      title: 'Welcome Bonus 100%',
      description: 'Dapatkan bonus deposit 100% hingga $1000 untuk member baru!',
      category: 'bonus',
      status: 'upcoming',
      startDate: eventDates.monthStart,
      endDate: eventDates.monthEnd,
      image: '/p1.png',
      badge: 'HOT',
      featured: true,
    },
    {
      id: '2',
      title: `Trading Championship ${eventDates.monthName} ${eventDates.year}`,
      description: 'Kompetisi trading bulanan dengan total hadiah $50,000',
      category: 'competition',
      status: 'upcoming',
      startDate: eventDates.monthStart,
      endDate: eventDates.monthEnd,
      participants: 100,
      prize: '$50,000',
      image: '/p2.png',
      featured: true,
    },
    {
      id: '3',
      title: 'Cashback 20% Setiap Hari Jumat',
      description: 'Trading di hari Jumat dan dapatkan cashback 20% dari loss!',
      category: 'promotion',
      status: 'upcoming',
      startDate: eventDates.monthStart,
      endDate: eventDates.yearEnd,
      image: '/p3.png',
      badge: 'NEW',
    },
    {
      id: '4',
      title: 'Refer & Earn $100',
      description: 'Ajak teman dan dapatkan $100 untuk setiap referral yang deposit',
      category: 'promotion',
      status: 'upcoming',
      startDate: eventDates.monthStart,
      endDate: eventDates.monthEnd,
      image: '/p4.png',
    },
    {
      id: '5',
      title: 'VIP Trader Competition',
      description: 'Eksklusif untuk VIP members dengan hadiah total $100,000',
      category: 'competition',
      status: 'upcoming',
      startDate: eventDates.monthStart,
      endDate: eventDates.monthEnd,
      prize: '$100,000',
      image: '/p5.png',
      badge: 'EXCLUSIVE',
    },
    {
      id: '6',
      title: 'Double Profit Weekend',
      description: 'Profit rate naik 2x lipat setiap weekend!',
      category: 'bonus',
      status: 'upcoming',
      startDate: eventDates.monthStart,
      endDate: eventDates.yearEnd,
      image: '/p6.png',
    },
  ]

  const filteredEvents = DUMMY_EVENTS.filter(event => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus
    return matchesCategory && matchesStatus
  })

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'ongoing': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'upcoming': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'ended': return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case 'ongoing': return <Zap className="w-3 h-3" />
      case 'upcoming': return <Clock className="w-3 h-3" />
      case 'ended': return <CheckCircle2 className="w-3 h-3" />
    }
  }

  const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case 'bonus': return <Gift className="w-4 h-4" />
      case 'competition': return <Trophy className="w-4 h-4" />
      case 'promotion': return <Star className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-sky-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Trading Events</h1>
                <p className="text-xs text-gray-500">Event {eventDates.monthName} {eventDates.year}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="text-blue-700 font-medium">Event Bulan Depan</p>
                <p className="text-gray-600">Semua event akan dimulai pada bulan <span className="text-gray-900 font-semibold">{eventDates.monthName} {eventDates.year}</span></p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { value: 'all' as const, label: 'All Events', icon: Activity },
              { value: 'bonus' as const, label: 'Bonus', icon: Gift },
              { value: 'competition' as const, label: 'Competition', icon: Trophy },
              { value: 'promotion' as const, label: 'Promotion', icon: Star },
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { value: 'all' as const, label: 'All Status' },
            { value: 'ongoing' as const, label: 'Ongoing' },
            { value: 'upcoming' as const, label: 'Upcoming' },
            { value: 'ended' as const, label: 'Ended' },
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => setSelectedStatus(status.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedStatus === status.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all border ${
                event.featured
                  ? 'border-sky-300 ring-2 ring-sky-100'
                  : 'border-gray-200'
              }`}
            >
              <div className="relative bg-gradient-to-br from-sky-50 to-blue-50 p-6 aspect-square flex items-center justify-center">
                <div className="relative w-full h-full z-0">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-contain rounded-xl"
                    priority={event.featured}
                  />
                </div>
                {event.badge && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white rounded-md text-xs font-bold shadow-lg z-20">
                    {event.badge}
                  </div>
                )}
                {event.featured && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-sky-600 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-lg z-20">
                    <Star className="w-3 h-3" />
                    FEATURED
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(event.status)}`}>
                    {getStatusIcon(event.status)}
                    {event.status.toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                    {getCategoryIcon(event.category)}
                    {event.category}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{event.startDate} - {event.endDate}</span>
                  </div>
                  {event.participants && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{event.participants.toLocaleString()}+ participants</span>
                    </div>
                  )}
                  {event.prize && (
                    <div className="flex items-center gap-2 text-xs">
                      <Trophy className="w-3 h-3 text-yellow-600" />
                      <span className="text-yellow-600 font-semibold">{event.prize} Prize Pool</span>
                    </div>
                  )}
                </div>

                <button className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-500">Try changing your filters to see more events</p>
          </div>
        )}
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