'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { api } from '@/lib/api'
import { Information } from '@/types'
import Image from 'next/image'

interface InformationBannerProps {
  onClose?: () => void
  /** @deprecated tidak lagi digunakan, banner kini fixed popup */
  onLoad?: (hasBanner: boolean) => void
  className?: string
}

const DISPLAY_DURATION = 5000

const priorityConfig = {
  urgent: {
    accent: '#ef4444',
    accentDim: 'rgba(239,68,68,0.1)',
    accentBorder: 'rgba(239,68,68,0.22)',
  },
  high: {
    accent: '#f97316',
    accentDim: 'rgba(249,115,22,0.1)',
    accentBorder: 'rgba(249,115,22,0.22)',
  },
  medium: {
    accent: '#3b82f6',
    accentDim: 'rgba(59,130,246,0.1)',
    accentBorder: 'rgba(59,130,246,0.22)',
  },
  low: {
    accent: '#64748b',
    accentDim: 'rgba(100,116,139,0.1)',
    accentBorder: 'rgba(100,116,139,0.22)',
  },
}

type Phase = 'idle' | 'in' | 'visible' | 'out'

export default function InformationBanner({ onClose, onLoad }: InformationBannerProps) {
  const [banner, setBanner] = useState<Information | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(100)

  // Use refs for callbacks so useEffect deps never change
  const onCloseRef = useRef(onClose)
  const onLoadRef = useRef(onLoad)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => { onLoadRef.current = onLoad }, [onLoad])

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const timerStartedRef = useRef(false)

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setPhase('out')
    setTimeout(() => {
      setBanner(null)
      setPhase('idle')
      onCloseRef.current?.()
    }, 380)
  }, [])

  const startAutoTimer = useCallback(() => {
    startTimeRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current
      const remaining = Math.max(0, 100 - (elapsed / DISPLAY_DURATION) * 100)
      setProgress(remaining)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    timerRef.current = setTimeout(dismiss, DISPLAY_DURATION)
  }, [dismiss])

  // Load once on mount — deps intentionally empty, callbacks via refs
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const pinnedBanner = await api.getPinnedInformation()
        if (cancelled) return

        if (pinnedBanner?.title && pinnedBanner?.description) {
          setBanner(pinnedBanner)
          onLoadRef.current?.(true)

          // Two rAF + small timeout so browser paints 'in' transform before switching to 'visible'
          requestAnimationFrame(() => {
            if (cancelled) return
            setPhase('in')
            requestAnimationFrame(() => {
              setTimeout(() => {
                if (cancelled) return
                setPhase('visible')
                // Jika tidak ada gambar, langsung mulai timer
                // Jika ada gambar, timer dimulai setelah gambar selesai load (handleImageLoad)
                if (!pinnedBanner.imageUrl) {
                  timerStartedRef.current = true
                  startAutoTimer()
                }
              }, 30)
            })
          })
        } else {
          onLoadRef.current?.(false)
        }
      } catch {
        if (!cancelled) onLoadRef.current?.(false)
      }
    }

    load()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty

  // Dipanggil saat gambar banner selesai dimuat — baru mulai hitung mundur
  const handleImageLoad = useCallback(() => {
    if (!timerStartedRef.current) {
      timerStartedRef.current = true
      startAutoTimer()
    }
  }, [startAutoTimer])

  const handleClick = async () => {
    if (!banner) return
    try {
      await api.trackInformationClick(banner.id)
      if (banner.linkUrl) window.open(banner.linkUrl, '_blank', 'noopener,noreferrer')
    } catch {}
  }

  if (!banner || phase === 'idle') return null

  const config =
    priorityConfig[banner.priority as keyof typeof priorityConfig] ?? priorityConfig.medium

  const isIn = phase === 'in'
  const isOut = phase === 'out'
  const active = phase === 'visible'

  return (
    <>
      <style>{`
        @keyframes ib-dot-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(0.65); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: active ? 1 : 0,
          transition: 'opacity 0.35s ease',
          pointerEvents: active ? 'auto' : 'none',
        }}
      />

      {/* Center container */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          pointerEvents: 'none',
        }}
      >
        {/* Card wrapper - animated */}
        <div
          style={{
            width: '100%',
            maxWidth: '640px',
            pointerEvents: active ? 'auto' : 'none',
            opacity: active ? 1 : 0,
            transform: isIn
              ? 'translateY(18px) scale(0.95)'
              : isOut
              ? 'translateY(-14px) scale(0.95)'
              : 'translateY(0) scale(1)',
            transition: isOut
              ? 'opacity 0.32s ease, transform 0.32s ease'
              : 'opacity 0.38s cubic-bezier(0.22,1,0.36,1), transform 0.38s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* Card */}
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '16px',
              background: 'rgba(13,17,23,0.98)',
              border: `1px solid ${config.accentBorder}`,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.035), 0 20px 60px rgba(0,0,0,0.7), 0 0 50px ${config.accentDim}`,
            }}
          >
            {/* Top accent line */}
            <div
              style={{
                height: '2px',
                background: `linear-gradient(90deg, ${config.accent} 0%, transparent 80%)`,
              }}
            />

            {/* Optional image - MODIFIED: aspect-ratio auto, object-contain */}
            {banner.imageUrl && (
              <div 
                style={{ 
                  position: 'relative', 
                  width: '100%',
                  maxHeight: '320px',
                  minHeight: '160px',
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  width={640}
                  height={320}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '320px',
                    objectFit: 'cover', // Changed from 'cover' to 'contain'
                  }}
                  priority
                  onLoad={handleImageLoad}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    // Gambar gagal load, tetap jalankan timer
                    if (!timerStartedRef.current) {
                      timerStartedRef.current = true
                      startAutoTimer()
                    }
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, transparent 80%, rgba(13,17,23,0.95) 100%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            )}

            {/* Footer + progress */}
            <div style={{ padding: '0 24px 18px 24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  marginTop: '6px',
                }}
              >
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.03em' }}>
                  Menutup otomatis
                </span>
              </div>
              {/* Progress bar — driven by rAF, no CSS transition */}
              <div
                style={{
                  height: '2px',
                  borderRadius: '99px',
                  background: 'rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: config.accent,
                    borderRadius: '99px',
                    opacity: 0.65,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}