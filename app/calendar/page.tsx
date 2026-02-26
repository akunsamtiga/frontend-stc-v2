'use client'

import { useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Filter, Clock, Globe, ChevronDown
} from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import PageNavbar from '@/components/PageNavbar'

// ─── Types ──────────────────────────────────────────────────────────────────────
type EventImpact   = 'high' | 'medium' | 'low'
type EventCategory = 'interest-rate'|'gdp'|'employment'|'inflation'|'manufacturing'|'consumer'|'central-bank'|'other'

interface EconomicEvent {
  id: string; date: string; time: string; currency: string; country: string
  event: string; impact: EventImpact; category: EventCategory
  actual?: string; forecast?: string; previous?: string
}

// ─── Design System (identical to PageClient.tsx) ────────────────────────────
const SPRING = { type: 'spring', stiffness: 80, damping: 20 } as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING } },
}
const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { ...SPRING } },
}
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { ...SPRING } },
}
const stagger = (delay = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.04 } },
})

function Reveal({ children, variants = fadeUp, delay = 0, className = '' }: {
  children: React.ReactNode; variants?: Variants; delay?: number; className?: string
}) {
  return (
    <motion.div className={className} variants={variants} initial="hidden"
      whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ delay }}>
      {children}
    </motion.div>
  )
}

function AnimatedHeadline({ text, className, style }: {
  text: string; className?: string; style?: React.CSSProperties
}) {
  return (
    <motion.h2 className={className} style={style}
      variants={stagger(0.07)} initial="hidden"
      whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
      {text.split(' ').map((word, i) => (
        <motion.span key={i} className="inline-block mr-[0.25em]"
          variants={{
            hidden:  { opacity: 0, y: 30, filter: 'blur(4px)' },
            visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { ...SPRING } },
          }}>
          {word}
        </motion.span>
      ))}
    </motion.h2>
  )
}

function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Reveal variants={fadeLeft} className="mb-4 sm:mb-5">
      <div className="flex items-center gap-3">
        <motion.div className="h-px flex-1 max-w-[2rem]" style={{ background: '#e5e7eb' }}
          initial={{ scaleX: 0, originX: 0 }} whileInView={{ scaleX: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.4, ease: 'easeOut' }} />
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5 ml-1">{subtitle}</p>}
    </Reveal>
  )
}

