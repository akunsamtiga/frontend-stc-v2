'use client'

import { useRouter } from 'next/navigation'
import { 
  Trophy,
  ChevronLeft,
  Calendar,
  Bell,
  Mail,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  Sparkles,
  MessageCircle
} from 'lucide-react'

export default function TournamentPage() {
  const router = useRouter()

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
              <Trophy className="w-6 h-6 text-yellow-600" />
              <h1 className="text-2xl font-bold text-gray-900">Trading Tournament</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-purple-50 border border-yellow-200 rounded-2xl p-8 md:p-12 text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
            <Trophy className="w-10 h-10 text-yellow-600" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tournament Coming Soon!
          </h2>
          
          <p className="text-lg text-gray-600 mb-2">
            Tidak ada turnamen yang sedang berlangsung saat ini
          </p>
          
          <p className="text-gray-500 max-w-2xl mx-auto">
            Kami sedang mempersiapkan turnamen trading yang menarik dengan hadiah fantastis. 
            Nantikan pengumuman resmi kami segera!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Hadiah Besar</h3>
            <p className="text-sm text-gray-600">
              Prize pool jutaan rupiah untuk para pemenang
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Fair Competition</h3>
            <p className="text-sm text-gray-600">
              Kompetisi yang adil untuk semua level trader
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Live Leaderboard</h3>
            <p className="text-sm text-gray-600">
              Real-time ranking dan statistik performa
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-600" />
            Yang Bisa Anda Harapkan
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Multiple Tournament Types</h4>
                <p className="text-sm text-gray-600">
                  Turnamen harian, mingguan, dan bulanan dengan berbagai kategori dan prize pool
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Real-Time Rankings</h4>
                <p className="text-sm text-gray-600">
                  Pantau posisi Anda di leaderboard secara real-time dan lihat statistik lengkap
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Exclusive Rewards</h4>
                <p className="text-sm text-gray-600">
                  Dapatkan hadiah menarik, bonus, dan privilege khusus untuk para pemenang
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Community Competition</h4>
                <p className="text-sm text-gray-600">
                  Berkompetisi dengan trader lain dan bangun reputasi sebagai top performer
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6 md:p-8 text-center mb-8">
          <Bell className="w-12 h-12 text-cyan-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Dapatkan Notifikasi</h3>
          <p className="text-gray-600 mb-6">
            Jadilah yang pertama tahu saat turnamen baru dimulai!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm">
              <Bell className="w-5 h-5" />
              Aktifkan Notifikasi
            </button>
            <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" />
              Email Saya
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            Format Turnamen Mendatang
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Daily Challenge</h4>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded border border-emerald-200">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Kompetisi harian dengan prize pool $1,000
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Unlimited
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Min $50
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Weekly Championship</h4>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded border border-blue-200">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Turnamen mingguan dengan prize $10,000
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Max 500
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Min $100
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Monthly Grand Prix</h4>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded border border-purple-200">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Turnamen bulanan dengan prize $50,000
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Max 1000
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Min $200
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900">VIP Elite League</h4>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded border border-yellow-200">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Eksklusif untuk VIP dengan prize $100,000
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Invite Only
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Min $1,000
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Kapan turnamen akan dimulai?</h4>
              <p className="text-sm text-gray-600">
                Kami akan mengumumkan jadwal turnamen pertama dalam waktu dekat. 
                Aktifkan notifikasi untuk mendapat update terbaru.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Apakah ada biaya untuk mengikuti turnamen?</h4>
              <p className="text-sm text-gray-600">
                Sebagian besar turnamen gratis untuk diikuti. Beberapa turnamen premium 
                mungkin memerlukan entry fee dengan prize pool yang lebih besar.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Bagaimana cara menang?</h4>
              <p className="text-sm text-gray-600">
                Pemenang ditentukan berdasarkan total profit, win rate, atau kombinasi 
                berbagai metrik trading selama periode turnamen.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Apakah bisa menggunakan akun Demo?</h4>
              <p className="text-sm text-gray-600">
                Turnamen tertentu akan tersedia untuk akun Demo sebagai latihan. 
                Namun turnamen dengan hadiah real hanya untuk akun Real.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}