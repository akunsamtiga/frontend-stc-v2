// app/(main)/berita/page.tsx - Trading News & Market Updates
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Newspaper,
  ChevronLeft,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  ArrowRight,
  Bookmark,
  Share2,
  Eye,
  Filter
} from 'lucide-react'

type NewsCategory = 'all' | 'market' | 'crypto' | 'forex' | 'analysis' | 'education'

interface NewsArticle {
  id: string
  title: string
  excerpt: string
  category: NewsCategory
  image: string
  author: string
  publishedAt: string
  readTime: number
  views: number
  trending?: boolean
  featured?: boolean
}

const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: '1',
    title: 'Bitcoin Tembus $50,000: Analisis Lengkap Bull Run 2024',
    excerpt: 'Bitcoin menembus level psikologis $50,000 untuk pertama kalinya sejak Desember 2023. Analis memperkirakan momentum bullish akan berlanjut hingga Q2 2024.',
    category: 'crypto',
    image: '₿',
    author: 'John Crypto',
    publishedAt: '2024-01-28',
    readTime: 5,
    views: 15420,
    trending: true,
    featured: true,
  },
  {
    id: '2',
    title: 'Federal Reserve Pertahankan Suku Bunga: Dampak ke Pasar Global',
    excerpt: 'The Fed memutuskan untuk mempertahankan suku bunga di 5.25-5.50%. Keputusan ini berdampak signifikan terhadap dollar index dan pasar saham global.',
    category: 'market',
    image: '📊',
    author: 'Sarah Market',
    publishedAt: '2024-01-27',
    readTime: 7,
    views: 12890,
    trending: true,
  },
  {
    id: '3',
    title: 'Strategi Trading Binary Options untuk Pemula',
    excerpt: 'Panduan lengkap memulai trading binary options dengan modal kecil. Termasuk tips risk management dan pemilihan timeframe yang tepat.',
    category: 'education',
    image: '📚',
    author: 'Mike Trading',
    publishedAt: '2024-01-26',
    readTime: 10,
    views: 8750,
  },
  {
    id: '4',
    title: 'EUR/USD Melemah: Analisis Teknikal dan Fundamental',
    excerpt: 'Pasangan mata uang EUR/USD menunjukkan tren bearish setelah data inflasi Eropa mengecewakan. Support kuat di level 1.0800.',
    category: 'forex',
    image: '💱',
    author: 'David FX',
    publishedAt: '2024-01-25',
    readTime: 6,
    views: 6420,
    featured: true,
  },
  {
    id: '5',
    title: 'Top 5 Cryptocurrency untuk Investasi 2024',
    excerpt: 'Daftar cryptocurrency dengan potensi pertumbuhan tertinggi di tahun 2024 berdasarkan analisis fundamental dan teknikal mendalam.',
    category: 'crypto',
    image: '💎',
    author: 'Alex Blockchain',
    publishedAt: '2024-01-24',
    readTime: 8,
    views: 18900,
    trending: true,
  },
  {
    id: '6',
    title: 'Cara Membaca Candlestick Pattern: Panduan Komprehensif',
    excerpt: 'Tutorial lengkap membaca dan menginterpretasi candlestick pattern untuk meningkatkan akurasi prediksi trading Anda.',
    category: 'education',
    image: '🕯️',
    author: 'Lisa Chart',
    publishedAt: '2024-01-23',
    readTime: 12,
    views: 5230,
  },
  {
    id: '7',
    title: 'Gold Mencapai All-Time High: Faktor Pendorong',
    excerpt: 'Harga emas mencapai rekor tertinggi sepanjang masa di $2,150 per ounce. Ketidakpastian ekonomi global menjadi faktor utama.',
    category: 'market',
    image: '🥇',
    author: 'Robert Gold',
    publishedAt: '2024-01-22',
    readTime: 5,
    views: 9870,
  },
  {
    id: '8',
    title: 'Ethereum 2.0: Dampak terhadap Harga ETH',
    excerpt: 'Upgrade Ethereum ke proof-of-stake membawa implikasi besar bagi ekosistem DeFi dan harga ETH jangka panjang.',
    category: 'crypto',
    image: 'Ξ',
    author: 'Emma Defi',
    publishedAt: '2024-01-21',
    readTime: 9,
    views: 11200,
  },
]

const CATEGORIES = [
  { id: 'all' as const, label: 'All News', icon: Newspaper },
  { id: 'market' as const, label: 'Market', icon: TrendingUp },
  { id: 'crypto' as const, label: 'Crypto', icon: Tag },
  { id: 'forex' as const, label: 'Forex', icon: TrendingDown },
  { id: 'analysis' as const, label: 'Analysis', icon: Eye },
  { id: 'education' as const, label: 'Education', icon: Filter },
]

