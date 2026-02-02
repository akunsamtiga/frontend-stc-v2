'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Newspaper,
  ChevronLeft,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  Award,
  Zap,
  BookOpen,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react'

type NewsCategory = 'all' | 'announcement' | 'update' | 'promotion' | 'education' | 'market'

interface NewsItem {
  id: string
  title: string
  excerpt: string
  category: NewsCategory
  date: string
  readTime: number
  featured?: boolean
  badge?: string
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
  return `${day}/${month}/${year}`
}

const getMonthName = (date: Date) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[date.getMonth()]
}

export default function NewsPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const eventDates = useMemo(() => {
    const nextMonth = getNextMonth()
    const monthName = getMonthName(nextMonth)
    const year = nextMonth.getFullYear()
    
    return {
      monthName,
      year,
      formattedDate: formatDate(nextMonth)
    }
  }, [])

  const DUMMY_NEWS: NewsItem[] = [
    {
      id: '1',
      title: 'Peluncuran Trading Tournament Bulan Depan dengan Hadiah $100,000',
      excerpt: 'Bersiaplah untuk turnamen trading terbesar tahun ini! Kompetisi akan dimulai bulan depan dengan total hadiah mencapai $100,000 untuk para pemenang.',
      category: 'announcement',
      date: eventDates.formattedDate,
      readTime: 5,
      featured: true,
      badge: 'HOT'
    },
    {
      id: '2',
      title: 'Update Platform: Fitur AI Trading Assistant Kini Tersedia',
      excerpt: 'Tingkatkan performa trading Anda dengan AI Trading Assistant yang baru kami luncurkan. Dapatkan analisis real-time dan rekomendasi trading yang akurat.',
      category: 'update',
      date: eventDates.formattedDate,
      readTime: 4,
      featured: true
    },
    {
      id: '3',
      title: 'Promo Spesial: Cashback 20% untuk Semua Member',
      excerpt: 'Nikmati cashback 20% untuk setiap transaksi trading Anda. Promo berlaku terbatas mulai bulan depan!',
      category: 'promotion',
      date: eventDates.formattedDate,
      readTime: 3,
      badge: 'NEW'
    },
    {
      id: '4',
      title: 'Panduan Lengkap: Strategi Trading untuk Pemula',
      excerpt: 'Pelajari strategi trading yang efektif dan mudah dipahami untuk pemula. Dari analisis teknikal hingga manajemen risiko.',
      category: 'education',
      date: eventDates.formattedDate,
      readTime: 8
    },
    {
      id: '5',
      title: 'Analisis Market: Peluang Trading di Pasar Crypto',
      excerpt: 'Simak analisis lengkap tentang kondisi pasar cryptocurrency dan peluang trading yang bisa Anda manfaatkan.',
      category: 'market',
      date: eventDates.formattedDate,
      readTime: 6
    },
    {
      id: '6',
      title: 'Pengumuman: Maintenance Sistem Terjadwal',
      excerpt: 'Kami akan melakukan maintenance sistem untuk meningkatkan performa platform. Jadwal lengkap dan detail maintenance.',
      category: 'announcement',
      date: eventDates.formattedDate,
      readTime: 2
    },
    {
      id: '7',
      title: 'Success Story: Trader Pemula Raih Profit $10,000',
      excerpt: 'Inspirasi dari trader pemula yang berhasil meraih profit $10,000 dalam sebulan. Simak tips dan strateginya!',
      category: 'education',
      date: eventDates.formattedDate,
      readTime: 7
    },
    {
      id: '8',
      title: 'Update: Tambahan Instrumen Trading Baru',
      excerpt: 'Kami menambahkan 50+ instrumen trading baru termasuk saham, komoditas, dan cryptocurrency populer.',
      category: 'update',
      date: eventDates.formattedDate,
      readTime: 4
    },
    {
      id: '9',
      title: 'Promo Referral: Dapatkan Bonus hingga $500',
      excerpt: 'Ajak teman untuk bergabung dan dapatkan bonus hingga $500 untuk setiap referral yang aktif trading.',
      category: 'promotion',
      date: eventDates.formattedDate,
      readTime: 3
    }
  ]

  const filteredNews = DUMMY_NEWS.filter(news => {
    const matchesCategory = selectedCategory === 'all' || news.category === selectedCategory
    const matchesSearch = news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         news.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getCategoryColor = (category: NewsCategory) => {
    switch (category) {
      case 'announcement': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'update': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'promotion': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'education': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'market': return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getCategoryIcon = (category: NewsCategory) => {
    switch (category) {
      case 'announcement': return <AlertCircle className="w-3 h-3" />
      case 'update': return <Zap className="w-3 h-3" />
      case 'promotion': return <Award className="w-3 h-3" />
      case 'education': return <BookOpen className="w-3 h-3" />
      case 'market': return <TrendingUp className="w-3 h-3" />
      default: return <Newspaper className="w-3 h-3" />
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
              <Newspaper className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">News & Updates</h1>
                <p className="text-xs text-gray-500">Latest news from {eventDates.monthName} {eventDates.year}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
            {[
              { value: 'all' as const, label: 'All News', icon: Newspaper },
              { value: 'announcement' as const, label: 'Announcement', icon: AlertCircle },
              { value: 'update' as const, label: 'Updates', icon: Zap },
              { value: 'promotion' as const, label: 'Promotions', icon: Award },
              { value: 'education' as const, label: 'Education', icon: BookOpen },
              { value: 'market' as const, label: 'Market', icon: TrendingUp },
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredNews.filter(n => n.featured).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Featured News
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {filteredNews.filter(n => n.featured).map((news) => (
                <div
                  key={news.id}
                  className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all border-2 border-blue-200 relative group cursor-pointer"
                >
                  {news.badge && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded-md text-xs font-bold shadow-lg z-20">
                      {news.badge}
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getCategoryColor(news.category)}`}>
                        {getCategoryIcon(news.category)}
                        {news.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {news.date}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {news.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {news.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{news.readTime} min read</span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read More
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-gray-600" />
          All News
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNews.filter(n => !n.featured).map((news) => (
            <div
              key={news.id}
              className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all border border-gray-200 group cursor-pointer relative"
            >
              {news.badge && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white rounded-md text-xs font-bold shadow-lg z-20">
                  {news.badge}
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getCategoryColor(news.category)}`}>
                    {getCategoryIcon(news.category)}
                    {news.category}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {news.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {news.excerpt}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {news.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {news.readTime} min
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNews.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No News Found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? `No results found for "${searchQuery}"`
                : 'Try changing your filters to see more news'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 md:p-8 text-center">
          <Newspaper className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Stay Updated</h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Jangan lewatkan update terbaru! Subscribe newsletter kami dan dapatkan berita langsung ke email Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{DUMMY_NEWS.length}</div>
            <div className="text-sm text-gray-600">Total Articles</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-1">Daily</div>
            <div className="text-sm text-gray-600">New Updates</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">24/7</div>
            <div className="text-sm text-gray-600">Market Coverage</div>
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