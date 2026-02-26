// app/support/page.tsx
'use client'

import { useState } from 'react'
import {
  MessageCircle, Mail, Phone, Clock,
  Headphones, Send, Check, ChevronRight, Zap
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
const CONTACT_METHODS = [
  {
    Icon:      Mail,
    accent:    '#2563eb',
    accentDark:'#1d4ed8',
    light:     '#eff6ff',
    border:    '#bfdbfe',
    title:     'Email Support',
    desc:      'Kirim pertanyaan detail via email — kami akan membalas sesegera mungkin',
    contact:   'sanzystoreid@gmail.com',
    availability:'Respon dalam 2 jam',
    action:    'Send Email',
    href:      'mailto:sanzystoreid@gmail.com',
    badge:     null,
  },
  {
    Icon:      Phone,
    accent:    '#059669',
    accentDark:'#047857',
    light:     '#ecfdf5',
    border:    '#a7f3d0',
    title:     'WhatsApp',
    desc:      'Chat langsung dengan tim support kami via WhatsApp kapan saja',
    contact:   '+62 813-3990-8765',
    availability:'24/7 Tersedia',
    action:    'Chat on WhatsApp',
    href:      'https://wa.me/6281339908765',
    badge:     'Tercepat',
  },
]

const STATS = [
  { label:'Waktu Respons Email',    value:'< 2 Jam',  color:'#2563eb' },
  { label:'Waktu Respons WhatsApp', value:'Instan',   color:'#059669' },
  { label:'Jam Operasional',        value:'24/7',     color:'#7c3aed' },
  { label:'Kepuasan Pengguna',      value:'98%',      color:'#d97706' },
]

const PERKS = [
  { label:'Dukungan dalam Bahasa Indonesia',     desc:'Tim kami siap membantu dalam bahasa yang Anda pahami' },
  { label:'Solusi untuk semua pertanyaan trading', desc:'Dari deposit, withdrawal, hingga teknis platform' },
  { label:'Kerahasiaan data terjamin',            desc:'Semua percakapan bersifat rahasia dan aman' },
  { label:'Follow-up hingga masalah terselesaikan', desc:'Kami tidak berhenti sampai masalah Anda teratasi' },
]

const FAQ = [
  { q:'Berapa lama waktu respons support?',         a:'Untuk WhatsApp biasanya direspons dalam hitungan menit. Email biasanya direspons dalam 2 jam di jam kerja.' },
  { q:'Masalah apa saja yang bisa dibantu?',        a:'Kami membantu semua masalah terkait akun: deposit, withdrawal, verifikasi, masalah teknis platform, dan pertanyaan umum trading.' },
  { q:'Apakah support tersedia di hari libur?',     a:'Ya. WhatsApp kami aktif 24/7 termasuk hari libur nasional. Email mungkin sedikit lebih lama saat hari libur.' },
  { q:'Bagaimana jika masalah tidak segera teratasi?', a:'Kami akan terus mem-follow up hingga masalah Anda benar-benar terselesaikan. Tidak ada ticket yang dibiarkan terbuka tanpa resolusi.' },
]

// ─── Contact Card ───────────────────────────────────────────────────────────────
function ContactCard({ method, index }: { method: typeof CONTACT_METHODS[0]; index: number }) {
  const { Icon, accent, accentDark, light, border, title, desc, contact, availability, action, href, badge } = method
  return (
    <motion.div
      variants={{ hidden:{ opacity:0, y:20 }, visible:{ opacity:1, y:0, transition:{ ...SPRING, delay:index*0.12 } } }}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ border:`1px solid ${border}` }}
      whileHover={{ y:-5, boxShadow:`0 20px 48px ${accent}20`, transition:{ duration:0.25 } }}>

      {/* Accent bar */}
      <motion.div className="h-1.5"
        style={{ background:`linear-gradient(90deg, ${accent}, ${accentDark})` }}
        initial={{ scaleX:0, originX:0 }} whileInView={{ scaleX:1 }}
        viewport={{ once:true }} transition={{ duration:0.6, delay:index*0.12, ease:'easeOut' }}/>

      <div className="p-5 sm:p-6 flex flex-col flex-1" style={{ background:light }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <motion.div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background:`${accent}15`, border:`1px solid ${accent}20` }}
            initial={{ scale:0, rotate:-90 }} whileInView={{ scale:1, rotate:0 }}
            viewport={{ once:true }} transition={{ ...SPRING, delay:index*0.12+0.1 }}>
            <Icon className="w-6 h-6" style={{ color:accent }}/>
          </motion.div>
          {badge && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background:`${accent}15`, color:accent }}>
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-1.5" style={{ letterSpacing:'-0.02em' }}>{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">{desc}</p>

        {/* Contact info */}
        <div className="rounded-xl px-4 py-3 mb-4 bg-white" style={{ border:'1px solid #f0f0f0' }}>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Kontak</p>
          <p className="text-sm font-bold text-gray-700">{contact}</p>
        </div>

        {/* Availability */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-5">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color:accent }}/>
          <span style={{ color:accent }} className="font-semibold">{availability}</span>
        </div>

        {/* CTA */}
        <motion.a href={href}
          className="block w-full py-3 rounded-xl text-center text-sm font-bold text-white mt-auto"
          style={{ background:`linear-gradient(135deg, ${accent}, ${accentDark})` }}
          whileHover={{ scale:1.02, boxShadow:`0 8px 24px ${accent}40` }}
          whileTap={{ scale:0.98 }}>
          {action}
        </motion.a>
      </div>
    </motion.div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number|null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <PageNavbar title="Support Center" subtitle="Tim support siap membantu Anda 24/7" />

      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 pb-20">

        {/* Hero */}
        <div className="py-10 sm:py-12 lg:py-16 text-center">
          <Reveal variants={scaleIn}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 mb-5">
              <Headphones className="w-3 h-3 text-gray-500"/>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Support Center</span>
            </div>
          </Reveal>
          <AnimatedHeadline text="Kami siap membantu kamu kapan saja"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            style={{ letterSpacing:'-0.04em', lineHeight:1.1 }} />
          <Reveal delay={0.3}>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Tim support kami tersedia 24/7 untuk menjawab pertanyaan dan membantu
              menyelesaikan setiap masalah — dari deposit hingga pertanyaan teknis trading.
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

        {/* Contact Cards */}
        <section className="mb-10 sm:mb-12">
          <SectionLabel title="Hubungi Kami" subtitle="Pilih cara yang paling nyaman untukmu" />
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
            variants={stagger(0.12)} initial="hidden" whileInView="visible"
            viewport={{ once:true, margin:'-60px' }}>
            {CONTACT_METHODS.map((m, i) => <ContactCard key={m.title} method={m} index={i} />)}
          </motion.div>
        </section>

        {/* Why Choose Our Support */}
        <section className="mb-10 sm:mb-12">
          <SectionLabel title="Komitmen Kami" subtitle="Yang membuat support kami berbeda" />
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border:'1px solid #f0f0f0' }}>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-0"
              variants={stagger(0.08)} initial="hidden" whileInView="visible"
              viewport={{ once:true, margin:'-60px' }}>
              {PERKS.map((perk, i) => (
                <motion.div key={i} variants={fadeUp}
                  className="flex items-start gap-3 p-5"
                  style={{
                    borderRight:  i%2===0 && i<3 ? '1px solid #f8f8f8' : 'none',
                    borderBottom: i < 2 ? '1px solid #f8f8f8' : 'none',
                  }}
                  whileHover={{ backgroundColor:'#f9fafb', transition:{ duration:0.15 } }}>
                  <motion.div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background:'#f0fdf4' }}
                    initial={{ scale:0 }} whileInView={{ scale:1 }}
                    viewport={{ once:true }} transition={{ ...SPRING, delay:i*0.08 }}>
                    <Check className="w-4 h-4 text-emerald-600"/>
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 mb-1" style={{ letterSpacing:'-0.01em' }}>{perk.label}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{perk.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Quick Access CTA */}
        <section className="mb-10 sm:mb-12">
          <SectionLabel title="Butuh Bantuan Cepat?" />
          <Reveal>
            <div className="bg-white rounded-2xl p-6 sm:p-8" style={{ border:'1px solid #f0f0f0' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <motion.div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:'#ecfdf5' }}
                  initial={{ scale:0, rotate:-90 }} whileInView={{ scale:1, rotate:0 }}
                  viewport={{ once:true }} transition={{ ...SPRING }}>
                  <Zap className="w-6 h-6 text-emerald-600"/>
                </motion.div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800 mb-1" style={{ letterSpacing:'-0.02em' }}>
                    Untuk respons paling cepat, gunakan WhatsApp
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Tim support kami siap membantu semua pertanyaan seputar trading, deposit, withdrawal, dan lainnya.
                  </p>
                </div>
                <div className="flex gap-2.5 flex-shrink-0 w-full sm:w-auto">
                  <motion.a href="https://wa.me/6281339908765"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white"
                    style={{ background:'linear-gradient(135deg, #059669, #047857)' }}
                    whileHover={{ scale:1.03, boxShadow:'0 8px 20px rgba(5,150,105,0.3)' }}
                    whileTap={{ scale:0.97 }}>
                    <Phone className="w-3.5 h-3.5"/> WhatsApp
                  </motion.a>
                  <motion.a href="mailto:sanzystoreid@gmail.com"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700"
                    style={{ border:'1px solid #f0f0f0', background:'#fff' }}
                    whileHover={{ scale:1.03, boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}
                    whileTap={{ scale:0.97 }}>
                    <Send className="w-3.5 h-3.5"/> Email
                  </motion.a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Roadmap / How it works */}
        <section className="mb-10 sm:mb-12">
          <SectionLabel title="Cara Kerja" subtitle="Proses bantuan yang sederhana dan cepat" />
          <motion.div className="grid grid-cols-1 sm:grid-cols-4 gap-4"
            variants={stagger(0.1)} initial="hidden" whileInView="visible"
            viewport={{ once:true, margin:'-60px' }}>
            {[
              { n:'01', title:'Pilih metode kontak', desc:'Hubungi kami via WhatsApp atau email sesuai preferensi.' },
              { n:'02', title:'Jelaskan masalah',    desc:'Ceritakan masalah Anda secara detail agar bisa dibantu lebih cepat.' },
              { n:'03', title:'Tim merespons',       desc:'Support kami akan merespons dan mencari solusi terbaik.' },
              { n:'04', title:'Masalah terselesaikan', desc:'Kami memastikan masalah Anda benar-benar teratasi.' },
            ].map((step, i) => (
              <motion.div key={i}
                variants={{ hidden:{ opacity:0, y:32 }, visible:{ opacity:1, y:0, transition:{ ...SPRING, delay:i*0.1 } } }}
                className="bg-white rounded-2xl p-5"
                style={{ border:'1px solid #f0f0f0' }}
                whileHover={{ y:-4, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', transition:{ duration:0.2 } }}>
                <motion.p className="text-2xl font-black text-gray-100 mb-3"
                  style={{ letterSpacing:'-0.04em' }}
                  initial={{ opacity:0, x:-10 }} whileInView={{ opacity:1, x:0 }}
                  viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.1+0.2 }}>
                  {step.n}
                </motion.p>
                <p className="text-sm font-bold text-gray-800 mb-1.5">{step.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* FAQ */}
        <section>
          <SectionLabel title="Pertanyaan Umum" subtitle="Hal-hal yang sering ditanyakan" />
          <motion.div className="space-y-2"
            variants={stagger(0.07)} initial="hidden" whileInView="visible"
            viewport={{ once:true, margin:'-40px' }}>
            {FAQ.map((item, i) => (
              <motion.div key={i} variants={fadeUp}
                className="bg-white rounded-xl overflow-hidden" style={{ border:'1px solid #f0f0f0' }}>
                <button onClick={() => setOpenFaq(openFaq===i ? null : i)}
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