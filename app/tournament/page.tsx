// app/tournament/page.tsx
'use client'

import { useState } from 'react'
import {
  Trophy, Calendar, Star, TrendingUp,
  Users, DollarSign, Award, ChevronRight, Check
} from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import PageNavbar from '@/components/PageNavbar'

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

// ─── Data ──────────────────────────────────────────────────────────────────────
const STATS = [
  { label:'Total Prize Pool',  value:'$100,000+', color:'#d97706' },
  { label:'Format Turnamen',   value:'4 Tipe',    color:'#7c3aed' },
  { label:'Peserta Maks',      value:'10,000',    color:'#2563eb' },
  { label:'Status',            value:'Segera',    color:'#059669' },
]

const FEATURES = [
  { Icon:DollarSign, accent:'#059669', light:'#ecfdf5', title:'Hadiah Besar',       desc:'Prize pool jutaan rupiah untuk para pemenang terbaik' },
  { Icon:Users,      accent:'#7c3aed', light:'#faf5ff', title:'Fair Competition',  desc:'Kompetisi adil untuk semua level trader tanpa diskriminasi' },
  { Icon:Award,      accent:'#2563eb', light:'#eff6ff', title:'Live Leaderboard',  desc:'Real-time ranking dan statistik performa peserta lengkap' },
]

const EXPECTATIONS = [
  { Icon:Trophy,     accent:'#0891b2', light:'#ecfeff', title:'Multiple Tournament Types', desc:'Turnamen harian, mingguan, dan bulanan dengan berbagai kategori dan prize pool berbeda.' },
  { Icon:TrendingUp, accent:'#059669', light:'#ecfdf5', title:'Real-Time Rankings',        desc:'Pantau posisi Anda di leaderboard secara real-time dan lihat statistik performa lengkap.' },
  { Icon:Star,       accent:'#7c3aed', light:'#faf5ff', title:'Exclusive Rewards',         desc:'Dapatkan hadiah menarik, bonus, dan privilege khusus untuk para pemenang.' },
  { Icon:Users,      accent:'#d97706', light:'#fffbeb', title:'Community Competition',     desc:'Berkompetisi dengan trader lain dan bangun reputasi sebagai top performer.' },
]

const FORMATS = [
  { title:'Daily Challenge',    prize:'$1,000',   period:'Harian',  participants:'Unlimited', minDeposit:'$50',    accent:'#059669', light:'#ecfdf5', border:'#a7f3d0' },
  { title:'Weekly Championship',prize:'$10,000',  period:'Mingguan',participants:'Maks 500',   minDeposit:'$100',   accent:'#2563eb', light:'#eff6ff', border:'#bfdbfe' },
  { title:'Monthly Grand Prix', prize:'$50,000',  period:'Bulanan', participants:'Maks 1000',  minDeposit:'$200',   accent:'#7c3aed', light:'#faf5ff', border:'#ddd6fe' },
  { title:'VIP Elite League',   prize:'$100,000', period:'Eksklusif',participants:'Invite Only',minDeposit:'$1,000', accent:'#d97706', light:'#fffbeb', border:'#fde68a' },
]

