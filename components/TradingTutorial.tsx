// components/TradingTutorial.tsx

'use client'

import { useState } from 'react'
import { X, ArrowRight, TrendingUp, TrendingDown, DollarSign, Clock, Award } from 'lucide-react'

interface TutorialStep {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  action?: string
  highlight?: string
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Selamat Datang di STC AutoTrade! 🎉',
    description: 'Mari kita pelajari dasar-dasar trading binary option dalam 5 langkah sederhana.',
    icon: Award,
  },
  {
    title: 'Pilih Asset Trading',
    description: 'Klik pada menu dropdown di kiri atas untuk memilih asset yang ingin Anda tradingkan (IDX_STC, crypto, dll).',
    icon: TrendingUp,
    highlight: 'asset-selector',
  },
  {
    title: 'Pilih Akun Trading',
    description: 'Gunakan akun DEMO (Rp 10.000.000 gratis) untuk berlatih, atau akun REAL untuk trading sesungguhnya.',
    icon: DollarSign,
    highlight: 'account-selector',
  },
  {
    title: 'Atur Amount & Duration',
    description: 'Tentukan jumlah investasi (minimal Rp 10.000) dan durasi trading (1s - 60m).',
    icon: Clock,
    highlight: 'trading-panel',
  },
  {
    title: 'Prediksi Naik atau Turun',
    description: 'Tekan tombol BUY (🟢) jika Anda prediksi harga naik, atau SELL (🔴) jika prediksi harga turun.',
    icon: TrendingDown,
    action: 'Mulai Trading Sekarang!',
  },
]

interface TradingTutorialProps {
  onComplete: () => void
  onSkip: () => void
}

export default function TradingTutorial({ onComplete, onSkip }: TradingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = TUTORIAL_STEPS[currentStep]
  const Icon = step.icon

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] animate-fade-in" />

      {/* Tutorial Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg mx-4 animate-scale-in">
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-2 border-blue-500/30 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-8">
            <div className="absolute top-4 right-4">
              <button
                onClick={onSkip}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-white/70 mb-1">
                  Langkah {currentStep + 1} dari {TUTORIAL_STEPS.length}
                </div>
                <h2 className="text-2xl font-bold text-white">{step.title}</h2>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              {step.description}
            </p>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Progress</span>
                <span className="text-xs text-gray-400">
                  {Math.round(((currentStep + 1) / TUTORIAL_STEPS.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mb-8">
              {TUTORIAL_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 h-2 bg-blue-500 rounded-full'
                      : index < currentStep
                      ? 'w-2 h-2 bg-green-500 rounded-full'
                      : 'w-2 h-2 bg-gray-700 rounded-full hover:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Kembali
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 group"
              >
                <span>
                  {currentStep === TUTORIAL_STEPS.length - 1
                    ? step.action || 'Selesai'
                    : 'Lanjut'}
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Skip Button */}
            {currentStep < TUTORIAL_STEPS.length - 1 && (
              <button
                onClick={onSkip}
                className="w-full mt-4 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                Lewati Tutorial
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
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  )
}