import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Target,
  Zap,
  CheckCircle2,
  Play,
  Minus,
  Plus,
  Info,
  AlertCircle
} from 'lucide-react';

interface DemoTradingTutorialProps {
  onClose: () => void;
}

const DemoTradingTutorial: React.FC<DemoTradingTutorialProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [demoBalance, setDemoBalance] = useState(10000000);
  const [selectedAmount, setSelectedAmount] = useState(100000);
  const [selectedDuration, setSelectedDuration] = useState('5m');
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const steps = [
    {
      title: "Selamat Datang di Demo Trading! 🎉",
      description: "Mari pelajari cara trading binary option dalam 4 langkah mudah. Anda akan mendapat akun demo Rp 10.000.000 untuk berlatih tanpa risiko.",
      icon: Play,
      highlight: null,
      tips: [
        "Akun demo Rp 10.000.000 gratis",
        "Tanpa risiko kehilangan uang",
        "Profit hingga 95% per trading"
      ]
    },
    {
      title: "1. Pilih Jumlah Trading",
      description: "Tentukan berapa banyak yang ingin Anda tradingkan. Mulai dengan jumlah kecil untuk belajar terlebih dahulu.",
      icon: DollarSign,
      highlight: 'amount',
      tips: [
        "Gunakan slider untuk memilih jumlah",
        "Atau klik tombol + / - untuk adjust",
        "Mulai dari Rp 10.000 hingga Rp 1.000.000"
      ]
    },
    {
      title: "2. Pilih Durasi",
      description: "Pilih berapa lama trading Anda akan berlangsung. Durasi lebih pendek = hasil lebih cepat, tapi perlu analisis yang tepat.",
      icon: Clock,
      highlight: 'duration',
      tips: [
        "1m - 5m: Cocok untuk scalping",
        "15m - 30m: Untuk analisis trend",
        "Durasi lebih lama = lebih aman"
      ]
    },
    {
      title: "3. Prediksi Arah Harga",
      description: "Klik BUY jika Anda pikir harga akan NAIK, atau SELL jika harga akan TURUN. Lihat potensi profit Anda di atas tombol!",
      icon: Target,
      highlight: 'buttons',
      tips: [
        "BUY = Prediksi harga naik",
        "SELL = Prediksi harga turun",
        "Lihat profit potential sebelum trading"
      ]
    },
    {
      title: "4. Selesai! Siap Trading! 🚀",
      description: "Anda sudah siap! Coba demo ini sekarang atau langsung trading dengan akun real untuk profit nyata.",
      icon: CheckCircle2,
      highlight: null,
      tips: [
        "Latih strategi dengan akun demo",
        "Pahami market movement",
        "Siap trading dengan akun real"
      ]
    }
  ];

  const currentStepData = steps[currentStep];

  useEffect(() => {
    setProgress(((currentStep + 1) / steps.length) * 100);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleDemoTrade = (direction: 'buy' | 'sell') => {
    setShowSuccess(true);
    setTimeout(() => {
      const profit = direction === 'buy' ? selectedAmount * 0.95 : selectedAmount * 0.95;
      setDemoBalance(demoBalance + profit);
      setShowSuccess(false);
    }, 2000);
  };

  const adjustAmount = (delta: number) => {
    const newAmount = Math.max(10000, Math.min(1000000, selectedAmount + delta));
    setSelectedAmount(newAmount);
  };

  const StepIcon = currentStepData.icon;
  const potentialProfit = selectedAmount * 1.95;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Main Modal */}
      <div className="relative w-full max-w-6xl max-h-[95vh] bg-gradient-to-br from-[#0f1419] to-[#0a0e17] rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-800/50 overflow-hidden animate-scale-in flex flex-col">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800/50 z-10">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-0 min-h-full">
            {/* Left: Content */}
            <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-between">
              <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                {/* Step Header */}
                <div className="mb-6 sm:mb-8">
                  <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4 sm:mb-6">
                    <StepIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    <span className="text-xs sm:text-sm font-medium text-blue-400">
                      Step {currentStep + 1} of {steps.length}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
                    {currentStepData.title}
                  </h2>
                  <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
                    {currentStepData.description}
                  </p>
                </div>

                {/* Tips Section */}
                <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {currentStepData.tips.map((tip, i) => (
                    <div 
                      key={i} 
                      className="flex items-start gap-3 animate-fade-in-up bg-white/5 rounded-lg p-3 sm:p-4 border border-gray-800/50 hover:border-gray-700/50 transition-colors" 
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        {currentStep === 0 ? (
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        ) : (
                          <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        )}
                      </div>
                      <span className="text-sm sm:text-base text-gray-300 leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>

                {/* Warning for Step 3 */}
                {currentStep === 3 && (
                  <div className="mb-6 sm:mb-8 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-yellow-400 mb-1">Pro Tip!</div>
                      <p className="text-sm text-gray-400">
                        Analisis chart dan trend sebelum trading. Jangan terburu-buru, lihat pattern harga terlebih dahulu.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-800/50 mt-auto">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg sm:rounded-xl transition-all text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-medium hidden sm:inline">Back</span>
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setIsAnimating(true);
                        setTimeout(() => {
                          setCurrentStep(i);
                          setIsAnimating(false);
                        }, 300);
                      }}
                      className={`h-1.5 sm:h-2 rounded-full transition-all ${
                        i === currentStep 
                          ? 'w-6 sm:w-8 bg-gradient-to-r from-blue-500 to-emerald-500' 
                          : 'w-1.5 sm:w-2 bg-gray-700 hover:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {currentStep === steps.length - 1 ? (
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-sm sm:text-base"
                  >
                    <span>Start Trading</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-sm sm:text-base"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Interactive Demo */}
            <div className="bg-[#0a0e17] p-6 sm:p-8 lg:p-12 border-t lg:border-t-0 lg:border-l border-gray-800/50 flex flex-col">
              {/* Demo Balance */}
              <div className="mb-6 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-1">Demo Balance</div>
                    <div className="text-2xl sm:text-3xl font-bold text-white">
                      Rp {demoBalance.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Interactive Trading Panel */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Amount Selector */}
                <div className={`transition-all duration-300 rounded-xl ${currentStepData.highlight === 'amount' ? 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-[#0a0e17] shadow-lg shadow-blue-500/20' : ''}`}>
                  <label className="text-xs sm:text-sm text-gray-400 mb-2 block font-medium">Amount</label>
                  <div className="bg-[#1a1f2e] border border-gray-800/50 rounded-xl p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={() => adjustAmount(-10000)}
                        className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      
                      <div className="flex-1 text-center">
                        <div className="text-xl sm:text-2xl font-bold">
                          Rp {selectedAmount.toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => adjustAmount(10000)}
                        className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <input
                      type="range"
                      min="10000"
                      max="1000000"
                      step="10000"
                      value={selectedAmount}
                      onChange={(e) => setSelectedAmount(Number(e.target.value))}
                      className="w-full"
                    />
                    
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>10K</span>
                      <span>1M</span>
                    </div>
                  </div>
                </div>

                {/* Duration Selector */}
                <div className={`transition-all duration-300 rounded-xl ${currentStepData.highlight === 'duration' ? 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-[#0a0e17] shadow-lg shadow-blue-500/20' : ''}`}>
                  <label className="text-xs sm:text-sm text-gray-400 mb-2 block font-medium">Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: '1m', label: '1m' },
                      { value: '5m', label: '5m' },
                      { value: '15m', label: '15m' },
                      { value: '30m', label: '30m' }
                    ].map((dur) => (
                      <button
                        key={dur.value}
                        onClick={() => setSelectedDuration(dur.value)}
                        className={`py-3 sm:py-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
                          selectedDuration === dur.value
                            ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg'
                            : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profit Info */}
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm text-gray-400">Potential Profit</span>
                    <span className="text-sm sm:text-base font-semibold text-green-400">+95%</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-green-400">
                      Rp {potentialProfit.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Total payout: Rp {(selectedAmount + potentialProfit).toLocaleString()}
                  </div>
                </div>

                {/* Trading Buttons */}
                <div className={`grid grid-cols-2 gap-3 sm:gap-4 transition-all duration-300 rounded-xl ${currentStepData.highlight === 'buttons' ? 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-[#0a0e17] shadow-lg shadow-blue-500/20' : ''}`}>
                  <button
                    onClick={() => handleDemoTrade('buy')}
                    disabled={currentStep < 3}
                    className="py-5 sm:py-6 bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all shadow-lg shadow-green-500/20 flex flex-col items-center gap-2"
                  >
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-sm sm:text-base">BUY</span>
                    <span className="text-[10px] sm:text-xs opacity-75">Price will rise</span>
                  </button>

                  <button
                    onClick={() => handleDemoTrade('sell')}
                    disabled={currentStep < 3}
                    className="py-5 sm:py-6 bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all shadow-lg shadow-red-500/20 flex flex-col items-center gap-2"
                  >
                    <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-sm sm:text-base">SELL</span>
                    <span className="text-[10px] sm:text-xs opacity-75">Price will fall</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Notification */}
        {showSuccess && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in z-20 p-4">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-2xl p-6 sm:p-8 text-center animate-scale-in max-w-sm w-full">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 animate-pulse" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Trade Placed! 🎉</h3>
              <p className="text-sm sm:text-base text-gray-400">Your demo trade is being processed...</p>
              <div className="mt-4 h-1 bg-green-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 animate-progress"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
          opacity: 0;
        }

        .animate-progress {
          animation: progress 2s ease-out;
        }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          height: 6px;
        }

        input[type="range"]::-webkit-slider-track {
          background: rgba(59, 130, 246, 0.2);
          height: 6px;
          border-radius: 3px;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #3b82f6, #10b981);
          cursor: pointer;
          margin-top: -7px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          transition: transform 0.2s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        input[type="range"]::-moz-range-track {
          background: rgba(59, 130, 246, 0.2);
          height: 6px;
          border-radius: 3px;
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #3b82f6, #10b981);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          transition: transform 0.2s;
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default DemoTradingTutorial;