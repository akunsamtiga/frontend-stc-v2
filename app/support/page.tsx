'use client'

import { useRouter } from 'next/navigation'
import { 
  MessageCircle,
  ChevronLeft,
  Mail,
  Phone,
  Clock,
  Headphones,
  Send
} from 'lucide-react'

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Kirim pertanyaan via email',
    contact: 'sanzystoreid@gmail.com',
    availability: 'Response dalam 2 jam',
    action: 'Send Email',
    color: 'blue',
    href: 'mailto:sanzystoreid@gmail.com',
  },
  {
    icon: Phone,
    title: 'WhatsApp',
    description: 'Hubungi kami via WhatsApp',
    contact: '+62 813-3990-8765',
    availability: '24/7 Available',
    action: 'Chat on WhatsApp',
    color: 'green',
    href: 'https://wa.me/6281339908765',
  },
]

export default function SupportPage() {
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
              <Headphones className="w-6 h-6 text-cyan-600" />
              <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-100 rounded-full mb-6">
            <MessageCircle className="w-10 h-10 text-cyan-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Kami Siap Membantu Anda
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tim support kami tersedia 24/7 untuk menjawab pertanyaan dan membantu menyelesaikan masalah Anda
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {CONTACT_METHODS.map((method) => (
            <div
              key={method.title}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all group"
            >
              <div className={`w-14 h-14 bg-${method.color}-100 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <method.icon className={`w-7 h-7 text-${method.color}-600`} />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{method.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{method.description}</p>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
                <p className="text-sm text-gray-700">{method.contact}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-5">
                <Clock className="w-4 h-4" />
                <span>{method.availability}</span>
              </div>

              <a
                href={method.href}
                className={`block w-full bg-${method.color}-600 hover:bg-${method.color}-700 text-white text-center py-3 rounded-lg font-medium transition-colors shadow-sm`}
              >
                {method.action}
              </a>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-8 text-center">
          <MessageCircle className="w-12 h-12 text-cyan-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-3">Butuh Bantuan Cepat?</h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Untuk respons tercepat, hubungi kami via WhatsApp atau email. 
            Tim support kami siap membantu Anda dengan segala pertanyaan seputar trading, deposit, withdrawal, dan lainnya.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/6281339908765"
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <Phone className="w-5 h-5" />
              Chat on WhatsApp
            </a>
            <a
              href="mailto:sanzystoreid@gmail.com"
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send Email
            </a>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">&lt; 2 Hours</div>
            <div className="text-sm text-gray-600">Email Response</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">Instant</div>
            <div className="text-sm text-gray-600">WhatsApp Reply</div>
          </div>
        </div>
      </div>
    </div>
  )
}