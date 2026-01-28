// app/(main)/support/page.tsx - Support & Help Center
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MessageCircle,
  ChevronLeft,
  Search,
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  CreditCard,
  Shield,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  CheckCircle2
} from 'lucide-react'

type Category = 'all' | 'account' | 'trading' | 'deposit' | 'withdrawal' | 'technical'

interface FAQ {
  id: string
  question: string
  answer: string
  category: Category
}

const FAQS: FAQ[] = [
  {
    id: '1',
    question: 'Bagaimana cara melakukan deposit?',
    answer: 'Anda bisa melakukan deposit melalui menu Balance > Deposit. Kami menerima berbagai metode pembayaran termasuk Bank Transfer, E-Wallet, dan Cryptocurrency. Minimum deposit adalah $10 untuk akun Demo dan $50 untuk akun Real.',
    category: 'deposit',
  },
  {
    id: '2',
    question: 'Berapa lama waktu proses withdrawal?',
    answer: 'Proses withdrawal biasanya memakan waktu 1-24 jam untuk verifikasi. Setelah disetujui, dana akan masuk ke rekening Anda dalam 1-3 hari kerja tergantung metode penarikan yang dipilih.',
    category: 'withdrawal',
  },
  {
    id: '3',
    question: 'Apa perbedaan akun Demo dan Real?',
    answer: 'Akun Demo menggunakan dana virtual untuk latihan trading tanpa risiko kehilangan uang. Akun Real menggunakan dana nyata dan profit yang Anda dapatkan bisa ditarik. Kami rekomendasikan mulai dengan akun Demo untuk pemula.',
    category: 'account',
  },
  {
    id: '4',
    question: 'Bagaimana cara menghitung profit?',
    answer: 'Profit dihitung berdasarkan persentase profit rate dari jumlah investasi. Misalnya, jika Anda invest $100 dengan profit rate 85%, maka profit Anda adalah $85 jika prediksi benar. Total yang Anda terima adalah $185 (investasi + profit).',
    category: 'trading',
  },
  {
    id: '5',
    question: 'Apakah platform ini aman?',
    answer: 'Ya, platform kami menggunakan enkripsi SSL 256-bit dan mematuhi standar keamanan internasional. Dana Anda disimpan di rekening terpisah (segregated account) dan kami memiliki lisensi resmi untuk beroperasi.',
    category: 'technical',
  },
  {
    id: '6',
    question: 'Apa itu profit rate dan bagaimana cara meningkatkannya?',
    answer: 'Profit rate adalah persentase keuntungan yang Anda dapatkan dari trading yang berhasil. Rate ini bervariasi per asset. Anda bisa meningkatkan profit rate dengan naik level VIP melalui program loyalitas kami.',
    category: 'trading',
  },
  {
    id: '7',
    question: 'Bagaimana cara verifikasi akun?',
    answer: 'Untuk verifikasi akun, buka menu Profile > Verification dan upload dokumen yang diperlukan (KTP/Passport dan bukti alamat). Proses verifikasi biasanya selesai dalam 24 jam.',
    category: 'account',
  },
  {
    id: '8',
    question: 'Apakah ada biaya tersembunyi?',
    answer: 'Tidak ada biaya deposit atau trading. Kami hanya mengenakan biaya administrasi 2% untuk withdrawal di bawah $100. Withdrawal di atas $100 tidak dikenakan biaya.',
    category: 'withdrawal',
  },
]

const CONTACT_METHODS = [
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat langsung dengan tim support',
    availability: '24/7 Online',
    action: 'Start Chat',
    color: 'emerald',
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'support@stcautotrade.com',
    availability: 'Response within 2 hours',
    action: 'Send Email',
    color: 'purple',
  },
  {
    icon: Phone,
    title: 'WhatsApp',
    description: '+62 812-3456-7890',
    availability: '24/7 Available',
    action: 'Chat on WhatsApp',
    color: 'green',
  },
]

const HELP_CATEGORIES = [
  { id: 'all' as const, label: 'All Topics', icon: HelpCircle },
  { id: 'account' as const, label: 'Account', icon: Settings },
  { id: 'trading' as const, label: 'Trading', icon: TrendingUp },
  { id: 'deposit' as const, label: 'Deposit', icon: CreditCard },
  { id: 'withdrawal' as const, label: 'Withdrawal', icon: FileText },
  { id: 'technical' as const, label: 'Technical', icon: Shield },
]

export default function SupportPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category>('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const filteredFAQs = FAQS.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
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
              <MessageCircle className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl font-bold">Support Center</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-8 mb-8 text-center">
          <h2 className="text-3xl font-bold mb-3">How can we help you?</h2>
          <p className="text-gray-400 mb-6">Search our knowledge base or contact support</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {CONTACT_METHODS.map((method) => (
            <div
              key={method.title}
              className={`bg-${method.color}-500/10 border border-${method.color}-500/30 rounded-xl p-6 hover:border-${method.color}-500/50 transition-all cursor-pointer`}
            >
              <div className={`w-12 h-12 bg-${method.color}-500/20 rounded-xl flex items-center justify-center mb-4`}>
                <method.icon className={`w-6 h-6 text-${method.color}-400`} />
              </div>
              <h3 className="text-lg font-bold mb-2">{method.title}</h3>
              <p className="text-sm text-gray-400 mb-3">{method.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <Clock className="w-3 h-3" />
                <span>{method.availability}</span>
              </div>
              <button className={`w-full bg-${method.color}-500 hover:bg-${method.color}-600 text-white py-2.5 rounded-lg font-medium transition-colors`}>
                {method.action}
              </button>
            </div>
          ))}
        </div>

        {/* Category Filter */}
        <div className="bg-[#1a1f2e] rounded-xl p-4 mb-6 border border-gray-800/50">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold">Browse by Category</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {HELP_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-[#0f1419] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                }`}
              >
                <cat.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-[#1a1f2e] rounded-xl overflow-hidden border border-gray-800/50">
          <div className="p-4 border-b border-gray-800/50">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              Frequently Asked Questions
            </h3>
          </div>

          <div className="divide-y divide-gray-800/50">
            {filteredFAQs.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No results found for "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredFAQs.map((faq) => (
                <div key={faq.id} className="p-4 hover:bg-[#232936] transition-colors">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full flex items-start justify-between gap-4 text-left"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{faq.question}</h4>
                      {expandedFAQ === faq.id && (
                        <p className="text-sm text-gray-400 mt-3 leading-relaxed">{faq.answer}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {expandedFAQ === faq.id ? (
                        <ChevronUp className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-6">
            <FileText className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-bold mb-2">Documentation</h3>
            <p className="text-sm text-gray-400 mb-4">
              Complete guides and tutorials for using our platform
            </p>
            <button className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium">
              <span>View Documentation</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
            <CheckCircle2 className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="text-lg font-bold mb-2">System Status</h3>
            <p className="text-sm text-gray-400 mb-4">
              Check our platform status and scheduled maintenance
            </p>
            <button className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium">
              <span>View Status</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Still Need Help */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 rounded-xl p-8 mt-6 text-center">
          <MessageCircle className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Still need help?</h3>
          <p className="text-gray-400 mb-6">
            Our support team is available 24/7 to assist you
          </p>
          <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}