// ─── Impact config ──────────────────────────────────────────────────────────────
const IMPACT: Record<EventImpact, { accent: string; light: string; border: string; label: string }> = {
  high:   { accent:'#ef4444', light:'#fef2f2', border:'#fecaca', label:'High'   },
  medium: { accent:'#f97316', light:'#fff7ed', border:'#fed7aa', label:'Medium' },
  low:    { accent:'#eab308', light:'#fefce8', border:'#fef08a', label:'Low'    },
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ─── Data Generator ─────────────────────────────────────────────────────────────
const generateMockEvents = (): EconomicEvent[] => {
  const currencies = ['USD','EUR','GBP','JPY','AUD','CAD','CHF','CNY']
  const countries  = ['United States','Eurozone','United Kingdom','Japan','Australia','Canada','Switzerland','China']
  const templates  = [
    { event:'Interest Rate Decision',     impact:'high'   as EventImpact, category:'interest-rate' as EventCategory },
    { event:'Non-Farm Payrolls',          impact:'high'   as EventImpact, category:'employment'    as EventCategory },
    { event:'GDP Growth Rate',            impact:'high'   as EventImpact, category:'gdp'           as EventCategory },
    { event:'CPI (Consumer Price Index)', impact:'high'   as EventImpact, category:'inflation'     as EventCategory },
    { event:'Unemployment Rate',          impact:'high'   as EventImpact, category:'employment'    as EventCategory },
    { event:'FOMC Meeting Minutes',       impact:'high'   as EventImpact, category:'central-bank'  as EventCategory },
    { event:'Retail Sales',               impact:'high'   as EventImpact, category:'consumer'      as EventCategory },
    { event:'Core CPI',                   impact:'high'   as EventImpact, category:'inflation'     as EventCategory },
    { event:'Manufacturing PMI',          impact:'medium' as EventImpact, category:'manufacturing' as EventCategory },
    { event:'Services PMI',               impact:'medium' as EventImpact, category:'manufacturing' as EventCategory },
    { event:'Trade Balance',              impact:'medium' as EventImpact, category:'other'         as EventCategory },
    { event:'Consumer Confidence',        impact:'medium' as EventImpact, category:'consumer'      as EventCategory },
    { event:'Building Permits',           impact:'low'    as EventImpact, category:'other'         as EventCategory },
    { event:'Factory Orders',             impact:'low'    as EventImpact, category:'manufacturing' as EventCategory },
  ]
  const times = ['02:00','07:30','08:30','09:00','10:00','12:30','13:00','14:00','15:00','20:30']
  const events: EconomicEvent[] = []

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(2026, month, 0).getDate()
    for (let i = 0; i < 35; i++) {
      const day  = Math.floor(Math.random() * daysInMonth) + 1
      const tmpl = templates[Math.floor(Math.random() * templates.length)]
      const ci   = Math.floor(Math.random() * currencies.length)
      const ds   = `2026-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      const time = times[Math.floor(Math.random() * times.length)]

      let forecast: string|undefined, previous: string|undefined, actual: string|undefined
      if (tmpl.category === 'interest-rate') {
        const r = (Math.random()*5).toFixed(2); forecast=`${r}%`; previous=`${(+r-0.25).toFixed(2)}%`
      } else if (tmpl.category === 'gdp') {
        const g = (Math.random()*4+1).toFixed(1); forecast=`${g}%`; previous=`${(+g-0.2).toFixed(1)}%`
      } else if (tmpl.category === 'employment') {
        if (tmpl.event.includes('Unemployment')) {
          const r=(Math.random()*5+3).toFixed(1); forecast=`${r}%`; previous=`${(+r+0.1).toFixed(1)}%`
        } else { const j=100+Math.floor(Math.random()*400); forecast=`${j}K`; previous=`${j-50}K` }
      } else if (tmpl.category === 'inflation') {
        const r=(Math.random()*3+2).toFixed(1); forecast=`${r}%`; previous=`${(+r-0.1).toFixed(1)}%`
      } else { const v=(Math.random()*60+40).toFixed(1); forecast=v; previous=(+v-1).toFixed(1) }

      if (new Date(ds) < new Date('2026-02-02') && forecast) {
        const fNum = parseFloat(forecast)
        const variation = (Math.random()-0.5)*2
        actual = ['interest-rate','inflation','gdp'].includes(tmpl.category)
          ? `${(fNum+variation*0.1).toFixed(1)}%`
          : tmpl.event.includes('Non-Farm')
          ? `${Math.floor(fNum+variation*50)}K`
          : (fNum+variation).toFixed(1)
      }

      events.push({ id:`${ds}-${i}`, date:ds, time, currency:currencies[ci], country:countries[ci],
        event:tmpl.event, impact:tmpl.impact, category:tmpl.category, actual, forecast, previous })
    }
  }
  return events.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
}

const MOCK_EVENTS = generateMockEvents()

// ─── Mini Calendar ──────────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelectDate, monthEvents }: {
  selectedDate: Date; onSelectDate: (d: Date) => void; monthEvents: EconomicEvent[]
}) {
  const [view, setView] = useState(selectedDate)
  const cm = view.getMonth(); const cy = view.getFullYear()
  const dim = new Date(cy, cm+1, 0).getDate()
  const fd  = new Date(cy, cm, 1).getDay()

  const dayEvents = (day: number) => {
    const ds = `${cy}-${String(cm+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return monthEvents.filter(e => e.date === ds)
  }
  const hasHigh = (day: number) => dayEvents(day).some(e => e.impact === 'high')

  return (
    <motion.div className="bg-white rounded-2xl p-4" style={{ border:'1px solid #f0f0f0' }}
      initial="hidden" whileInView="visible" viewport={{ once:true }} variants={scaleIn}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-gray-800">{MONTHS[cm]} {cy}</p>
        <div className="flex gap-1">
          {[[-1,'prev'],[1,'next']].map(([delta, key]) => (
            <motion.button key={key}
              onClick={() => setView(new Date(cy, cm + (delta as number), 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}>
              {delta === -1 ? <ChevronLeft className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['S','M','T','W','T','F','S'].map((d,i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({length:fd}).map((_,i) => <div key={`e${i}`}/>)}
        {Array.from({length:dim}).map((_,i) => {
          const day = i+1
          const isSel = selectedDate.getDate()===day && selectedDate.getMonth()===cm && selectedDate.getFullYear()===cy
          const hasEvts = dayEvents(day).length > 0
          const hasHi   = hasHigh(day)
          return (
            <motion.button key={day}
              onClick={() => onSelectDate(new Date(cy, cm, day))}
              className="aspect-square rounded-lg text-xs font-medium relative"
              style={{
                background: isSel ? '#374151' : hasEvts ? '#f9fafb' : 'transparent',
                color:      isSel ? '#fff'    : hasEvts ? '#111827' : '#9ca3af',
              }}
              whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}>
              {day}
              {hasHi && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400"/>
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Event Card ─────────────────────────────────────────────────────────────────
function EventCard({ event, index }: { event: EconomicEvent; index: number }) {
  const m = IMPACT[event.impact]
  return (
    <motion.div
      variants={{ hidden:{ opacity:0, x:-20 }, visible:{ opacity:1, x:0, transition:{ ...SPRING, delay:index*0.05 } } }}
      className="bg-white rounded-2xl overflow-hidden flex"
      style={{ border:`1px solid ${m.border}` }}
      whileHover={{ y:-2, boxShadow:`0 12px 32px ${m.accent}15`, transition:{ duration:0.2 } }}>
      <div className="w-1 flex-shrink-0" style={{ background:m.accent }}/>
      <div className="flex-1 p-4">
        <div className="flex items-start gap-4">
          {/* Time + badge */}
          <div className="flex flex-col items-center gap-1.5 min-w-[52px]">
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3"/><span>{event.time}</span>
            </div>
            <motion.span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
              style={{ background:m.light, color:m.accent }}
              initial={{ scale:0.8 }} whileInView={{ scale:1 }}
              viewport={{ once:true }} transition={{ ...SPRING }}>
              {m.label}
            </motion.span>
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <motion.span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold"
                style={{ background:'#eff6ff', color:'#2563eb' }}
                whileHover={{ scale:1.05 }}>
                <Globe className="w-2.5 h-2.5"/>{event.currency}
              </motion.span>
              <span className="text-[11px] text-gray-400">{event.country}</span>
            </div>
            <p className="text-sm font-bold text-gray-800 leading-snug" style={{ letterSpacing:'-0.01em' }}>
              {event.event}
            </p>
          </div>
        </div>
        {/* Data row */}
        {(event.actual || event.forecast || event.previous) && (
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3" style={{ borderTop:'1px solid #f8f8f8' }}>
            {[
              { label:'ACTUAL',   value:event.actual,   isActual:true  },
              { label:'FORECAST', value:event.forecast, isActual:false },
              { label:'PREVIOUS', value:event.previous, isActual:false },
            ].filter(d => d.value).map(({ label, value, isActual }) => (
              <div key={label}>
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-xs font-bold" style={{
                  color: isActual && event.forecast
                    ? parseFloat(value!) > parseFloat(event.forecast!) ? '#059669' : '#ef4444'
                    : '#374151'
                }}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [selectedDate, setSelectedDate]     = useState(new Date('2026-02-02'))
  const [selectedImpact, setSelectedImpact] = useState<EventImpact|'all'>('all')
  const [selectedCurrency, setSelectedCurrency] = useState('all')
  const [showFilters, setShowFilters]       = useState(true)

  const cm = selectedDate.getMonth(); const cy = selectedDate.getFullYear()

  const monthEvents = useMemo(() => MOCK_EVENTS.filter(e => {
    const d = new Date(e.date); return d.getMonth()===cm && d.getFullYear()===cy
  }), [cm, cy])

  const todayEvents = useMemo(() => {
    const ds = selectedDate.toISOString().split('T')[0]
    return MOCK_EVENTS.filter(e =>
      e.date === ds &&
      (selectedImpact==='all' || e.impact===selectedImpact) &&
      (selectedCurrency==='all' || e.currency===selectedCurrency)
    )
  }, [selectedDate, selectedImpact, selectedCurrency])

  const currencies = ['all', ...Array.from(new Set(MOCK_EVENTS.map(e=>e.currency))).sort()]
  const highCount  = todayEvents.filter(e=>e.impact==='high').length

  return (
    <div className="min-h-screen bg-gray-50">
      <PageNavbar title="Economic Calendar" subtitle="Kalender ekonomi global" />

      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 pb-20">

        {/* Hero */}
        <div className="py-10 sm:py-12 lg:py-16 text-center">
          <Reveal variants={scaleIn}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 mb-5">
              <CalendarIcon className="w-3 h-3 text-gray-500"/>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Kalender Ekonomi</span>
            </div>
          </Reveal>
          <AnimatedHeadline text="Pantau event pasar global setiap hari"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            style={{ letterSpacing:'-0.04em', lineHeight:1.1 }} />
          <Reveal delay={0.3}>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Jadwal lengkap rilis data ekonomi penting dari seluruh dunia.
              Persiapkan strategi trading Anda sebelum event high-impact terjadi.
            </p>
          </Reveal>
        </div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12"
          variants={stagger(0.1)} initial="hidden" whileInView="visible"
          viewport={{ once:true, margin:'-60px' }}>
          {[
            { label:'Event Hari Ini', value:todayEvents.length, color:'#2563eb' },
            { label:'High Impact',    value:highCount,           color:'#ef4444' },
            { label:'Mata Uang',      value:8,                   color:'#7c3aed' },
            { label:'Event / Bulan',  value:'35+',               color:'#059669' },
          ].map(s => (
            <motion.div key={s.label} variants={fadeUp}
              className="bg-white rounded-2xl p-4 sm:p-5 text-center"
              style={{ border:'1px solid #f0f0f0' }}
              whileHover={{ y:-3, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', transition:{ duration:0.2 } }}>
              <p className="text-lg sm:text-xl font-bold mb-1" style={{ color:s.color, letterSpacing:'-0.02em' }}>{s.value}</p>
              <p className="text-[11px] text-gray-400">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">

          {/* Sidebar */}
          <div className="space-y-4">
            <MiniCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} monthEvents={monthEvents} />

            {/* Filters */}
            <motion.div className="bg-white rounded-2xl p-4" style={{ border:'1px solid #f0f0f0' }}
              initial="hidden" whileInView="visible" viewport={{ once:true }} variants={fadeUp}>
              <button onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-gray-400"/>
                  <span className="text-xs font-bold text-gray-700">Filter</span>
                </div>
                <motion.span animate={{ rotate:showFilters?180:0 }} transition={{ duration:0.25 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400"/>
                </motion.span>
              </button>
              <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                    exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }} style={{ overflow:'hidden' }}>
                    <div className="space-y-3 pt-1">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Impact Level</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(['all','high','medium','low'] as const).map(imp => {
                            const active = selectedImpact === imp
                            const m = imp !== 'all' ? IMPACT[imp] : null
                            return (
                              <motion.button key={imp}
                                onClick={() => setSelectedImpact(imp)}
                                className="py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{
                                  background: active ? (m ? m.light : '#f3f4f6') : '#f9fafb',
                                  color:      active ? (m ? m.accent : '#374151') : '#9ca3af',
                                  border:     `1px solid ${active ? (m ? m.border : '#e5e7eb') : '#f0f0f0'}`,
                                }}
                                whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
                                {imp.charAt(0).toUpperCase()+imp.slice(1)}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Mata Uang</p>
                        <select value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none"
                          style={{ border:'1px solid #f0f0f0', background:'#fafafa' }}>
                          {currencies.map(c => <option key={c} value={c}>{c==='all'?'Semua':c}</option>)}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Legend */}
            <Reveal>
              <div className="bg-white rounded-2xl p-4" style={{ border:'1px solid #f0f0f0' }}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Legend Impact</p>
                <motion.div className="space-y-2.5"
                  variants={stagger(0.08)} initial="hidden" whileInView="visible" viewport={{ once:true }}>
                  {(['high','medium','low'] as EventImpact[]).map(imp => {
                    const m = IMPACT[imp]
                    return (
                      <motion.div key={imp} variants={fadeLeft} className="flex items-center gap-2.5">
                        <motion.div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:m.accent }}
                          initial={{ scale:0 }} whileInView={{ scale:1 }} viewport={{ once:true }} transition={{ ...SPRING }}/>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-700">{m.label} Impact</p>
                          <p className="text-[10px] text-gray-400">
                            {imp==='high' ? 'Penggerak pasar utama' : imp==='medium' ? 'Volatilitas sedang' : 'Efek minor'}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </div>
            </Reveal>
          </div>

          {/* Events List */}
          <div>
            <SectionLabel
              title={selectedDate.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
              subtitle={`${todayEvents.length} event terjadwal · ${highCount} high impact`} />

            <AnimatePresence mode="wait">
              {todayEvents.length === 0 ? (
                <motion.div key="empty"
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  className="bg-white rounded-2xl p-12 text-center" style={{ border:'1px solid #f0f0f0' }}>
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-8 h-8 text-gray-300"/>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Tidak ada event</p>
                  <p className="text-xs text-gray-400">Pilih tanggal lain atau ubah filter</p>
                </motion.div>
              ) : (
                <motion.div key={selectedDate.toISOString()+selectedImpact+selectedCurrency}
                  className="space-y-3"
                  variants={stagger(0.05)} initial="hidden" animate="visible">
                  {todayEvents.map((event, i) => <EventCard key={event.id} event={event} index={i} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>
    </div>
  )
}