export default function BeritaPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all')

  const filteredArticles = NEWS_ARTICLES.filter(
    article => selectedCategory === 'all' || article.category === selectedCategory
  )

  const featuredArticle = filteredArticles.find(a => a.featured) || filteredArticles[0]
  const trendingArticles = filteredArticles.filter(a => a.trending)
  const regularArticles = filteredArticles.filter(a => !a.featured && !a.trending)

  const getCategoryColor = (category: NewsCategory) => {
    switch (category) {
      case 'market': return 'blue'
      case 'crypto': return 'yellow'
      case 'forex': return 'green'
      case 'analysis': return 'purple'
      case 'education': return 'rose'
      default: return 'gray'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return new Intl.DateTimeFormat('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date)
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
              <Newspaper className="w-6 h-6 text-rose-400" />
              <h1 className="text-2xl font-bold">Trading News</h1>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
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
        {/* Featured Article */}
        {featuredArticle && (
          <div className="bg-gradient-to-br from-rose-500/10 to-red-500/10 border-2 border-rose-500/50 rounded-xl overflow-hidden mb-6 hover:border-rose-500/70 transition-all cursor-pointer">
            <div className="grid md:grid-cols-2 gap-6 p-6">
              <div className="flex items-center justify-center bg-gradient-to-br from-rose-500/20 to-red-500/20 rounded-xl p-12">
                <div className="text-8xl">{featuredArticle.image}</div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-md">
                    FEATURED
                  </span>
                  <span className={`px-2 py-1 bg-${getCategoryColor(featuredArticle.category)}-500/20 text-${getCategoryColor(featuredArticle.category)}-400 text-xs font-medium rounded-md border border-${getCategoryColor(featuredArticle.category)}-500/50`}>
                    {featuredArticle.category.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">{featuredArticle.title}</h2>
                <p className="text-gray-400 mb-4">{featuredArticle.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{featuredArticle.readTime} min read</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{featuredArticle.views.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(featuredArticle.publishedAt)}</span>
                  </div>
                </div>
                <button className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2 w-fit">
                  <span>Read Article</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trending Section */}
        {trendingArticles.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-red-400" />
              <h3 className="text-xl font-bold">Trending Now</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {trendingArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-[#1a1f2e] rounded-xl overflow-hidden hover:bg-[#232936] transition-all border border-gray-800/50 cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-red-500/20 to-rose-500/20 p-8 text-center">
                    <div className="text-5xl">{article.image}</div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 bg-${getCategoryColor(article.category)}-500/20 text-${getCategoryColor(article.category)}-400 text-xs font-medium rounded-md border border-${getCategoryColor(article.category)}-500/50`}>
                        {article.category}
                      </span>
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-md border border-red-500/50 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        TRENDING
                      </span>
                    </div>
                    <h4 className="font-bold mb-2 line-clamp-2">{article.title}</h4>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{article.readTime} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-3 h-3" />
                        <span>{article.views.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Articles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Latest Articles</h3>
            <div className="text-sm text-gray-400">
              {filteredArticles.length} articles
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularArticles.map((article) => (
              <div
                key={article.id}
                className="bg-[#1a1f2e] rounded-xl overflow-hidden hover:bg-[#232936] transition-all border border-gray-800/50 cursor-pointer group"
              >
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-12 text-center group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-all">
                  <div className="text-6xl">{article.image}</div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 bg-${getCategoryColor(article.category)}-500/20 text-${getCategoryColor(article.category)}-400 text-xs font-medium rounded-md border border-${getCategoryColor(article.category)}-500/50`}>
                      {article.category}
                    </span>
                  </div>
                  <h4 className="font-bold mb-2 line-clamp-2 group-hover:text-rose-400 transition-colors">
                    {article.title}
                  </h4>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{article.excerpt}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{article.readTime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{article.views.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                    <div className="text-xs text-gray-500">
                      by {article.author}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2f3648] transition-colors">
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2f3648] transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredArticles.length === 0 && (
          <div className="bg-[#1a1f2e] rounded-xl p-12 text-center">
            <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Articles Found</h3>
            <p className="text-gray-400">Try selecting a different category</p>
          </div>
        )}

        {/* Newsletter Subscribe */}
        <div className="bg-gradient-to-r from-rose-500/10 via-red-500/10 to-pink-500/10 border border-rose-500/30 rounded-xl p-8 mt-8 text-center">
          <Newspaper className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
          <p className="text-gray-400 mb-6">
            Subscribe to our newsletter and get the latest trading news delivered to your inbox
          </p>
          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-[#1a1f2e] border border-gray-800/50 rounded-lg px-4 py-3 focus:outline-none focus:border-rose-500/50"
            />
            <button className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Subscribe
            </button>
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