'use client'

// app/help-center/PageClient.tsx
import { useState, useRef } from 'react'
import PageNavbar from '@/components/PageNavbar'
import {
  ChevronDown, ChevronUp, Search, X,
  Mail, MessageCircle, ChevronRight
} from 'lucide-react'
import {
  motion,
  AnimatePresence,
  useInView,
  type Variants,
} from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Article {
  title: string
  content: string
}

interface Section {
  title: string
  articles: Article[]
}

interface Category {
  id: string
  label: string
  color: string
  desc: string
  abbr: string
  sections: Section[]
}

// ─── Motion config ────────────────────────────────────────────────────────────

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

// ─── Scroll reveal wrapper ────────────────────────────────────────────────────

function Reveal({
  children,
  variants = fadeUp,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  variants?: Variants
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

// ─── Word-by-word headline ─────────────────────────────────────────────────────

function AnimatedHeadline({ text, className, style }: {
  text: string; className?: string; style?: React.CSSProperties
}) {
  const words = text.split(' ')
  return (
    <motion.h1
      className={className}
      style={style}
      variants={stagger(0.07)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
            visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...SPRING } },
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
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
    const duration = 900
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(to * eased))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  return <span ref={ref}>{val}{suffix}</span>
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Reveal variants={fadeLeft} className="mb-4 sm:mb-5">
      <div className="flex items-center gap-3">
        <motion.div
          className="h-px flex-1 max-w-[2rem]"
          style={{ background: '#e5e7eb' }}
          initial={{ scaleX: 0, originX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5 ml-1">{subtitle}</p>}
    </Reveal>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: 'akun', label: 'Akun', abbr: 'AK', color: '#2563eb',
    desc: 'Kelola akun, keamanan, dan pengaturan profil kamu',
    sections: [
      {
        title: 'Autentikasi Dua Faktor (2FA)',
        articles: [
          { title: 'Cara mengaktifkan autentikasi dua faktor (2FA)?', content: 'Buka Pengaturan Akun → pilih tab Keamanan → klik "Aktifkan 2FA". Scan QR code menggunakan aplikasi autentikator (Google Authenticator atau Authy) di ponsel kamu, lalu masukkan kode 6 digit yang muncul untuk menyelesaikan aktivasi. Setelah aktif, setiap login akan memerlukan kode dari aplikasi tersebut.' },
          { title: 'Cara mematikan 2FA?', content: 'Buka Pengaturan Akun → Keamanan → klik "Nonaktifkan 2FA". Kamu akan diminta memasukkan kode 2FA dari aplikasi autentikator untuk konfirmasi. Setelah dikonfirmasi, 2FA akan dinonaktifkan. Kami merekomendasikan untuk tetap mengaktifkan 2FA demi keamanan akun kamu.' },
          { title: 'Cara login menggunakan 2FA?', content: 'Masukkan email dan password seperti biasa di halaman login. Setelah itu, kamu akan diminta memasukkan kode 6 digit dari aplikasi autentikator. Buka aplikasi autentikator di ponselmu, salin kode yang muncul, lalu tempelkan di kolom yang tersedia dan klik "Masuk".' },
          { title: 'Masalah umum pada 2FA', content: 'Jika kode 2FA tidak diterima: (1) Pastikan waktu dan tanggal perangkatmu sudah sinkron. (2) Pastikan kamu menggunakan kode yang dihasilkan untuk akun Stouch. (3) Kode diperbarui setiap 30 detik, tunggu kode baru jika hampir kedaluwarsa. (4) Jangan gunakan tanda hubung atau huruf kapital. Jika masih bermasalah, gunakan kode pemulihan.' },
        ],
      },
      {
        title: 'Pendaftaran & Login',
        articles: [
          { title: 'Cara mendaftar di Stouch?', content: 'Kunjungi halaman utama Stouch dan klik tombol "Daftar". Isi formulir dengan email aktif dan buat password yang kuat (minimal 8 karakter, kombinasi huruf besar, kecil, dan angka). Setelah mendaftar, cek email kamu untuk konfirmasi akun.' },
          { title: 'Lupa password, apa yang harus dilakukan?', content: 'Di halaman login, klik tautan "Lupa Password?" di bawah kolom password. Masukkan alamat email yang terdaftar di Stouch, lalu klik "Kirim". Cek email kamu untuk instruksi reset password. Tautan reset hanya berlaku selama 24 jam.' },
          { title: 'Cara mengonfirmasi alamat email?', content: 'Setelah mendaftar, Stouch akan mengirimkan email konfirmasi. Buka email tersebut dan klik tombol atau tautan "Konfirmasi Email". Jika tidak menerima email dalam 5 menit, cek folder spam.' },
        ],
      },
      {
        title: 'Detail Akun',
        articles: [
          { title: 'Cara mengubah email atau nomor telepon?', content: 'Buka Pengaturan → tab Profil. Di bagian "Informasi Kontak", klik ikon edit di sebelah email atau nomor telepon. Masukkan data baru dan konfirmasi dengan password akunmu.' },
          { title: 'Cara mengubah mata uang akun?', content: 'Mata uang akun ditetapkan saat pendaftaran dan tidak dapat diubah setelah akun aktif. Jika kamu membutuhkan mata uang yang berbeda, silakan hubungi tim support kami.' },
          { title: 'Cara memblokir akun saya?', content: 'Jika kamu mencurigai adanya akses tidak sah ke akun, segera hubungi support kami melalui live chat atau email support@stouch.id. Tim kami dapat memblokir akun sementara untuk melindungi danamu.' },
        ],
      },
    ],
  },
  {
    id: 'verifikasi', label: 'Verifikasi', abbr: 'VF', color: '#059669',
    desc: 'Verifikasi identitas dan dokumen untuk akun penuh',
    sections: [
      {
        title: 'Verifikasi Identitas (KYC)',
        articles: [
          { title: 'Mengapa akun saya perlu diverifikasi?', content: 'Verifikasi identitas (KYC) diperlukan untuk melindungi keamanan akunmu dan memastikan kepatuhan terhadap regulasi keuangan. Akun yang terverifikasi mendapatkan akses ke seluruh fitur platform, termasuk penarikan dana ke rekening bank.' },
          { title: 'Dokumen apa yang dibutuhkan untuk verifikasi?', content: 'Untuk verifikasi identitas, kamu perlu mengunggah: (1) KTP atau paspor yang masih berlaku. (2) Foto selfie sambil memegang dokumen identitas tersebut. Format yang diterima: JPG, PNG, PDF (maks. 2MB per file).' },
          { title: 'Berapa lama proses verifikasi?', content: 'Verifikasi biasanya selesai dalam 1–3 hari kerja setelah dokumen diterima. Kamu akan mendapatkan notifikasi melalui email ketika verifikasi selesai.' },
          { title: 'Verifikasi saya ditolak, apa yang harus dilakukan?', content: 'Jika verifikasi ditolak, kamu akan menerima email berisi alasan penolakan. Perbaiki masalah yang disebutkan lalu unggah ulang dokumen dari halaman Profil → Verifikasi.' },
        ],
      },
      {
        title: 'Verifikasi Rekening Bank',
        articles: [
          { title: 'Cara menambahkan rekening bank?', content: 'Buka Profil → tab Rekening Bank → klik "Tambah Rekening". Isi nama bank, nomor rekening, dan nama pemilik rekening sesuai KTP.' },
          { title: 'Rekening bank saya perlu diverifikasi, berapa lamanya?', content: 'Verifikasi rekening bank membutuhkan waktu 1–2 hari kerja. Tim kami akan melakukan pengecekan untuk memastikan rekening valid dan sesuai dengan data KYC.' },
        ],
      },
    ],
  },
  {
    id: 'trading', label: 'Trading', abbr: 'TR', color: '#d97706',
    desc: 'Cara trading, aset, dan strategi di platform Stouch',
    sections: [
      {
        title: 'Dasar Trading',
        articles: [
          { title: 'Apa itu binary option trading?', content: 'Binary option adalah instrumen trading di mana kamu memprediksi apakah harga suatu aset akan naik (CALL) atau turun (PUT) dalam jangka waktu tertentu. Jika prediksimu benar, kamu mendapatkan profit sesuai profit rate yang berlaku (hingga 95% untuk VIP).' },
          { title: 'Aset apa saja yang tersedia di Stouch?', content: 'Stouch menyediakan: (1) Forex — EUR/USD, GBP/USD, USD/JPY. (2) Cryptocurrency — BTC/USD, ETH/USD, dan lebih dari 20 koin lainnya. (3) Komoditas — Emas, Minyak, Perak. (4) Indeks Saham — S&P 500, NASDAQ, Dow Jones.' },
          { title: 'Berapa durasi trading yang tersedia?', content: 'Tersedia durasi: 1 detik, 1 menit, 2 menit, 3 menit, 5 menit, 10 menit, 15 menit, 30 menit, 45 menit, hingga 1 jam.' },
          { title: 'Berapa batas minimum dan maksimum trade?', content: 'Minimum trade: Rp 1.000 per transaksi. Maksimum trade umumnya hingga Rp 1.000.000 per transaksi. Untuk akun demo, kamu dapat berlatih dengan modal virtual tanpa batasan.' },
        ],
      },
      {
        title: 'Akun Demo',
        articles: [
          { title: 'Apa itu akun demo?', content: 'Akun demo adalah akun latihan dengan saldo virtual yang memungkinkan kamu berlatih trading tanpa risiko. Semua fitur platform tersedia di akun demo. Saldo demo dapat di-reset kapan saja dari halaman pengaturan.' },
          { title: 'Bagaimana cara beralih antara akun demo dan real?', content: 'Di pojok kiri atas halaman trading, klik toggle "Demo"/"Real" untuk berpindah akun. Profit dari akun demo tidak dapat ditarik dan tidak mempengaruhi saldo real kamu.' },
        ],
      },
    ],
  },
  {
    id: 'deposit', label: 'Deposit Dana', abbr: 'DP', color: '#7c3aed',
    desc: 'Cara menambahkan dana ke akun trading kamu',
    sections: [
      {
        title: 'Metode Deposit',
        articles: [
          { title: 'Metode deposit apa yang tersedia?', content: 'Stouch mendukung: (1) Transfer Bank — BCA, Mandiri, BNI, BRI, dan bank lainnya. (2) E-Wallet — GoPay, OVO, Dana, ShopeePay. (3) Virtual Account — tersedia untuk semua bank utama di Indonesia.' },
          { title: 'Berapa jumlah minimum deposit?', content: 'Minimum deposit di Stouch adalah Rp 10.000. Tidak ada batas maksimum untuk deposit. Dana akan tersedia di akun real dalam beberapa menit setelah pembayaran dikonfirmasi.' },
          { title: 'Berapa lama proses deposit?', content: 'Transfer bank dan virtual account: 5–15 menit. E-wallet: instan. Jika dana belum masuk dalam 1 jam, hubungi support kami dengan bukti transfer.' },
          { title: 'Deposit saya belum masuk setelah lebih dari 1 jam, apa yang harus dilakukan?', content: 'Cek riwayat transaksi di bank atau e-wallet, simpan bukti transfer, lalu hubungi support kami melalui live chat atau email support@stouch.id dengan menyertakan bukti pembayaran.' },
        ],
      },
    ],
  },
  {
    id: 'penarikan', label: 'Penarikan Dana', abbr: 'WD', color: '#0891b2',
    desc: 'Proses dan syarat penarikan dana dari akun kamu',
    sections: [
      {
        title: 'Proses Penarikan',
        articles: [
          { title: 'Bagaimana cara melakukan penarikan?', content: 'Buka menu Keuangan → Tarik Dana. Pilih rekening bank yang sudah terverifikasi, masukkan jumlah, lalu klik "Ajukan Penarikan". Penarikan hanya dapat dilakukan ke rekening atas nama yang sama dengan akun Stouch.' },
          { title: 'Berapa batas minimum dan maksimum penarikan?', content: 'Minimum penarikan: Rp 50.000. Batas harian: Standard Rp 5 jt, Gold Rp 20 jt, VIP tidak terbatas.' },
          { title: 'Berapa lama proses penarikan?', content: 'Standard: 1–3 hari kerja. Gold: kurang dari 12 jam. VIP: kurang dari 1 jam (ekspres).' },
          { title: 'Syarat apa yang dibutuhkan untuk penarikan?', content: 'Syarat: (1) Verifikasi identitas (KYC) selesai. (2) Foto selfie terverifikasi. (3) Rekening bank terdaftar dan diverifikasi. (4) Tidak ada order trading yang sedang aktif.' },
        ],
      },
    ],
  },
  {
    id: 'turnamen', label: 'Turnamen', abbr: 'TN', color: '#dc2626',
    desc: 'Kompetisi trading berhadiah yang diadakan Stouch',
    sections: [
      {
        title: 'Tentang Turnamen',
        articles: [
          { title: 'Apa itu turnamen di Stouch?', content: 'Turnamen adalah kompetisi trading berkala. Peserta bersaing untuk mendapatkan profit tertinggi menggunakan akun demo khusus turnamen. Pemenang mendapatkan hadiah berupa saldo real.' },
          { title: 'Bagaimana cara bergabung dengan turnamen?', content: 'Buka menu Turnamen di aplikasi, pilih turnamen yang tersedia, lalu klik "Daftar". Setelah mendaftar, kamu akan mendapatkan akun demo khusus turnamen dengan saldo awal yang telah ditentukan.' },
          { title: 'Bagaimana hadiah turnamen dibagikan?', content: 'Hadiah diberikan dalam bentuk saldo real yang langsung ditambahkan ke akun pemenang setelah turnamen berakhir. Pastikan akunmu sudah terverifikasi untuk dapat menerima hadiah.' },
        ],
      },
    ],
  },
  {
    id: 'promosi', label: 'Promosi & Bonus', abbr: 'PR', color: '#db2777',
    desc: 'Bonus, promo, dan program reward untuk trader aktif',
    sections: [
      {
        title: 'Program Promosi',
        articles: [
          { title: 'Promosi apa saja yang tersedia di Stouch?', content: 'Stouch rutin mengadakan: (1) Bonus deposit. (2) Cashback trading. (3) Promo event khusus. Pantau halaman Promosi atau notifikasi di aplikasi.' },
          { title: 'Bagaimana cara mengklaim bonus?', content: 'Bonus biasanya diklaim otomatis setelah syarat terpenuhi. Untuk bonus kode promo, masukkan kode di halaman deposit sebelum melakukan pembayaran.' },
          { title: 'Apa itu program afiliasi Stouch?', content: 'Program afiliasi memungkinkan kamu mendapatkan komisi dari setiap trader yang mendaftar menggunakan kode referral kamu. Komisi diberikan secara otomatis tanpa batas maksimum.' },
        ],
      },
    ],
  },
  {
    id: 'vip-gold', label: 'Benefit VIP & Gold', abbr: 'VG', color: '#d97706',
    desc: 'Keuntungan eksklusif untuk member Gold dan VIP',
    sections: [
      {
        title: 'Program Tier',
        articles: [
          { title: 'Apa perbedaan status Standard, Gold, dan VIP?', content: 'Standard: fitur dasar, limit tarik Rp 5 jt/hari. Gold: bonus profit +5%, limit tarik Rp 20 jt/hari, analisis mingguan. VIP: bonus profit +10%, limit tidak terbatas, penarikan < 1 jam, dedicated manager, sinyal premium.' },
          { title: 'Bagaimana cara naik ke status Gold atau VIP?', content: 'Status naik otomatis berdasarkan total akumulasi deposit. Gold: total deposit ≥ Rp 200.000. VIP: total deposit ≥ Rp 1.600.000. Sistem memperbarui status secara otomatis.' },
          { title: 'Apakah status bisa turun?', content: 'Tidak. Status tidak turun meskipun saldo berkurang atau kamu melakukan penarikan. Status dihitung dari total historis deposit, bukan saldo aktif.' },
          { title: 'Apa itu sinyal trading premium untuk VIP?', content: 'Sinyal trading premium adalah rekomendasi arah perdagangan dari tim analis berpengalaman. Dikirim setiap hari eksklusif ke member VIP melalui notifikasi aplikasi.' },
        ],
      },
    ],
  },
  {
    id: 'tentang', label: 'Tentang Stouch', abbr: 'TS', color: '#475569',
    desc: 'Informasi umum tentang perusahaan dan platform',
    sections: [
      {
        title: 'Tentang Perusahaan',
        articles: [
          { title: 'Apa itu Stouch?', content: 'Stouch adalah platform trading online dengan jutaan transaksi aktif dari seluruh dunia, menyediakan layanan sejak 2022 dengan berbagai pilihan aset keuangan.' },
          { title: 'Apakah Stouch menyediakan layanan manajemen investasi?', content: 'Tidak. Stouch adalah platform trading mandiri — tidak menyediakan layanan manajemen investasi. Hati-hati terhadap pihak yang mengatasnamakan Stouch dan menawarkan jasa pengelolaan dana.' },
          { title: 'Bagaimana Stouch menjaga keamanan dana pengguna?', content: 'Stouch menerapkan: (1) Enkripsi SSL 256-bit. (2) Segregated accounts. (3) Autentikasi dua faktor (2FA). (4) Monitoring transaksi 24/7. (5) Proses verifikasi identitas (KYC) yang ketat.' },
        ],
      },
    ],
  },
  {
    id: 'aplikasi', label: 'Aplikasi Mobile', abbr: 'AP', color: '#0ea5e9',
    desc: 'Panduan penggunaan aplikasi iOS dan Android',
    sections: [
      {
        title: 'Instalasi & Pengaturan',
        articles: [
          { title: 'Cara mengunduh aplikasi Stouch?', content: 'Stouch tersedia di: (1) Google Play Store. (2) App Store (iOS). (3) APK langsung dari website Stouch untuk Android. Setelah instalasi, login menggunakan akun yang sudah terdaftar.' },
          { title: 'Aplikasi Stouch tidak bisa dibuka atau crash, apa yang harus dilakukan?', content: 'Coba: (1) Tutup paksa dan buka kembali. (2) Pastikan koneksi internet stabil. (3) Bersihkan cache: Pengaturan → Aplikasi → Stouch → Hapus Cache. (4) Perbarui ke versi terbaru. (5) Uninstall dan install ulang.' },
          { title: 'Apakah ada perbedaan fitur antara versi web dan aplikasi mobile?', content: 'Fitur setara: semua aset, riwayat trading, deposit, penarikan, pengaturan akun. Fitur eksklusif mobile: notifikasi push dan Face ID/fingerprint login.' },
        ],
      },
    ],
  },
]

// ─── Article Accordion ────────────────────────────────────────────────────────

function ArticleItem({ article, index, color }: { article: Article; index: number; color: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      className="border-b last:border-b-0"
      style={{ borderColor: '#f5f5f5' }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SPRING, delay: index * 0.05 }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm font-medium text-gray-800 pr-4 leading-snug">{article.title}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex-shrink-0"
        >
          <ChevronDown size={15} className="text-gray-400" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: 'hidden', borderTop: '1px solid #f5f5f5' }}
          >
            <div className="px-5 pb-4 pt-3">
              <motion.div
                className="w-8 h-0.5 mb-3 rounded-full"
                style={{ background: color }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
              <p className="text-sm text-gray-600 leading-relaxed">{article.content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Category View ────────────────────────────────────────────────────────────

function CategoryView({ category, onClose }: { category: Category; onClose: () => void }) {
  const totalArticles = category.sections.reduce((acc, s) => acc + s.articles.length, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING }}
    >
      {/* Back + header */}
      <motion.button
        onClick={onClose}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors mb-6"
        whileHover={{ x: -3 }}
        transition={{ duration: 0.15 }}
      >
        ← Semua Kategori
      </motion.button>

      <div className="flex items-center gap-4 mb-8">
        <motion.div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-sm"
          style={{ background: `${category.color}12`, color: category.color, border: `1.5px solid ${category.color}25` }}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          whileHover={{ rotate: 5, scale: 1.05 }}
        >
          {category.abbr}
        </motion.div>
        <div>
          <motion.h2
            className="text-xl font-bold text-gray-900"
            style={{ letterSpacing: '-0.03em' }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRING, delay: 0.12 }}
          >
            {category.label}
          </motion.h2>
          <motion.p
            className="text-xs text-gray-400 mt-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {category.desc} · {totalArticles} artikel
          </motion.p>
        </div>
      </div>

      {/* Animated top bar */}
      <motion.div
        className="h-0.5 rounded-full mb-8"
        style={{ background: `linear-gradient(90deg, ${category.color}, ${category.color}40)` }}
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      <motion.div
        className="space-y-4"
        variants={stagger(0.08)}
        initial="hidden"
        animate="visible"
      >
        {category.sections.map((section, si) => (
          <motion.div
            key={si}
            variants={fadeUp}
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #f0f0f0' }}
            whileHover={{ boxShadow: `0 8px 32px ${category.color}12`, transition: { duration: 0.25 } }}
          >
            {/* Section header with bar animation */}
            <div className="relative px-5 py-3.5 bg-gray-50" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
                style={{ background: category.color }}
                initial={{ scaleY: 0, originY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: si * 0.08 }}
              />
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{section.title}</p>
            </div>
            {section.articles.map((article, ai) => (
              <ArticleItem key={ai} article={article} index={ai} color={category.color} />
            ))}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

// ─── Search ───────────────────────────────────────────────────────────────────

interface SearchResult {
  categoryLabel: string
  categoryColor: string
  sectionTitle: string
  article: Article
  categoryId: string
}

function flatSearch(query: string): SearchResult[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results: SearchResult[] = []
  for (const cat of CATEGORIES) {
    for (const section of cat.sections) {
      for (const article of section.articles) {
        if (article.title.toLowerCase().includes(q) || article.content.toLowerCase().includes(q)) {
          results.push({ categoryLabel: cat.label, categoryColor: cat.color, sectionTitle: section.title, article, categoryId: cat.id })
        }
      }
    }
  }
  return results.slice(0, 8)
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatsStrip() {
  const totalArticles = CATEGORIES.reduce((a, c) => a + c.sections.reduce((b, s) => b + s.articles.length, 0), 0)
  const stats = [
    { label: 'Total Artikel', color: '#2563eb', num: totalArticles, suffix: ' Artikel' },
    { label: 'Kategori', color: '#059669', num: CATEGORIES.length, suffix: ' Topik' },
    { label: 'Waktu Respons', color: '#d97706', num: null, value: '< 2 Jam' },
    { label: 'Support', color: '#7c3aed', num: null, value: '7 × 24' },
  ]
  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12"
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      {stats.map(s => (
        <motion.div
          key={s.label}
          variants={fadeUp}
          className="bg-white rounded-2xl p-4 sm:p-5 text-center"
          style={{ border: '1px solid #f0f0f0' }}
          whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.08)', transition: { duration: 0.2 } }}
        >
          <p className="text-lg sm:text-xl font-bold mb-1" style={{ color: s.color, letterSpacing: '-0.02em' }}>
            {s.num != null ? <CountUp to={s.num} suffix={s.suffix} /> : s.value}
          </p>
          <p className="text-[11px] text-gray-400">{s.label}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Category grid ────────────────────────────────────────────────────────────

function CategoryGrid({ onSelect }: { onSelect: (cat: Category) => void }) {
  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
      variants={stagger(0.07)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      {CATEGORIES.map((cat, i) => (
        <motion.button
          key={cat.id}
          variants={fadeUp}
          onClick={() => onSelect(cat)}
          className="bg-white rounded-2xl p-4 sm:p-5 text-left"
          style={{ border: '1px solid #f0f0f0' }}
          whileHover={{ y: -5, boxShadow: `0 16px 40px ${cat.color}20`, transition: { duration: 0.22 } }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Animated top bar */}
          <motion.div
            className="h-0.5 rounded-full mb-4"
            style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.color}50)` }}
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
          />

          <motion.div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 font-black text-xs tracking-wide"
            style={{ background: `${cat.color}10`, color: cat.color }}
            initial={{ scale: 0, rotate: -90 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ ...SPRING, delay: i * 0.06 + 0.15 }}
            whileHover={{ rotate: 8, scale: 1.1 }}
          >
            {cat.abbr}
          </motion.div>

          <p className="text-sm font-bold text-gray-800 mb-1 leading-tight">{cat.label}</p>
          <p className="text-[11px] text-gray-400 leading-snug hidden sm:block mb-2">{cat.desc}</p>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400">
              {cat.sections.reduce((acc, s) => acc + s.articles.length, 0)} artikel
            </span>
            <motion.span
              animate={{ x: [0, 2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
            >
              <ChevronRight size={10} className="text-gray-300" />
            </motion.span>
          </div>
        </motion.button>
      ))}
    </motion.div>
  )
}

// ─── Popular articles ─────────────────────────────────────────────────────────

function PopularArticles({ onSelect }: { onSelect: (cat: Category) => void }) {
  const popular = [
    { cat: 'akun',       title: 'Cara mengaktifkan autentikasi dua faktor (2FA)?' },
    { cat: 'deposit',    title: 'Metode deposit apa yang tersedia?' },
    { cat: 'penarikan',  title: 'Berapa lama proses penarikan?' },
    { cat: 'vip-gold',   title: 'Bagaimana cara naik ke status Gold atau VIP?' },
    { cat: 'trading',    title: 'Apa itu akun demo?' },
    { cat: 'verifikasi', title: 'Dokumen apa yang dibutuhkan untuk verifikasi?' },
  ]

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      variants={stagger(0.08)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      {popular.map((item, i) => {
        const cat = CATEGORIES.find(c => c.id === item.cat)!
        return (
          <motion.button
            key={i}
            variants={fadeUp}
            onClick={() => onSelect(cat)}
            className="bg-white rounded-xl px-4 py-3.5 text-left flex items-center gap-3 relative overflow-hidden"
            style={{ border: '1px solid #f0f0f0', borderLeft: `3px solid ${cat.color}` }}
            whileHover={{ x: 4, boxShadow: `0 8px 24px ${cat.color}14`, transition: { duration: 0.18 } }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="absolute inset-0 opacity-0"
              style={{ background: `${cat.color}05` }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <p className="text-sm text-gray-700 font-medium leading-snug relative z-10">{item.title}</p>
            <motion.span
              className="flex-shrink-0 relative z-10"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
            >
              <ChevronRight size={13} className="text-gray-300" />
            </motion.span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}

// ─── Contact support ──────────────────────────────────────────────────────────

function ContactSupport() {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      <motion.a
        href="mailto:support@stouch.id"
        variants={fadeUp}
        className="bg-white rounded-2xl p-5 flex items-start gap-4"
        style={{ border: '1px solid #f0f0f0' }}
        whileHover={{ y: -4, boxShadow: '0 16px 40px #2563eb14', transition: { duration: 0.22 } }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#2563eb12' }}
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <Mail size={18} className="text-blue-600" />
        </motion.div>
        <div>
          <p className="text-sm font-bold text-gray-800 mb-0.5">Email Support</p>
          <p className="text-xs text-gray-400 mb-2">Untuk pertanyaan detail, verifikasi, dan keluhan</p>
          <p className="text-xs font-semibold text-blue-600">support@stouch.id</p>
        </div>
      </motion.a>

      <motion.div
        variants={fadeUp}
        className="bg-white rounded-2xl p-5 flex items-start gap-4"
        style={{ border: '1px solid #f0f0f0' }}
        whileHover={{ y: -4, boxShadow: '0 16px 40px #05966914', transition: { duration: 0.22 } }}
      >
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#05966912' }}
          whileHover={{ rotate: -10, scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <MessageCircle size={18} className="text-emerald-600" />
        </motion.div>
        <div>
          <p className="text-sm font-bold text-gray-800 mb-0.5">Live Chat</p>
          <p className="text-xs text-gray-400 mb-2">Respon cepat untuk masalah teknis dan pertanyaan umum</p>
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className="text-xs font-semibold text-emerald-600">Tersedia di aplikasi</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Client page export ───────────────────────────────────────────────────────

export default function HelpCenterPageClient() {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [search, setSearch] = useState('')

  const searchResults = flatSearch(search)

  return (
    <div className="min-h-screen bg-gray-50">
      <PageNavbar
        title="Pusat Bantuan"
        subtitle="Temukan jawaban atas pertanyaanmu"
        onBack={activeCategory ? () => setActiveCategory(null) : undefined}
      />

      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 pb-20">

        <AnimatePresence mode="wait">
          {!activeCategory ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* ── Hero & search ── */}
              <div className="py-10 sm:py-12 lg:py-16 text-center">
                <Reveal variants={scaleIn}>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 mb-5">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Pusat Bantuan Stouch</span>
                  </div>
                </Reveal>

                <AnimatedHeadline
                  text="Ada yang bisa kami bantu?"
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3"
                  style={{ letterSpacing: '-0.04em', lineHeight: 1.1 }}
                />

                <Reveal delay={0.3}>
                  <p className="text-sm sm:text-base text-gray-500 mb-8">
                    Cari jawaban dari ribuan artikel bantuan Stouch
                  </p>
                </Reveal>

                {/* Search box */}
                <Reveal delay={0.4} className="max-w-lg mx-auto">
                  <div className="relative">
                    <motion.div
                      className="absolute -inset-0.5 rounded-2xl opacity-0"
                      style={{ background: 'linear-gradient(135deg, #2563eb30, #7c3aed30)' }}
                      whileFocus={{ opacity: 1 }}
                    />
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                    <input
                      type="text"
                      placeholder="Cari artikel bantuan..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm text-gray-800 outline-none transition-all relative z-10"
                      style={{ border: '1.5px solid #e5e7eb', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#6b7280')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    />
                    {search && (
                      <motion.button
                        onClick={() => setSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.2 }}
                      >
                        <X size={15} />
                      </motion.button>
                    )}
                  </div>

                  <AnimatePresence>
                    {search && (
                      <motion.div
                        className="mt-2 bg-white rounded-2xl overflow-hidden text-left"
                        style={{ border: '1px solid #e5e7eb', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ ...SPRING }}
                      >
                        {searchResults.length === 0 ? (
                          <div className="px-5 py-4 text-sm text-gray-400">
                            Tidak ada hasil untuk &quot;<span className="text-gray-600 font-medium">{search}</span>&quot;
                          </div>
                        ) : (
                          <motion.div variants={stagger(0.04)} initial="hidden" animate="visible">
                            {searchResults.map((r, i) => (
                              <motion.button
                                key={i}
                                variants={fadeUp}
                                className="w-full text-left px-5 py-3.5 border-b last:border-b-0 transition-colors"
                                style={{ borderColor: '#f5f5f5' }}
                                onClick={() => {
                                  const cat = CATEGORIES.find(c => c.id === r.categoryId)
                                  if (cat) { setActiveCategory(cat); setSearch('') }
                                }}
                                whileHover={{ backgroundColor: `${r.categoryColor}06`, x: 4 }}
                                transition={{ duration: 0.15 }}
                              >
                                <p className="text-sm font-medium text-gray-800 leading-snug">{r.article.title}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                    style={{ background: `${r.categoryColor}12`, color: r.categoryColor }}>
                                    {r.categoryLabel}
                                  </span>
                                  <span className="text-[11px] text-gray-400">{r.sectionTitle}</span>
                                </div>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Reveal>
              </div>

              {/* Stats strip */}
              <StatsStrip />

              {/* Category grid */}
              <section className="mb-10 sm:mb-12">
                <SectionLabel title="Semua Kategori" subtitle="Pilih topik yang ingin kamu pelajari" />
                <CategoryGrid onSelect={setActiveCategory} />
              </section>

              {/* Popular articles */}
              <section className="mb-10 sm:mb-12">
                <SectionLabel title="Artikel Populer" subtitle="Pertanyaan yang paling sering ditanyakan" />
                <PopularArticles onSelect={setActiveCategory} />
              </section>

              {/* Contact support */}
              <section>
                <SectionLabel title="Masih Butuh Bantuan?" subtitle="Tim support kami siap membantu kamu" />
                <ContactSupport />
              </section>
            </motion.div>
          ) : (
            <motion.div
              key={activeCategory.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ ...SPRING }}
              className="pt-6"
            >
              <CategoryView category={activeCategory} onClose={() => setActiveCategory(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}