// app/event/page.tsx - Trading Events
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

const DUMMY_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Welcome Bonus 100%',
    description: 'Dapatkan bonus deposit 100% hingga $1000 untuk member baru!',
    category: 'bonus',
    status: 'ongoing',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    image: '🎁',
    badge: 'HOT',
    featured: true,
  },
  {
    id: '2',
    title: 'Trading Championship 2024',
    description: 'Kompetisi trading bulanan dengan total hadiah $50,000',
    category: 'competition',
    status: 'ongoing',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    participants: 1247,
    prize: '$50,000',
    image: '🏆',
    featured: true,
  },
  {
    id: '3',
    title: 'Cashback 20% Setiap Hari Jumat',
    description: 'Trading di hari Jumat dan dapatkan cashback 20% dari loss!',
    category: 'promotion',
    status: 'ongoing',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    image: '💰',
    badge: 'NEW',
  },
  {
    id: '4',
    title: 'Refer & Earn $100',
    description: 'Ajak teman dan dapatkan $100 untuk setiap referral yang deposit',
    category: 'promotion',
    status: 'ongoing',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    image: '👥',
  },
  {
    id: '5',
    title: 'VIP Trader Competition',
    description: 'Eksklusif untuk VIP members dengan hadiah total $100,000',
    category: 'competition',
    status: 'upcoming',
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    prize: '$100,000',
    image: '⭐',
    badge: 'EXCLUSIVE',
  },
  {
    id: '6',
    title: 'Double Profit Weekend',
    description: 'Profit rate naik 2x lipat setiap weekend!',
    category: 'bonus',
    status: 'ongoing',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    image: '⚡',
  },
  {
    id: '7',
    title: 'Christmas Mega Giveaway',
    description: 'Total hadiah $200,000 untuk perayaan tahun baru!',
    category: 'competition',
    status: 'ended',
    startDate: '2023-12-15',
    endDate: '2024-01-05',
    participants: 5432,
    prize: '$200,000',
    image: '🎄',
  },
]

export default function EventPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all')
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | 'all'>('all')

  const filteredEvents = DUMMY_EVENTS.filter(event => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus
    return matchesCategory && matchesStatus
  })

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'ongoing': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
      case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'ended': return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
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
              <Activity className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold">Trading Events</h1>
            </div>
          </div>

          {/* Category Filters */}
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
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-[#2f3648] text-gray-400 hover:bg-[#3a4360] border border-gray-800/50'
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
        {/* Status Filter */}
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
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                  : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`bg-[#1a1f2e] rounded-xl overflow-hidden hover:bg-[#232936] transition-all border ${
                event.featured
                  ? 'border-purple-500/50 ring-2 ring-purple-500/20'
                  : 'border-gray-800/50'
              }`}
            >
              {/* Image/Icon Header */}
              <div className="relative bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-8 text-center">
                <div className="text-6xl mb-3">{event.image}</div>
                {event.badge && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 rounded-md text-xs font-bold">
                    {event.badge}
                  </div>
                )}
                {event.featured && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500 rounded-md text-xs font-bold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    FEATURED
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Status & Category */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(event.status)}`}>
                    {getStatusIcon(event.status)}
                    {event.status.toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-[#2f3648] text-gray-400 border border-gray-800/50">
                    {getCategoryIcon(event.category)}
                    {event.category}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold mb-2">{event.title}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{event.description}</p>

                {/* Meta Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{event.startDate} - {event.endDate}</span>
                  </div>
                  {event.participants && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{event.participants.toLocaleString()} participants</span>
                    </div>
                  )}
                  {event.prize && (
                    <div className="flex items-center gap-2 text-xs">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400 font-semibold">{event.prize} Prize Pool</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="bg-[#1a1f2e] rounded-xl p-12 text-center">
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Events Found</h3>
            <p className="text-gray-400">Try changing your filters to see more events</p>
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