const FAQ = [
  { q:'Kapan turnamen akan dimulai?',                      a:'Kami akan mengumumkan jadwal turnamen pertama dalam waktu dekat. Aktifkan notifikasi untuk mendapat update terbaru.' },
  { q:'Apakah ada biaya untuk mengikuti turnamen?',        a:'Sebagian besar turnamen gratis. Beberapa turnamen premium mungkin memerlukan entry fee dengan prize pool yang lebih besar.' },
  { q:'Bagaimana cara menang?',                            a:'Pemenang ditentukan berdasarkan total profit, win rate, atau kombinasi berbagai metrik trading selama periode turnamen.' },
  { q:'Apakah bisa menggunakan akun Demo?',                a:'Turnamen tertentu tersedia untuk akun Demo sebagai latihan. Turnamen berhadiah real hanya untuk akun Real.' },
]

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TournamentPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <PageNavbar title="Trading Tournament" subtitle="Kompetisi & hadiah eksklusif" />

      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 pb-20">

        {/* Hero */}
        <div className="py-10 sm:py-12 lg:py-16 text-center">
          <Reveal variants={scaleIn}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5"
              style={{ background:'#fffbeb', border:'1px solid #fde68a' }}>
              <Trophy className="w-3 h-3 text-yellow-600"/>
              <span className="text-[11px] font-semibold text-yellow-700 uppercase tracking-widest">Segera Hadir</span>
            </div>
          </Reveal>
          <AnimatedHeadline text="Buktikan dirimu sebagai trader terbaik"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            style={{ letterSpacing:'-0.04em', lineHeight:1.1 }} />
          <Reveal delay={0.3}>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Tidak ada turnamen yang sedang berlangsung saat ini. Kami sedang mempersiapkan
              kompetisi trading terbesar dengan hadiah fantastis — nantikan pengumuman resmi kami.
            </p>
          </Reveal>
        </div>

        {/* Stats Strip */}
        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12"
          variants={stagger(0.1)} initial="hidden" whileInView="visible"
          viewport={{ once:true, margin:'-60px' }}>
          {STATS.map(s => (
            <motion.div key={s.label} variants={fadeUp}
              className="bg-white rounded-2xl p-4 sm:p-5 text-center"
              style={{ border:'1px solid #f0f0f0' }}
              whileHover={{ y:-3, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', transition:{ duration:0.2 } }}>
              <p className="text-lg sm:text-xl font-bold mb-1" style={{ color:s.color, letterSpacing:'-0.02em' }}>{s.value}</p>
              <p className="text-[11px] text-gray-400">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Cards */}
        <section className="mb-10 sm:mb-12">
          <SectionLabel title="Keunggulan" subtitle="Mengapa turnamen kami berbeda" />
          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            variants={stagger(0.1)} initial="hidden" whileInView="visible"
            viewport={{ once:true, margin:'-60px' }}>
            {FEATURES.map(({ Icon, accent, light, title, desc }, i) => (
              <motion.div key={i} variants={fadeUp}
                className="bg-white rounded-2xl p-5 flex flex-col gap-3"
                style={{ border:'1px solid #f0f0f0' }}
                whileHover={{ y:-5, boxShadow:`0 20px 48px ${accent}18`, transition:{ duration:0.25 } }}>
                <motion.div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background:light }}
                  initial={{ scale:0, rotate:-90 }} whileInView={{ scale:1, rotate:0 }}
                  viewport={{ once:true }} transition={{ ...SPRING, delay:i*0.1 }}>
                  <Icon className="w-5 h-5" style={{ color:accent }}/>
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-1" style={{ letterSpacing:'-0.02em' }}>{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* What to Expect */}
        <section className="mb-10 sm:mb-12">
          <SectionLabel title="Yang Bisa Kamu Harapkan" />
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border:'1px solid #f0f0f0' }}>
            {EXPECTATIONS.map(({ Icon, accent, light, title, desc }, i) => (
              <motion.div key={i}
                className="flex gap-4 p-5"
                style={{ borderTop: i>0 ? '1px solid #f8f8f8' : 'none' }}
                initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }}
                viewport={{ once:true }} transition={{ ...SPRING, delay:i*0.08 }}
                whileHover={{ backgroundColor:`${accent}05`, transition:{ duration:0.15 } }}>
                <motion.div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:light }}
                  initial={{ scale:0 }} whileInView={{ scale:1 }}
                  viewport={{ once:true }} transition={{ ...SPRING, delay:i*0.08+0.1 }}>
                  <Icon className="w-5 h-5" style={{ color:accent }}/>
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-1" style={{ letterSpacing:'-0.02em' }}>{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tournament Formats */}
        <section className="mb-10 sm:mb-12">
          <SectionLabel title="Format Turnamen" subtitle="Pilihan kompetisi untuk semua level" />
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
            variants={stagger(0.1)} initial="hidden" whileInView="visible"
            viewport={{ once:true, margin:'-60px' }}>
            {FORMATS.map((f, i) => (
              <motion.div key={i} variants={fadeUp}
                className="rounded-2xl overflow-hidden"
                style={{ border:`1px solid ${f.border}` }}
                whileHover={{ y:-5, boxShadow:`0 20px 48px ${f.accent}20`, transition:{ duration:0.25 } }}>
                <motion.div className="h-1.5"
                  style={{ background:`linear-gradient(90deg, ${f.accent}, ${f.accent}88)` }}
                  initial={{ scaleX:0, originX:0 }} whileInView={{ scaleX:1 }}
                  viewport={{ once:true }} transition={{ duration:0.6, delay:i*0.1, ease:'easeOut' }} />
                <div className="p-5" style={{ background:f.light }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 mb-1" style={{ letterSpacing:'-0.02em' }}>{f.title}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background:`${f.accent}20`, color:f.accent }}>
                        Coming Soon
                      </span>
                    </div>
                    <motion.div className="text-right"
                      initial={{ opacity:0, scale:0.5 }} whileInView={{ opacity:1, scale:1 }}
                      viewport={{ once:true }} transition={{ ...SPRING, delay:i*0.1+0.3 }}>
                      <p className="text-2xl font-black" style={{ color:f.accent, letterSpacing:'-0.04em' }}>{f.prize}</p>
                      <p className="text-[10px] text-gray-400">prize pool</p>
                    </motion.div>
                  </div>
                  <motion.div className="grid grid-cols-3 gap-2"
                    variants={stagger(0.06)} initial="hidden" whileInView="visible" viewport={{ once:true }}>
                    {[
                      { label:'Periode',    value:f.period },
                      { label:'Peserta',    value:f.participants },
                      { label:'Min Deposit',value:f.minDeposit },
                    ].map(({ label, value }) => (
                      <motion.div key={label} variants={scaleIn}
                        className="rounded-xl p-2.5 bg-white" style={{ border:'1px solid #f0f0f0' }}>
                        <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                        <p className="text-[11px] font-bold text-gray-700 leading-snug">{value}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* FAQ */}
        <section>
          <SectionLabel title="Pertanyaan Umum" subtitle="Hal-hal yang sering ditanyakan tentang turnamen" />
          <motion.div className="space-y-2"
            variants={stagger(0.07)} initial="hidden" whileInView="visible"
            viewport={{ once:true, margin:'-40px' }}>
            {FAQ.map((item, i) => (
              <motion.div key={i} variants={fadeUp}
                className="bg-white rounded-xl overflow-hidden" style={{ border:'1px solid #f0f0f0' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-semibold text-gray-800 pr-4">{item.q}</span>
                  <motion.span animate={{ rotate: openFaq===i ? 90 : 0 }} transition={{ duration:0.25 }} className="flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-gray-400"/>
                  </motion.span>
                </button>
                <motion.div initial={false}
                  animate={{ height: openFaq===i ? 'auto' : 0, opacity: openFaq===i ? 1 : 0 }}
                  transition={{ duration:0.3, ease:[0.04,0.62,0.23,0.98] }}
                  style={{ overflow:'hidden' }}>
                  <div className="px-4 sm:px-5 pb-4" style={{ borderTop:'1px solid #f5f5f5' }}>
                    <p className="text-xs text-gray-500 leading-relaxed pt-3">{item.a}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </section>

      </main>
    </div>
  )
}