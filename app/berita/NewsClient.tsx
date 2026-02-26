'use client'

import { useState, useMemo } from 'react'
import {
  Newspaper, Calendar, TrendingUp, AlertCircle,
  Award, Zap, BookOpen, Search, ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import Link from 'next/link'
import PageNavbar from '@/components/PageNavbar'
import type { RSSNewsItem } from '@/types/index'

// ─── Types ─────────────────────────────────────────────────────────────────────
type NewsCategory = 'all' | 'announcement' | 'update' | 'promotion' | 'education' | 'market'

// ─── Design System ─────────────────────────────────────────────────────────────
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

// ─── Category Metadata ─────────────────────────────────────────────────────────
const CAT: Record<NewsCategory, { label: string; accent: string; light: string; border: string; icon: React.ReactNode }> = {
  all:          { label:'Semua',       accent:'#6b7280', light:'#f9fafb', border:'#e5e7eb', icon:<Newspaper  className="w-3 h-3"/> },
  announcement: { label:'Pengumuman',  accent:'#2563eb', light:'#eff6ff', border:'#bfdbfe', icon:<AlertCircle className="w-3 h-3"/> },
  update:       { label:'Update',      accent:'#7c3aed', light:'#faf5ff', border:'#ddd6fe', icon:<Zap         className="w-3 h-3"/> },
  promotion:    { label:'Promo',       accent:'#059669', light:'#ecfdf5', border:'#a7f3d0', icon:<Award       className="w-3 h-3"/> },
  education:    { label:'Edukasi',     accent:'#d97706', light:'#fffbeb', border:'#fde68a', icon:<BookOpen    className="w-3 h-3"/> },
  market:       { label:'Market',      accent:'#0891b2', light:'#ecfeff', border:'#a5f3fc', icon:<TrendingUp  className="w-3 h-3"/> },
}


// ─── News Card ─────────────────────────────────────────────────────────────────
function NewsCard({ news, index }: { news: RSSNewsItem; index: number }) {
  const meta = CAT[news.category]
  return (
    <motion.div
      variants={{ hidden:{ opacity:0, y:20 }, visible:{ opacity:1, y:0, transition:{ ...SPRING, delay:index*0.06 } } }}
      className="bg-white rounded-2xl overflow-hidden relative group flex flex-col h-full"
      style={{ border:'1px solid #f0f0f0' }}
      whileHover={{ y:-5, boxShadow:`0 20px 48px ${meta.accent}20`, transition:{ duration:0.25 } }}>

      {/* Gambar artikel */}
      {news.image ? (
        <div className="relative w-full h-44 flex-shrink-0 overflow-hidden bg-gray-100">
          <img
            src={news.image}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      ) : (
        <div className="relative h-2 flex-shrink-0">
          <motion.div className="h-full"
            style={{ background:`linear-gradient(90deg, ${meta.accent}, ${meta.accent}77)` }}
            initial={{ scaleX:0, originX:0 }} whileInView={{ scaleX:1 }}
            viewport={{ once:true }} transition={{ duration:0.5, delay:index*0.06, ease:'easeOut' }} />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Tanggal */}
        <span className="flex items-center gap-1 text-[11px] text-gray-400 mb-2">
          <Calendar className="w-3 h-3"/>{news.date}
          {news.source && news.source !== 'Fallback' && (
            <span className="ml-auto text-gray-300">{news.source}</span>
          )}
        </span>

        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 leading-snug flex-1"
          style={{ letterSpacing:'-0.02em' }}>
          {news.title}
        </h3>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">{news.excerpt}</p>

        <div className="flex items-center justify-between pt-3" style={{ borderTop:'1px solid #f5f5f5' }}>
          {news.link ? (
            <Link href={news.link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
              Baca selengkapnya <ExternalLink className="w-2.5 h-2.5"/>
            </Link>
          ) : (
            <span className="text-[11px] text-gray-400">Baca selengkapnya</span>
          )}
          <motion.div className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background:`${meta.accent}12` }}
            whileHover={{ scale:1.2, background:meta.accent }}
            transition={{ duration:0.15 }}>
            <ChevronRight className="w-3.5 h-3.5" style={{ color:meta.accent }}/>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Client Component ─────────────────────────────────────────────────────
export function NewsClient({ initialNews }: { initialNews: RSSNewsItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all')
  const [searchQuery, setSearchQuery]             = useState('')
  const [currentPage, setCurrentPage]             = useState(1)
  const PER_PAGE = 6

  const filtered = useMemo(() => initialNews.filter(n =>
    (selectedCategory === 'all' || n.category === selectedCategory) &&
    (n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     n.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [initialNews, selectedCategory, searchQuery])

  const totalPages  = Math.ceil(filtered.length / PER_PAGE)
  const currentNews = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const changeCat    = (cat: NewsCategory) => { setSelectedCategory(cat); setCurrentPage(1) }
  const changeSearch = (q: string)         => { setSearchQuery(q); setCurrentPage(1) }
  const changePage   = (p: number)         => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const pages = (): (number | string)[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages]
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageNavbar title="News & Updates" subtitle="Berita terkini dan analisis pasar" />

      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 pb-20">

        {/* Hero */}
        <div className="py-10 sm:py-12 lg:py-16 text-center">
          <Reveal variants={scaleIn}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
              <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-widest">Live dari Detik Finance</span>
            </div>
          </Reveal>
          <AnimatedHeadline text="Berita keuangan terkini langsung dari sumbernya"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            style={{ letterSpacing: '-0.04em', lineHeight: 1.1 }} />
          <Reveal delay={0.3}>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Berita dan analisis pasar terkini, diperbarui setiap hari untuk membantu kamu
              mengambil keputusan trading yang lebih cerdas.
            </p>
          </Reveal>
        </div>

        {/* Search + Filter */}
        <section className="mb-8">
          <SectionLabel title="Cari & Filter" subtitle="Temukan berita yang kamu butuhkan" />
          <Reveal>
            <div className="bg-white rounded-2xl p-4 sm:p-5" style={{ border: '1px solid #f0f0f0' }}>
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input type="text" placeholder="Cari judul atau konten berita..."
                  value={searchQuery} onChange={e => changeSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-none"
                  style={{ border: '1px solid #f0f0f0', background: '#fafafa' }} />
              </div>
              <motion.div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}
                variants={stagger(0.05)} initial="hidden" animate="visible">
                {(['all', 'announcement', 'update', 'promotion', 'education', 'market'] as NewsCategory[]).map(cat => {
                  const m = CAT[cat]; const active = selectedCategory === cat
                  return (
                    <motion.button key={cat} variants={scaleIn}
                      onClick={() => changeCat(cat)}
                      className="px-3.5 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap flex-shrink-0 flex items-center gap-1.5"
                      style={{
                        background: active ? m.accent : '#f9fafb',
                        color:      active ? '#fff'   : '#6b7280',
                        border:     `1px solid ${active ? m.accent : '#f0f0f0'}`,
                      }}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                      {cat !== 'all' && m.icon}{m.label}
                    </motion.button>
                  )
                })}
              </motion.div>
            </div>
          </Reveal>
        </section>

        {/* Grid */}
        <section className="mb-10">
          <SectionLabel title={CAT[selectedCategory].label} subtitle={`${filtered.length} artikel ditemukan`} />
          <AnimatePresence mode="wait">
            {currentNews.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid #f0f0f0' }}>
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Newspaper className="w-8 h-8 text-gray-300"/>
                </div>
                <p className="text-sm font-bold text-gray-700 mb-1">Tidak ada berita</p>
                <p className="text-xs text-gray-400 mb-4">
                  {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Coba ubah filter'}
                </p>
                {searchQuery && (
                  <motion.button onClick={() => setSearchQuery('')}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    Hapus Pencarian
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div key={`${currentPage}-${selectedCategory}`}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                variants={stagger(0.07)} initial="hidden" animate="visible">
                {currentNews.map((n, i) => <NewsCard key={n.id} news={n} index={i} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <Reveal className="flex items-center justify-center gap-1.5 mb-12">
            <motion.button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30"
              style={{ border: '1px solid #f0f0f0', background: '#fff' }}
              whileHover={currentPage !== 1 ? { scale: 1.06 } : {}} whileTap={currentPage !== 1 ? { scale: 0.94 } : {}}>
              <ChevronRight className="w-4 h-4 rotate-180 text-gray-500"/>
            </motion.button>
            {pages().map((p, i) => p === '...'
              ? <span key={`e${i}`} className="px-2 text-gray-400 text-xs">…</span>
              : <motion.button key={p} onClick={() => changePage(p as number)}
                  className="min-w-[36px] h-9 px-2 rounded-xl text-xs font-semibold"
                  style={{ background: currentPage === p ? '#374151' : '#fff', color: currentPage === p ? '#fff' : '#6b7280', border: '1px solid #f0f0f0' }}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>{p}</motion.button>
            )}
            <motion.button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}
              className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30"
              style={{ border: '1px solid #f0f0f0', background: '#fff' }}
              whileHover={currentPage !== totalPages ? { scale: 1.06 } : {}} whileTap={currentPage !== totalPages ? { scale: 0.94 } : {}}>
              <ChevronRight className="w-4 h-4 text-gray-500"/>
            </motion.button>
          </Reveal>
        )}

      </main>
    </div>
  )
}