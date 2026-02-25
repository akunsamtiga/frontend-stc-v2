// app/copytrading-agreement/PageClient.tsx
'use client'

import { useState, useRef } from 'react'
import PageNavbar from '@/components/PageNavbar'
import { Menu, X, Scale, AlertTriangle, ChevronDown, Copy, TrendingUp, Shield, Clock, DollarSign } from 'lucide-react'
import {
  motion,
  AnimatePresence,
  useInView,
  type Variants,
} from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Clause {
  id: string
  text: string
  subItems?: string[]
}

interface Section {
  id: string
  num: string
  title: string
  color: string
  clauses: Clause[]
}

// ─── Motion config ─────────────────────────────────────────────────────────────

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

// ─── Reveal wrapper ────────────────────────────────────────────────────────────

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

// ─── Word-by-word headline ─────────────────────────────────────────────────────

function AnimatedHeadline({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const words = text.split(' ')
  return (
    <motion.h1 className={className} style={style}
      variants={stagger(0.07)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
      {words.map((word, i) => (
        <motion.span key={i} variants={{
          hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
          visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...SPRING } },
        }} className="inline-block mr-[0.25em]">{word}</motion.span>
      ))}
    </motion.h1>
  )
}

// ─── Count-up ─────────────────────────────────────────────────────────────────

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [val, setVal] = useState(0)
  const triggered = useRef(false)
  if (inView && !triggered.current) {
    triggered.current = true
    let start: number
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 900, 1)
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  return <span ref={ref}>{val}{suffix}</span>
}

// ─── Section label ─────────────────────────────────────────────────────────────

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

