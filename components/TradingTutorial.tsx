import React, { useState, useEffect } from 'react'
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Award,
  Target,
  Check
} from 'lucide-react'

interface TutorialStep {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  highlight?: string
  tips: string[]
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Selamat Datang di STC AutoTrade',
    description: 'Mari pelajari dasar-dasar trading binary option dalam 5 langkah sederhana.',
    icon: Award,
    tips: [
      'Akun demo Rp 10.000.000 gratis untuk berlatih',
      'Profit hingga 95% per transaksi',
      'Trading tersedia 24/7 tanpa henti'
    ],
  },
  {
    title: 'Pilih Asset Trading',
    description: 'Klik dropdown di header untuk memilih asset yang ingin Anda tradingkan.',
    icon: TrendingUp,
    highlight: 'asset-selector',
    tips: [
      'IDX_STC untuk trading index saham',
      'Cryptocurrency: BTC, ETH, BNB',
      'Perhatikan profit rate setiap asset'
    ],
  },
  {
    title: 'Pilih Tipe Akun',
    description: 'Gunakan akun DEMO untuk latihan atau REAL untuk trading sesungguhnya.',
    icon: DollarSign,
    highlight: 'account-selector',
    tips: [
      'Akun Demo: Rp 10 juta virtual untuk berlatih',
      'Akun Real: Deposit minimal Rp 50.000',
      'Bisa switch akun kapan saja'
    ],
  },
  {
    title: 'Atur Amount & Duration',
    description: 'Tentukan jumlah investasi dan durasi trading sesuai strategi Anda.',
    icon: Clock,
    highlight: 'trading-panel',
    tips: [
      'Amount: Minimal Rp 10.000 per transaksi',
      'Duration: 1 detik hingga 60 menit',
      'Lihat potential profit sebelum trading'
    ],
  },
  {
    title: 'Prediksi Pergerakan Harga',
    description: 'Tekan BUY jika prediksi harga naik, atau SELL jika prediksi harga turun.',
    icon: Target,
    tips: [
      'Analisis chart terlebih dahulu',
      'Perhatikan trend pergerakan harga',
      'BUY = Naik | SELL = Turun'
    ],
  },
]

interface TradingTutorialProps {
  onComplete: () => void
  onSkip: () => void
}

export default function TradingTutorial({ onComplete, onSkip }: TradingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const step = TUTORIAL_STEPS[currentStep]
  const Icon = step.icon
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsAnimating(false)
      }, 200)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsAnimating(false)
      }, 200)
    }
  }

  const handleStepClick = (index: number) => {
    if (index !== currentStep) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(index)
        setIsAnimating(false)
      }, 200)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={onSkip}
      />

      {/* Tutorial Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg mx-3 sm:mx-4 animate-scale-in">
        <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Progress Bar */}
          <div className="h-1 bg-gray-800/50">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Header */}
          <div className="relative px-5 sm:px-6 py-5 sm:py-6 border-b border-gray-800/50">
            {/* Close Button */}
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {/* Header Content */}
            <div className="flex items-start gap-4 pr-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1">
                  Langkah {currentStep + 1} dari {TUTORIAL_STEPS.length}
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  {step.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 sm:px-6 py-5 sm:py-6">
            <div className={`transition-all duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
              {/* Description */}
              <p className="text-sm text-gray-400 leading-relaxed mb-5">
                {step.description}
              </p>

              {/* Tips */}
              <div className="space-y-2.5 mb-6">
                {step.tips.map((tip, i) => (
                  <div 
                    key={i}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="w-5 h-5 bg-blue-500/10 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span className="text-gray-300 leading-relaxed">
                      {tip}
                    </span>
                  </div>
                ))}
              </div>

              {/* Step Indicators */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {TUTORIAL_STEPS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleStepClick(index)}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentStep
                        ? 'w-8 h-2 bg-blue-500'
                        : index < currentStep
                        ? 'w-2 h-2 bg-blue-500/50'
                        : 'w-2 h-2 bg-gray-700 hover:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-4 border-t border-gray-800/50 bg-[#0a0e17]">
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex-1 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm text-white"
              >
                <span>
                  {currentStep === TUTORIAL_STEPS.length - 1
                    ? 'Mulai Trading'
                    : 'Lanjutkan'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {currentStep < TUTORIAL_STEPS.length - 1 && (
              <button
                onClick={onSkip}
                className="w-full mt-3 text-xs text-gray-500 hover:text-gray-400 transition-colors"
              >
                Lewati tutorial
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  )
}