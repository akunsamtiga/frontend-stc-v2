'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (countdown === 0) {
      router.push('/')
      return
    }

    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, router])

  // Circumference lingkaran SVG (r=20 → 2π×20 ≈ 125.66)
  const CIRCUMFERENCE = 2 * Math.PI * 20
  const strokeDashoffset = CIRCUMFERENCE * (1 - countdown / 10)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 text-center max-w-sm w-full">

        {/* 404 */}
        <div className="relative select-none">
          <span className="text-[120px] sm:text-[160px] font-black text-white/[0.04] leading-none tracking-tighter">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-[52px] sm:text-[68px] font-black text-white leading-none tracking-tight">
            404
          </span>
        </div>

        {/* Pesan */}
        <div className="flex flex-col gap-2">
          <p className="text-white/80 text-base font-medium">
            Halaman tidak ditemukan
          </p>
          <p className="text-white/30 text-sm">
            Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          </p>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10" />

        {/* Countdown ring */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <svg className="absolute inset-0 -rotate-90 w-full h-full">
              {/* Track */}
              <circle
                cx="28" cy="28" r="20"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="2"
              />
              {/* Progress */}
              <circle
                cx="28" cy="28" r="20"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
              />
            </svg>
            {/* Angka */}
            <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-semibold tabular-nums">
              {countdown}
            </span>
          </div>

          <p className="text-white/25 text-xs tracking-wide">
            Mengalihkan ke halaman utama...
          </p>
        </div>

        {/* Tombol manual */}
        <button
          onClick={() => router.push('/')}
          className="mt-2 px-6 py-2.5 rounded-full border border-white/10 text-white/50 text-sm
            hover:border-white/25 hover:text-white/80 hover:bg-white/[0.04]
            active:scale-95 transition-all duration-200"
        >
          Kembali sekarang
        </button>

      </div>
    </div>
  )
}