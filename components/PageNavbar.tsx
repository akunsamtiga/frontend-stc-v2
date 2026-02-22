'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ReactNode } from 'react'

// ─── Shimmer brand text ───────────────────────────────────────────────────────

function ShimmerBrand() {
  return (
    <>
      <style>{`
        @keyframes shimmer-slide {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-brand {
          background: linear-gradient(
            105deg,
            #b0b8c8 0%,
            #b0b8c8 30%,
            #ffffff 46%,
            #e8d48b 50%,
            #f5e6a3 52%,
            #ffffff 54%,
            #b0b8c8 70%,
            #b0b8c8 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: shimmer-slide 3.2s linear infinite;
        }
      `}</style>
      <span
        className="shimmer-brand text-lg font-bold tracking-tight select-none"
        style={{ letterSpacing: '-0.02em' }}
      >
        Stouch.id
      </span>
    </>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageNavbarProps {
  title: string
  subtitle?: string
  onBack?: () => void
  backHref?: string
  hideBack?: boolean
  rightSlot?: ReactNode
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PageNavbar({
  title,
  subtitle,
  onBack,
  backHref,
  hideBack = false,
  rightSlot,
  className = '',
}: PageNavbarProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) return onBack()
    if (backHref) return router.push(backHref)
    router.back()
  }

  return (
    <header
      className={`sticky top-0 z-40 bg-white ${className}`}
      style={{ borderBottom: '1px solid #f0f0f0' }}
    >
      <div className="flex items-center gap-3 px-4 sm:px-8 lg:px-12 py-3 sm:py-4 max-w-screen-xl mx-auto">

        {/* Back button */}
        {!hideBack && (
          <button
            onClick={handleBack}
            aria-label="Kembali"
            className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 hover:bg-gray-100"
            style={{ background: '#f6f6f6' }}
          >
            <ArrowLeft size={15} color="#555" strokeWidth={2} />
          </button>
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-sm sm:text-[15px] font-semibold text-gray-900 truncate leading-snug"
            style={{ letterSpacing: '-0.01em' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-gray-400 truncate mt-px">{subtitle}</p>
          )}
        </div>

        {/* Right: custom slot + brand */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {rightSlot && (
            <div className="flex items-center gap-2">{rightSlot}</div>
          )}
          <ShimmerBrand />
        </div>
      </div>
    </header>
  )
}

// ─── Right-slot helpers ───────────────────────────────────────────────────────

interface NavIconButtonProps {
  icon: ReactNode
  label: string
  onClick: () => void
  badge?: number | string
}

export function NavIconButton({ icon, label, onClick, badge }: NavIconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 hover:bg-gray-100"
      style={{ background: '#f6f6f6' }}
    >
      <span className="text-gray-500">{icon}</span>
      {badge !== undefined && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1 bg-red-500">
          {badge}
        </span>
      )}
    </button>
  )
}

interface NavTextButtonProps {
  label: string
  onClick: () => void
}

export function NavTextButton({ label, onClick }: NavTextButtonProps) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-medium px-3 py-1.5 rounded-full text-gray-600 transition-all duration-150 active:scale-90 hover:bg-gray-100"
      style={{ background: '#f6f6f6' }}
    >
      {label}
    </button>
  )
}