// ─── Data ─────────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: 'ketentuan-umum', num: '1', title: 'Ketentuan Umum', color: '#2563eb',
    clauses: [
      { id: '1.1', text: 'Klien menerima Perjanjian Copy Trading ini dengan mulai menggunakan layanan Copy Trading. Penerimaan Perjanjian berarti persetujuan penuh dan tanpa syarat dari Klien terhadap syarat dan ketentuannya.' },
      { id: '1.2', text: 'Perjanjian Copy Trading ini berfungsi sebagai pelengkap Perjanjian Klien stouch dan merupakan bagian yang tidak terpisahkan darinya. Semua syarat dan ketentuan yang termasuk dalam Perjanjian Copy Trading ini harus dibaca bersama dengan Perjanjian Klien stouch. Jika terjadi perbedaan antara Perjanjian Copy Trading dan Perjanjian Klien stouch, maka ketentuan Perjanjian Copy Trading ini akan berlaku.' },
      { id: '1.3', text: 'Copy Trading hanya tersedia di Website dan hanya di Akun Riil.' },
      { id: '1.4', text: 'Copy Trading hanya tersedia untuk Fixed Time Trades (FTT).' },
    ],
  },
  {
    id: 'terminologi', num: '2', title: 'Terminologi', color: '#059669',
    clauses: [
      { id: '2.1', text: 'Trader yang Disalin adalah Klien yang diundang oleh Perusahaan untuk menjadi trader yang disalin dan diizinkan untuk menyalin Perdagangan mereka.' },
      { id: '2.2', text: 'Kartu Copy Trading (Kartu) adalah satu bagian dari Akun Pribadi Klien di mana pengaturan dan statistik Copy Trading ditampilkan.' },
      { id: '2.3', text: 'Copy Trade adalah Perdagangan yang dibuka di Akun Trader sebagai hasil dari menyalin Perdagangan Trader yang Disalin.' },
      { id: '2.4', text: 'Trader adalah Klien yang mulai menyalin Perdagangan Trader yang Disalin.' },
      { id: '2.5', text: 'Menyalin Perdagangan (Menyalin) berarti mereplikasi Perdagangan di Akun Trader dengan parameter yang sama dengan Perdagangan Trader yang Disalin.' },
    ],
  },
  {
    id: 'memilih-trader', num: '3', title: 'Memilih Trader yang Disalin', color: '#7c3aed',
    clauses: [
      { id: '3.1', text: 'Untuk memilih Trader yang Disalin untuk Disalin, Trader dapat menggunakan papan peringkat Trader yang Disalin di Website.' },
      { id: '3.2', text: 'Papan peringkat Trader yang Disalin berisi informasi berikut tentang Trader yang Disalin:', subItems: ['nama panggilan (jika ada) atau ID trader', 'bendera negara pendaftaran', 'status di Platform Trading', 'profitabilitas', 'tingkat komisi', 'jumlah Perdagangan Trader yang Disalin yang disalin oleh Trader', 'keuntungan selama tujuh hari terakhir', 'kerugian selama tujuh hari terakhir', 'riwayat Perdagangan yang menguntungkan selama tujuh hari terakhir'] },
      { id: '3.3', text: 'Klien memilih untuk menyalin atau tidak menyalin Perdagangan Trader yang Disalin secara sukarela dan atas kebijakannya sendiri. Semua keputusan tersebut merupakan masalah pribadi setiap Klien dan dibuat tanpa rekomendasi atau saran dari Perusahaan.' },
      { id: '3.4', text: 'Trader dapat menyalin Perdagangan dari Trader yang Disalin dalam jumlah tak terbatas.' },
    ],
  },
  {
    id: 'awal-penyalinan', num: '4', title: 'Awal Penyalinan', color: '#d97706',
    clauses: [
      { id: '4.1', text: 'Untuk mulai Menyalin Perdagangan Trader yang Disalin, Klien harus menekan tombol \'Mulai menyalin\' di Kartu Trader yang Disalin.' },
      { id: '4.2', text: 'Saat mulai menyalin Perdagangan Trader yang Disalin, Trader harus mencantumkan:', subItems: ['jumlah maksimum investasi Trader dalam satu Copy Trade dalam Penyalinan ini', 'jumlah maksimum Copy Trade dalam Penyalinan ini', 'batas kerugian dalam Penyalinan ini'] },
      { id: '4.3', text: 'Jumlah maksimum Copy Trade dalam satu kali Penyalinan tidak boleh melebihi lima puluh (50) Perdagangan.' },
    ],
  },
  {
    id: 'pembukaan-penutupan', num: '5', title: 'Pembukaan dan Penutupan Copy Trade', color: '#0891b2',
    clauses: [
      { id: '5.1', text: 'Copy Trade dibuka dan ditutup secara otomatis tanpa konsultasi, kesepakatan, atau persetujuan sebelumnya.' },
      { id: '5.2', text: 'Hanya Perdagangan Trader yang Disalin yang dibuka setelah Trader mulai menyalin Perdagangan Trader yang Disalin yang disalin.' },
      { id: '5.3', text: 'Kecuali ditentukan lain di sini, Copy Trade memiliki parameter yang sama dengan Perdagangan Trader yang Disalin.' },
      { id: '5.4', text: 'Jika investasi Trader yang Disalin dalam Perdagangan lebih besar dari jumlah maksimum investasi Trader dalam satu Copy Trade yang ditentukan oleh Trader, dan/atau lebih besar dari Saldo Akun Trader, dan/atau lebih besar dari selisih antara batas kerugian yang ditentukan oleh Trader dan kerugian Trader dalam Penyalinan ini, jumlah investasi Trader dalam Copy Trade sama dengan jumlah yang lebih kecil di antara ketiganya.' },
      { id: '5.5', text: 'Jika Trader yang Disalin membuka Perdagangan dengan aset yang tidak dapat diakses oleh Trader tersebut, Perdagangan tersebut tidak disalin di Akun Trader.' },
    ],
  },
  {
    id: 'akhir-penyalinan', num: '6', title: 'Akhir Penyalinan', color: '#dc2626',
    clauses: [
      { id: '6.1', text: 'Trader dapat berhenti Menyalin Perdagangan Trader yang Disalin kapan saja melalui tombol \'Berhenti menyalin\' di Kartu Trader yang Disalin.' },
      { id: '6.2', text: 'Selain itu, Penyalinan Perdagangan Trader yang Disalin berhenti secara otomatis sebagai berikut:', subItems: ['jika jumlah maksimum Copy Trade dalam Penyalinan ini yang dicantumkan oleh Trader tercapai', 'jika batas kerugian dalam Penyalinan yang dicantumkan oleh Trader tercapai', 'jika Trader yang Disalin telah membatasi Penyalinan Perdagangannya', 'jika Trader yang Disalin telah dihapus dari papan peringkat Trader yang Disalin', 'jika Saldo Akun Trader kurang dari jumlah minimum investasi Klien dalam suatu Perdagangan'] },
      { id: '6.3', text: 'Ketika Penyalinan berhenti, semua Copy Trade yang Terbuka ditutup setelah mencapai waktu penutupan. Perdagangan Trader yang Disalin yang baru tidak disalin ke Akun Trader.' },
    ],
  },
  {
    id: 'komisi', num: '7', title: 'Komisi', color: '#db2777',
    clauses: [
      { id: '7.1', text: 'Trader membayar komisi untuk setiap Copy Trade yang menguntungkan.' },
      { id: '7.2', text: 'Komisi dihitung sebagai persentase dari keuntungan Trader dalam Copy Trade tersebut.' },
      { id: '7.3', text: 'Besaran komisi tertera pada Kartu Copy Trading Trader yang Disalin dan tidak dapat diubah sebelum akhir Penyalinan. Besaran komisi tidak boleh melebihi 30% dari keuntungan Trader dalam Copy Trade.' },
      { id: '7.4', text: 'Komisi dipotong secara otomatis dari keuntungan Trader.' },
    ],
  },
  {
    id: 'hak-kewajiban', num: '8', title: 'Hak dan Kewajiban Perusahaan dan Trader', color: '#475569',
    clauses: [
      { id: '8.1', text: 'Trader harus memastikan bahwa mereka mematuhi semua hukum dan peraturan yang berlaku mengenai Copy Trading.' },
      { id: '8.2', text: 'Trader harus mengevaluasi semua risiko keuangan sebelum menggunakan Copy Trading.' },
      { id: '8.3', text: 'Perusahaan berhak:', subItems: ['untuk menetapkan dan/atau mengubah batasan jumlah Copy Trade dalam satu Penyalinan, jumlah Trader yang Disalin yang Perdagangannya dapat disalin oleh Trader tersebut, dan jenis batasan lainnya', 'atas kebijakannya sendiri, untuk menghentikan segala bentuk Penyalinan', 'atas kebijakannya sendiri, untuk mengubah fungsionalitas, menangguhkan atau menghentikan penyediaan layanan Copy Trading', 'atas kebijakannya sendiri, untuk menangguhkan atau mengakhiri Perjanjian Copy Trading ini'] },
    ],
  },
  {
    id: 'pengungkapan-risiko', num: '9', title: 'Pengungkapan Risiko', color: '#ef4444',
    clauses: [
      { id: '9.1', text: 'Trader sepenuhnya mengakui hal-hal berikut:', subItems: ['Copy Trading melibatkan peningkatan risiko. Dengan menggunakan Copy Trading, Trader mungkin mengalami kerugian finansial yang serius, atau kehilangan seluruh dana di Akun mereka', 'Trader yang Disalin bukan merupakan perwakilan dan/atau mitra Perusahaan', 'tingkat keuntungan Trader yang Disalin saat ini tidak menjamin hasil sukses mereka di masa mendatang', 'penyediaan layanan Copy Trading bukan merupakan nasihat investasi', 'Trader yang Disalin dapat membatasi Penyalinan Perdagangan mereka kapan saja', 'Trader yang Disalin dapat dihapus dari papan peringkat Trader yang Disalin kapan saja', 'jika Trader tidak memiliki akses ke semua aset yang tersedia bagi Trader yang Disalin, Trader dapat memperoleh hasil yang secara material berbeda', 'Copy Trading mungkin dibatasi atau tidak tersedia di yurisdiksi tertentu', 'merupakan tanggung jawab Trader sepenuhnya untuk memastikan dan mematuhi hukum dan persyaratan setempat terkait Copy Trading'] },
      { id: '9.2', text: 'Trader menggunakan Copy Trading dengan risiko mereka sendiri. Saat memulai menggunakan Copy Trading, Trader bertanggung jawab atas kemungkinan kerugian finansial seperti:', subItems: ['kemungkinan kerugian, keuntungan yang hilang, dan lain-lain, yang mungkin timbul ketika menyalin Perdagangan dari satu atau lebih Trader yang Disalin', 'risiko yang terkait dengan kurangnya pengalaman Copy Trader yang tidak memiliki keterampilan, pengalaman, dan/atau pendidikan yang diperlukan', 'risiko Trader yang Menyalin tidak dapat mengakses Platform Trading karena alasan objektif atau subjektif', 'risiko kemungkinan klaim oleh otoritas pajak dan keuangan di yurisdiksi tempat Trader berada'] },
    ],
  },
  {
    id: 'jaminan-kewajiban', num: '10', title: 'Jaminan dan Kewajiban', color: '#0ea5e9',
    clauses: [
      { id: '10.1', text: 'Perusahaan tidak menyatakan atau menjamin kinerja Trader yang Disalin dan/atau terulangnya hasil masa lalu yang telah diperoleh oleh Trader yang Disalin.' },
      { id: '10.2', text: 'Perusahaan tidak bertanggung jawab atas segala kerugian langsung, tidak langsung, atau konsekuensial, atau segala kerugian lain yang mungkin dialami Trader akibat penggunaan Copy Trading.' },
      { id: '10.3', text: 'Penggunaan Copy Trading merupakan pilihan Klien. Memutuskan apakah akan menyalin Perdagangan dan menyalin Perdagangan dari Trader yang Disalin tertentu adalah tanggung jawab Klien.' },
      { id: '10.4', text: 'Perusahaan memberikan instruksi tentang Copy Trading untuk tujuan informasi saja. Jika Trader membuat keputusan berdasarkan informasi yang disediakan di Website, mereka melakukannya atas risiko mereka sendiri.' },
      { id: '10.5', text: 'Apabila terjadi pelanggaran Perjanjian Copy Trading ini oleh Trader dan/atau jika Perusahaan mencurigai bahwa Trader mencoba mengeksploitasi kelemahan fungsional, dan/atau melakukan kegiatan penipuan atau jahat, Perusahaan berhak untuk melarang Trader dan mengakhiri Perjanjian ini segera.' },
    ],
  },
  {
    id: 'amandemen', num: '11', title: 'Amandemen dan Pengakhiran', color: '#d97706',
    clauses: [
      { id: '11.1', text: 'Kewajiban dan hak Trader dan Perusahaan yang ditetapkan oleh Perjanjian Copy Trading ini dianggap sebagai tindakan jangka panjang dan berlaku sampai dengan berakhirnya Perjanjian Copy Trading ini atau Perjanjian Klien stouch.' },
      { id: '11.2', text: 'Trader berhak untuk mengakhiri Perjanjian Copy Trading ini kapan saja, apa pun motifnya, melalui tombol \'Berhenti menyalin\' di Kartu Copy Trading untuk semua Trader yang Disalin.' },
      { id: '11.3', text: 'Perusahaan berhak untuk mengakhiri Perjanjian ini secara sepihak kapan saja tanpa memberikan alasan.' },
      { id: '11.4', text: 'Setelah berakhirnya Perjanjian Copy Trading ini, penyalinan Perdagangan pada Akun Trader berhenti.' },
      { id: '11.5', text: 'Perusahaan memiliki kewenangan setiap saat untuk membuat perubahan pada Perjanjian Copy Trading ini. Jika ada perubahan yang dibuat pada Perjanjian, perubahan tersebut akan berlaku sejak saat teks Perjanjian yang diubah tersebut diposting di Website.' },
      { id: '11.6', text: 'Jika Trader tidak menyetujui versi Perjanjian yang telah diubah, dia harus mengakhirinya melalui tombol \'Berhenti menyalin\' di Kartu Copy Trading untuk semua Trader yang Disalin yang Perdagangan telah mulai mereka salin.' },
    ],
  },
]

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatsStrip() {
  const stats = [
    { label: 'Total Bab', color: '#2563eb', num: SECTIONS.length, suffix: ' Bab' },
    { label: 'Maks Copy Trade', color: '#059669', num: 50, suffix: ' Trade' },
    { label: 'Maks Komisi', color: '#db2777', num: 30, suffix: '%' },
    { label: 'Berlaku', color: '#d97706', num: null, value: 'Nov 2025' },
  ]
  return (
    <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12"
      variants={stagger(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
      {stats.map(s => (
        <motion.div key={s.label} variants={fadeUp}
          className="bg-white rounded-2xl p-4 sm:p-5 text-center" style={{ border: '1px solid #f0f0f0' }}
          whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.08)', transition: { duration: 0.2 } }}>
          <p className="text-lg sm:text-xl font-bold mb-1" style={{ color: s.color, letterSpacing: '-0.02em' }}>
            {s.num != null ? <CountUp to={s.num} suffix={s.suffix} /> : s.value}
          </p>
          <p className="text-[11px] text-gray-400">{s.label}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Key highlights ───────────────────────────────────────────────────────────

function KeyHighlights() {
  const items = [
    { icon: <Copy size={16} />, title: 'Maks 50 Copy Trade', desc: 'Batas maksimum per sesi penyalinan', color: '#2563eb' },
    { icon: <DollarSign size={16} />, title: 'Komisi Maks 30%', desc: 'Dipotong otomatis dari keuntungan', color: '#db2777' },
    { icon: <TrendingUp size={16} />, title: 'Hanya FTT & Akun Riil', desc: 'Tidak tersedia untuk akun demo', color: '#059669' },
    { icon: <Shield size={16} />, title: 'Risiko Ditanggung Trader', desc: 'Perusahaan tidak menjamin profit', color: '#ef4444' },
  ]
  return (
    <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10"
      variants={stagger(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
      {items.map((item, i) => (
        <motion.div key={item.title}
          variants={{ hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { ...SPRING, delay: i * 0.1 } } }}
          className="bg-white rounded-2xl p-4 sm:p-5" style={{ border: '1px solid #f0f0f0' }}
          whileHover={{ y: -4, boxShadow: `0 12px 32px ${item.color}18`, transition: { duration: 0.2 } }}>
          <motion.div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${item.color}12`, color: item.color }}
            initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
            transition={{ ...SPRING, delay: i * 0.1 + 0.2 }} whileHover={{ rotate: 10, scale: 1.1 }}>
            {item.icon}
          </motion.div>
          <p className="text-xs font-bold text-gray-800 mb-1">{item.title}</p>
          <p className="text-[11px] text-gray-400 leading-relaxed">{item.desc}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ section, index }: { section: Section; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      id={`section-${section.id}`}
      className="bg-white rounded-2xl overflow-hidden scroll-mt-20"
      style={{ border: '1px solid #f0f0f0' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...SPRING, delay: index * 0.04 }}
      whileHover={{ boxShadow: `0 8px 32px ${section.color}12`, transition: { duration: 0.25 } }}
    >
      {/* Animated top bar */}
      <motion.div className="h-0.5"
        style={{ background: `linear-gradient(90deg, ${section.color}, ${section.color}60)` }}
        initial={{ scaleX: 0, originX: 0 }} whileInView={{ scaleX: 1 }}
        viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.04 + 0.1, ease: 'easeOut' }} />

      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left hover:bg-gray-50 transition-colors">
        <motion.span
          className="text-[11px] font-black tabular-nums flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs"
          style={{ background: `linear-gradient(135deg, ${section.color}, ${section.color}cc)` }}
          initial={{ scale: 0, rotate: -90 }} whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }} transition={{ ...SPRING, delay: index * 0.04 + 0.15 }}
          whileHover={{ scale: 1.15, rotate: 5 }}>
          {section.num}
        </motion.span>
        <p className="flex-1 text-sm sm:text-[15px] font-bold text-gray-800 pr-3 leading-snug">{section.title}</p>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <motion.span className="hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${section.color}12`, color: section.color }}>
            {section.clauses.length} pasal
          </motion.span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
            <ChevronDown size={15} className="text-gray-400" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="content"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: 'hidden', borderTop: `2px solid ${section.color}18` }}>
            <motion.div variants={stagger(0.06)} initial="hidden" animate="visible">
              {section.clauses.map((clause, i) => (
                <motion.div key={clause.id} variants={fadeUp}
                  className="px-5 sm:px-6 py-4"
                  style={{ borderTop: i > 0 ? '1px solid #f9f9f9' : 'none', background: i % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                  <div className="flex gap-3 sm:gap-4">
                    <motion.span
                      className="text-[10px] font-bold flex-shrink-0 mt-0.5 w-8 sm:w-10 tabular-nums px-1.5 py-0.5 rounded h-fit"
                      style={{ color: section.color, background: `${section.color}10` }}
                      initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...SPRING, delay: i * 0.05 }}>
                      {clause.id}
                    </motion.span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 leading-relaxed">{clause.text}</p>
                      {clause.subItems && (
                        <motion.ul className="mt-2.5 space-y-1.5"
                          variants={stagger(0.04)} initial="hidden" animate="visible">
                          {clause.subItems.map((item, si) => (
                            <motion.li key={si} variants={fadeLeft} className="flex items-start gap-2.5">
                              <motion.span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                                style={{ background: `${section.color}60` }}
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                transition={{ ...SPRING, delay: si * 0.04 }} />
                              <span className="text-sm text-gray-500 leading-relaxed">{item}</span>
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── TOC desktop ──────────────────────────────────────────────────────────────

function TableOfContents({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <motion.nav className="sticky top-20 space-y-0.5"
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...SPRING, delay: 0.3 }}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Daftar Isi</p>
      <motion.div variants={stagger(0.04)} initial="hidden" animate="visible">
        {SECTIONS.map(sec => (
          <motion.button key={sec.id} variants={fadeLeft} onClick={() => onNavigate(sec.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all group"
            whileHover={{ backgroundColor: `${sec.color}08`, x: 2 }} transition={{ duration: 0.15 }}>
            <span className="text-[10px] font-black w-5 text-right flex-shrink-0 tabular-nums" style={{ color: `${sec.color}70` }}>{sec.num}</span>
            <span className="text-[11px] text-gray-500 group-hover:text-gray-800 transition-colors leading-tight truncate">{sec.title}</span>
          </motion.button>
        ))}
      </motion.div>
    </motion.nav>
  )
}

// ─── Mobile TOC ────────────────────────────────────────────────────────────────

function MobileTOC({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (id: string) => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[75vh] overflow-y-auto"
            style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            <div className="px-5 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white" style={{ borderBottom: '1px solid #f5f5f5' }}>
              <p className="text-sm font-bold text-gray-800">Daftar Isi</p>
              <motion.button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <X size={13} className="text-gray-500" />
              </motion.button>
            </div>
            <motion.div className="p-3 space-y-0.5 pb-8" variants={stagger(0.03)} initial="hidden" animate="visible">
              {SECTIONS.map(sec => (
                <motion.button key={sec.id} variants={fadeLeft}
                  onClick={() => { onNavigate(sec.id); onClose() }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left"
                  whileHover={{ backgroundColor: `${sec.color}08`, x: 4 }}>
                  <span className="text-[10px] font-black w-5 text-right flex-shrink-0 tabular-nums" style={{ color: `${sec.color}70` }}>{sec.num}</span>
                  <span className="text-sm text-gray-700 font-medium leading-tight">{sec.title}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Client page export ───────────────────────────────────────────────────────

export default function CopyTradingPageClient() {
  const [tocOpen, setTocOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`section-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => { (el.querySelector('button') as HTMLButtonElement | null)?.click() }, 400)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageNavbar title="Perjanjian Copy Trading" subtitle="Berlaku mulai 6 November 2025"
        rightSlot={
          <button onClick={() => setTocOpen(true)} className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 transition-all hover:bg-gray-100" style={{ background: '#f6f6f6' }}>
            <Menu size={13} />Isi
          </button>
        } />

      <MobileTOC open={tocOpen} onClose={() => setTocOpen(false)} onNavigate={scrollToSection} />

      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 pb-20">

        {/* Hero */}
        <div className="py-10 sm:py-12 lg:py-16">
          <Reveal variants={scaleIn}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 mb-5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Dokumen Legal Resmi</span>
            </div>
          </Reveal>

          <AnimatedHeadline text="Perjanjian Copy Trading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            style={{ letterSpacing: '-0.04em', lineHeight: 1.1 }} />

          <Reveal delay={0.3}>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-6 max-w-2xl">
              Perjanjian ini mengatur penyediaan layanan Copy Trading oleh Perusahaan kepada Kliennya.
              Merupakan bagian yang tidak terpisahkan dari Perjanjian Klien stouch dan harus dibaca bersama dengannya.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <motion.div className="flex flex-wrap gap-3" variants={stagger(0.08)} initial="hidden" animate="visible">
              {[
                { label: 'Berlaku', value: '6 November 2025' },
                { label: 'Versi', value: 'Bahasa Indonesia' },
                { label: 'Platform', value: 'Website & Akun Riil' },
                { label: 'Total Bab', value: `${SECTIONS.length} Bab` },
              ].map(({ label, value }) => (
                <motion.div key={label} variants={scaleIn}
                  className="px-3 py-2 rounded-xl bg-white" style={{ border: '1px solid #f0f0f0' }}
                  whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(0,0,0,0.07)', transition: { duration: 0.15 } }}>
                  <p className="text-[10px] text-gray-400">{label}</p>
                  <p className="text-xs font-bold text-gray-700">{value}</p>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>
        </div>

        {/* Stats strip */}
        <StatsStrip />

        {/* Key highlights */}
        <section className="mb-10 sm:mb-12">
          <SectionLabel title="Poin Utama" subtitle="Hal penting yang perlu diketahui sebelum menggunakan Copy Trading" />
          <KeyHighlights />
        </section>

        {/* Notice banner */}
        <Reveal>
          <motion.div className="rounded-2xl p-4 sm:p-5 flex items-start gap-3 mb-8"
            style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
            whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}>
            <motion.div className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0 mt-1.5"
              animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
            <div>
              <p className="text-xs font-bold text-sky-800 mb-0.5">Dokumen Pelengkap</p>
              <p className="text-xs text-sky-700 leading-relaxed">
                Perjanjian Copy Trading ini merupakan pelengkap{' '}
                <a href="/agreement" className="font-semibold underline underline-offset-2 hover:text-sky-900 transition-colors">Perjanjian Klien stouch</a>.
                Jika terjadi perbedaan antara kedua dokumen, ketentuan Perjanjian Copy Trading ini yang akan berlaku.
                Copy Trading hanya tersedia untuk Fixed Time Trades (FTT) di Akun Riil.
              </p>
            </div>
          </motion.div>
        </Reveal>

        {/* Body */}
        <div className="flex gap-8 lg:gap-10 items-start">
          <aside className="hidden lg:block w-52 xl:w-60 flex-shrink-0">
            <TableOfContents onNavigate={scrollToSection} />
          </aside>
          <div className="flex-1 min-w-0">
            <SectionLabel title="Isi Perjanjian" subtitle="Klik bab untuk membaca detail ketentuan" />

            {/* Risk warning */}
            <Reveal className="mb-3">
              <motion.div className="rounded-2xl p-4 flex items-start gap-3 mb-5"
                style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}
                whileHover={{ boxShadow: '0 8px 24px #ef444414', transition: { duration: 0.2 } }}>
                <motion.div initial={{ rotate: -10, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ ...SPRING, delay: 0.5 }}>
                  <AlertTriangle size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
                </motion.div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  <span className="font-bold">Peringatan Risiko:</span> Copy Trading melibatkan peningkatan risiko.
                  Dengan menggunakan layanan ini, Trader mungkin mengalami kerugian finansial yang serius atau kehilangan seluruh dana.
                  Tingkat keuntungan Trader yang Disalin saat ini tidak menjamin hasil sukses di masa mendatang.
                </p>
              </motion.div>
            </Reveal>

            <div className="space-y-3">
              {SECTIONS.map((section, index) => (
                <SectionCard key={section.id} section={section} index={index} />
              ))}
            </div>

            {/* Footer */}
            <Reveal className="mt-6">
              <motion.div className="rounded-2xl p-5" style={{ background: '#f8fafc', border: '1px solid #e8edf2' }}
                whileHover={{ boxShadow: '0 8px 24px rgba(0,0,0,0.06)', transition: { duration: 0.2 } }}>
                <div className="flex items-start gap-3">
                  <Scale size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Informasi Hukum</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Perjanjian ini terakhir diperbarui pada 6 November 2025. Untuk pertanyaan terkait Copy Trading, hubungi{' '}
                      <a href="mailto:support@stouch.com" className="text-blue-500 hover:underline font-medium">support@stouch.com</a>.
                    </p>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </main>
    </div>
  )
}