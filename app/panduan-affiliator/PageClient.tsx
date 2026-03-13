// app/panduan-affiliator/PageClient.tsx
'use client'

import { useState, useRef } from 'react'
import PageNavbar from '@/components/PageNavbar'
import {
  ChevronDown, Search, X,
  Mail, MessageCircle, ChevronRight,
  Users, TrendingUp, Wallet, Zap,
} from 'lucide-react'
import {
  motion,
  AnimatePresence,
  useInView,
  type Variants,
} from 'framer-motion'

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Motion helpers ───────────────────────────────────────────────────────────

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

// ── Reusable motion wrappers ─────────────────────────────────────────────────

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

// ── Content data ─────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: 'pengenalan',
    label: 'Pengenalan Program',
    abbr: 'PP',
    color: '#2563eb',
    desc: 'Apa itu program affiliator Stouch dan keuntungannya',
    sections: [
      {
        title: 'Tentang Program Affiliator',
        articles: [
          {
            title: 'Apa itu program affiliator Stouch?',
            content:
              'Program affiliator Stouch memungkinkan kamu mendapatkan komisi dari setiap kerugian trading yang dialami oleh pengguna yang kamu undang. Setelah ditetapkan sebagai affiliator oleh Super Admin, kamu mendapatkan kode unik untuk disebarkan. Setiap trader yang mendaftar menggunakan kodemu dan melakukan deposit akan menjadi bagian dari jaringanmu.',
          },
          {
            title: 'Siapa yang bisa mendaftar menjadi affiliator?',
            content:
              'Program affiliator bersifat invitation-only dan hanya dapat diaktifkan oleh Super Admin. Kamu perlu mengajukan permohonan melalui tim Stouch, dan tim kami akan mengevaluasi profil kamu. Umumnya, affiliator yang diutamakan adalah mereka yang sudah memiliki komunitas trader, channel media sosial aktif, atau jaringan yang relevan dengan dunia trading.',
          },
          {
            title: 'Apakah ada biaya untuk bergabung menjadi affiliator?',
            content:
              'Tidak ada biaya pendaftaran. Program affiliator Stouch sepenuhnya gratis untuk diikuti. Kamu hanya perlu disetujui oleh tim Stouch, dan setelah diaktifkan, kamu langsung bisa menyebarkan kode referralmu.',
          },
          {
            title: 'Apakah saya perlu memiliki akun Stouch terlebih dahulu?',
            content:
              'Ya. Kamu harus sudah memiliki akun aktif di Stouch sebelum mengajukan permohonan sebagai affiliator. Pastikan akunmu sudah terverifikasi (KYC selesai) dan rekening bank sudah terdaftar sebelum mengajukan permohonan.',
          },
        ],
      },
      {
        title: 'Keuntungan Menjadi Affiliator',
        articles: [
          {
            title: 'Apa saja keuntungan menjadi affiliator Stouch?',
            content:
              'Sebagai affiliator kamu mendapatkan: (1) Komisi otomatis dari setiap kerugian trading trader undanganmu di akun real. (2) Kode referral unik yang bisa dikustomisasi. (3) Dashboard lengkap untuk memantau performa undangan dan komisi. (4) Opsi fitur Autotrade untuk monetisasi lebih lanjut. (5) Saldo awal akun real sebagai modal awal (jika disetujui oleh admin).',
          },
          {
            title: 'Apakah saya tetap mendapat komisi jika trader undangan saya menang?',
            content:
              'Tidak. Komisi affiliator hanya dihitung dari kerugian (loss) trading pengguna undanganmu di akun real. Kamu tidak mendapatkan komisi ketika trader undanganmu meraih profit. Ini memastikan komisi murni berbasis aktivitas trading, bukan hasil trading.',
          },
        ],
      },
    ],
  },
  {
    id: 'cara-daftar',
    label: 'Cara Mendaftar',
    abbr: 'CD',
    color: '#059669',
    desc: 'Langkah-langkah mendaftar dan proses persetujuan',
    sections: [
      {
        title: 'Langkah Pendaftaran',
        articles: [
          {
            title: 'Bagaimana cara mengajukan permohonan sebagai affiliator?',
            content:
              'Langkah-langkah: (1) Pastikan akunmu sudah aktif dan KYC terverifikasi. (2) Daftarkan rekening bank di menu Profil. (3) Hubungi tim Stouch melalui email support@stouch.id atau live chat dengan subjek "Permohonan Affiliator". (4) Sertakan informasi tentang dirimu: nama, platform/komunitas yang kamu kelola, dan jumlah audiens. (5) Tim kami akan meninjau permohonanmu dalam 1–3 hari kerja. (6) Jika disetujui, Super Admin akan mengaktifkan status affiliatormu dan kamu akan menerima notifikasi.',
          },
          {
            title: 'Informasi apa yang perlu saya siapkan saat mengajukan permohonan?',
            content:
              'Siapkan: (1) Email akun Stouch yang sudah terdaftar. (2) Link profil media sosial atau channel (YouTube, Telegram, Instagram, TikTok, dll.) beserta jumlah follower/anggota. (3) Penjelasan singkat bagaimana kamu berencana mempromosikan Stouch kepada audiensmu. (4) Estimasi jumlah trader potensial yang bisa kamu undang dalam 1 bulan pertama.',
          },
          {
            title: 'Berapa lama proses persetujuan permohonan affiliator?',
            content:
              'Tim Stouch akan memproses permohonanmu dalam 1–3 hari kerja. Kamu akan mendapatkan notifikasi melalui email apakah permohonanmu diterima atau ditolak beserta alasannya. Jika ada informasi tambahan yang diperlukan, tim kami akan menghubungimu terlebih dahulu.',
          },
          {
            title: 'Apakah permohonan saya bisa ditolak?',
            content:
              'Ya, ada kemungkinan permohonan ditolak jika: (1) Akun belum terverifikasi penuh. (2) Profil atau komunitas yang kamu kelola tidak relevan dengan bidang trading atau keuangan. (3) Jumlah audiens/jaringan dianggap terlalu kecil untuk program ini. (4) Informasi yang diberikan tidak lengkap atau tidak dapat diverifikasi. Kamu boleh mengajukan permohonan ulang setelah memperbaiki kekurangan tersebut.',
          },
        ],
      },
      {
        title: 'Setelah Persetujuan',
        articles: [
          {
            title: 'Apa yang terjadi setelah permohonan saya disetujui?',
            content:
              'Setelah disetujui: (1) Akunmu akan diaktifkan sebagai affiliator oleh Super Admin. (2) Kamu mendapatkan kode referral unik (bisa dikustomisasi jika diminta sebelumnya). (3) Link undangan unik akan tersedia: stouch.id/ref/KODEMU. (4) Dashboard affiliator akan aktif di menu akun kamu. (5) Jika admin menyetujui saldo awal (initialRealBalance), dana akan langsung masuk ke akun real kamu.',
          },
          {
            title: 'Bagaimana cara mendapatkan kode referral kustom?',
            content:
              'Saat mengajukan permohonan, kamu dapat menyebutkan kode kustom yang kamu inginkan (contoh: JOHNDOE, TRADINGBRO, dll.). Kode kustom harus: 3–20 karakter, hanya huruf/angka/tanda hubung/underscore, dan belum digunakan oleh affiliator lain. Jika tidak ada permintaan khusus, sistem akan membuat kode otomatis dengan format AFF + 8 karakter alfanumerik.',
          },
        ],
      },
    ],
  },
  {
    id: 'komisi',
    label: 'Sistem Komisi',
    abbr: 'KM',
    color: '#d97706',
    desc: 'Cara perhitungan komisi dan fase-fase program',
    sections: [
      {
        title: 'Perhitungan Komisi',
        articles: [
          {
            title: 'Bagaimana komisi dihitung?',
            content:
              'Komisi dihitung secara otomatis dan dinamis berdasarkan dua fase: FASE 1 (Affiliator Baru — 2 bulan pertama sejak tanggal assign): Kamu mendapatkan komisi flat 80% dari semua kerugian trader undanganmu yang sudah deposit di akun real. FASE 2 (Affiliator Lama — setelah 2 bulan): Persentase komisi berdasarkan jumlah user aktif per bulan: 0–50 aktif → 50%, 51–70 aktif → 60%, 71–100 aktif → 70%, 101+ aktif → 80%.',
          },
          {
            title: 'Apa yang dimaksud "user aktif" dalam perhitungan komisi Fase 2?',
            content:
              'User aktif adalah trader undanganmu yang melakukan minimal satu transaksi di akun real dalam 30 hari terakhir. Semakin banyak user aktifmu, semakin tinggi persentase komisi yang kamu dapatkan di Fase 2 (50%–80%).',
          },
          {
            title: 'Kapan komisi mulai bisa saya terima?',
            content:
              'Komisi baru bisa ditarik setelah threshold undangan terpenuhi. Secara default, kamu perlu mengundang minimal 5 pengguna yang sudah melakukan deposit untuk membuka akses penarikan komisi. Sebelum threshold terpenuhi, komisi tetap dihitung dan dikumpulkan sebagai "locked commission balance" — tidak hilang, hanya belum bisa ditarik.',
          },
          {
            title: 'Apakah komisi saya bisa berkurang atau hangus?',
            content:
              'Tidak. Komisi yang sudah masuk ke balance kamu tidak akan berkurang atau hangus. Komisi juga tidak terpengaruh oleh aktivitas trading akunmu sendiri. Saldo komisi terkunci (locked) akan otomatis terbuka setelah threshold undangan terpenuhi.',
          },
        ],
      },
      {
        title: 'Threshold & Unlock',
        articles: [
          {
            title: 'Apa itu threshold undangan dan bagaimana cara memenuhinya?',
            content:
              'Threshold undangan adalah jumlah minimum pengguna undanganmu yang harus sudah melakukan deposit agar akses penarikan komisi terbuka. Defaultnya adalah 5 pengguna. Kamu bisa memantau progres ini di dashboard affiliator (menu "Unlock Progress"). Setiap pengguna yang mendaftar via kodemu dan melakukan deposit pertama akan menambah hitungan unlock.',
          },
          {
            title: 'Apakah threshold bisa berbeda untuk setiap affiliator?',
            content:
              'Ya, threshold dapat dikonfigurasi berbeda oleh Super Admin untuk setiap affiliator. Admin bisa menurunkan threshold jika melihat potensi baik dari affiliator tertentu, atau menaikkannya sesuai kebutuhan program.',
          },
        ],
      },
    ],
  },
  {
    id: 'penarikan-komisi',
    label: 'Penarikan Komisi',
    abbr: 'PK',
    color: '#7c3aed',
    desc: 'Cara dan syarat menarik saldo komisi kamu',
    sections: [
      {
        title: 'Cara Menarik Komisi',
        articles: [
          {
            title: 'Bagaimana cara menarik saldo komisi saya?',
            content:
              'Langkah penarikan komisi: (1) Buka dashboard affiliator → menu "Penarikan Komisi". (2) Masukkan jumlah yang ingin ditarik (minimum Rp 50.000). (3) Pilih rekening bank tujuan (harus sudah terdaftar di profil). (4) Tambahkan catatan opsional jika diperlukan. (5) Klik "Ajukan Penarikan". (6) Tunggu persetujuan dari Super Admin. Setelah disetujui, saldo akan langsung ditransfer ke rekening bankmu.',
          },
          {
            title: 'Berapa minimum penarikan komisi?',
            content:
              'Minimum penarikan komisi adalah Rp 50.000. Tidak ada batas maksimum, kamu bisa menarik seluruh saldo komisi yang tersedia sekaligus.',
          },
          {
            title: 'Berapa lama proses penarikan komisi disetujui?',
            content:
              'Proses persetujuan penarikan komisi dilakukan oleh Super Admin dalam 1–3 hari kerja. Kamu akan menerima notifikasi email setelah request diproses. Jika disetujui, dana langsung masuk ke rekening bankmu. Jika ditolak, saldo dikembalikan ke balance komisimu beserta alasan penolakan.',
          },
          {
            title: 'Apakah saya bisa mengajukan lebih dari satu request penarikan sekaligus?',
            content:
              'Tidak. Hanya boleh ada satu request penarikan komisi yang pending dalam satu waktu. Kamu dapat mengajukan request baru setelah request sebelumnya selesai diproses (disetujui atau ditolak). Jika ingin membatalkan request yang pending, kamu bisa membatalkannya dari dashboard dan saldo akan dikembalikan secara instan.',
          },
        ],
      },
      {
        title: 'Syarat Penarikan',
        articles: [
          {
            title: 'Apa saja syarat agar bisa menarik komisi?',
            content:
              'Syarat penarikan komisi: (1) Threshold undangan terpenuhi (default: 5 undangan sudah deposit). (2) Saldo komisi minimal Rp 50.000. (3) Rekening bank sudah terdaftar dan terverifikasi di profil. (4) Tidak ada request penarikan komisi lain yang masih pending.',
          },
          {
            title: 'Apakah ada fee atau potongan saat penarikan komisi?',
            content:
              'Untuk affiliator tanpa fitur Autotrade, tidak ada potongan fee — kamu menerima penuh 100% dari jumlah yang diajukan. Untuk affiliator dengan fitur Autotrade aktif, dikenakan fee 5% dari jumlah penarikan sebagai biaya layanan autotrade. Contoh: Tarik Rp 150.000 → fee Rp 7.500 → kamu menerima Rp 142.500.',
          },
        ],
      },
    ],
  },
  {
    id: 'autotrade',
    label: 'Fitur Autotrade',
    abbr: 'AT',
    color: '#0891b2',
    desc: 'Kelola whitelist bot autotrade dan fitur monetisasinya',
    sections: [
      {
        title: 'Tentang Autotrade',
        articles: [
          {
            title: 'Apa itu fitur Autotrade untuk affiliator?',
            content:
              'Fitur Autotrade adalah layanan opsional yang memungkinkan affiliator mengelola whitelist User ID yang boleh menggunakan bot autotrade mereka. Jika Autotrade diaktifkan, bot autotrade hanya bisa login menggunakan User ID yang sudah masuk daftar whitelist affiliator tersebut. Ini memberi affiliator kontrol penuh atas siapa saja yang bisa menggunakan bot autotrade miliknya.',
          },
          {
            title: 'Apakah fitur Autotrade otomatis aktif untuk semua affiliator?',
            content:
              'Tidak. Fitur Autotrade bersifat opsional dan harus diaktifkan secara khusus oleh Super Admin. Kamu bisa memintanya saat mengajukan permohonan affiliator, atau Super Admin dapat mengaktifkannya di kemudian hari jika diperlukan.',
          },
          {
            title: 'Apakah ada konsekuensi finansial jika Autotrade diaktifkan?',
            content:
              'Ya. Jika Autotrade aktif, setiap penarikan komisi kamu akan dikenakan fee 5% sebagai biaya layanan. Tanpa Autotrade, penarikan komisi tidak ada potongan sama sekali. Pertimbangkan hal ini sebelum mengaktifkan fitur Autotrade.',
          },
        ],
      },
      {
        title: 'Manajemen Whitelist',
        articles: [
          {
            title: 'Bagaimana cara mengelola whitelist autotrade?',
            content:
              'Setelah Autotrade diaktifkan di akunmu, kamu bisa mengakses endpoint whitelist melalui dashboard affiliator. Kamu dapat: (1) Melihat daftar User ID yang sudah diwhitelist. (2) Menambahkan User ID baru beserta catatan opsional. (3) Menghapus User ID dari whitelist jika diperlukan. (4) Mengecek apakah suatu User ID sudah masuk whitelist atau belum.',
          },
          {
            title: 'Apakah ada batas maksimum User ID yang bisa diwhitelist?',
            content:
              'Tidak ada batas maksimum yang ditetapkan. Kamu bisa menambahkan User ID sebanyak yang diperlukan ke whitelist autotrade kamu. Setiap User ID yang diwhitelist harus sudah terdaftar sebagai pengguna aktif di sistem Stouch.',
          },
          {
            title: 'Apa yang terjadi jika saya menghapus User ID dari whitelist?',
            content:
              'Setelah User ID dihapus dari whitelist, bot autotrade dengan User ID tersebut tidak akan bisa login lagi ke sistem autotrade kamu. Penghapusan bersifat langsung tanpa masa tenggang. User ID yang dihapus bisa ditambahkan kembali kapan saja jika diperlukan.',
          },
        ],
      },
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard Affiliator',
    abbr: 'DA',
    color: '#dc2626',
    desc: 'Cara memantau performa dan statistik jaringan undanganmu',
    sections: [
      {
        title: 'Fitur Dashboard',
        articles: [
          {
            title: 'Informasi apa saja yang tersedia di dashboard affiliator?',
            content:
              'Dashboard affiliatormu menampilkan: (1) Kode referral dan link undangan unik. (2) Status komisi (terkunci/terbuka) dan progres unlock. (3) Saldo komisi saat ini dan total komisi yang pernah diterima. (4) Statistik: total undangan, berapa yang sudah deposit, dan berapa yang masih pending. (5) Log komisi per transaksi (kapan, dari siapa, berapa). (6) Riwayat penarikan komisi beserta statusnya.',
          },
          {
            title: 'Bagaimana cara melihat siapa saja yang sudah saya undang?',
            content:
              'Buka dashboard affiliator → menu "Daftar Undangan". Di sini kamu bisa melihat semua pengguna yang mendaftar via kodemu, termasuk status deposit mereka. Email ditampilkan dalam format tersensor (contoh: j***e@gmail.com) untuk alasan privasi.',
          },
          {
            title: 'Apakah saya bisa melihat detail transaksi komisi saya?',
            content:
              'Ya. Di menu "Riwayat Komisi" kamu bisa melihat log komisi per kejadian, termasuk: tanggal transaksi, jumlah order trader undangan, jumlah kerugian, persentase komisi yang diterapkan, dan jumlah komisi yang kamu terima dari transaksi tersebut.',
          },
        ],
      },
      {
        title: 'Fase & Status Program',
        articles: [
          {
            title: 'Bagaimana cara mengecek saya sedang di fase mana (Baru atau Lama)?',
            content:
              'Di dashboard affiliator bagian "Info Komisi", kamu bisa melihat fase komisi aktif saat ini: Fase Baru (80% flat) atau Fase Lama (dinamis berdasarkan user aktif). Termasuk informasi berapa hari lagi fase baru berakhir jika masih di Fase 1, dan berapa jumlah user aktifmu saat ini untuk menentukan persentase di Fase 2.',
          },
          {
            title: 'Apa yang terjadi jika program affiliator saya dicabut oleh admin?',
            content:
              'Jika status affiliatormu dicabut oleh Super Admin: (1) Kode referralmu tidak lagi bisa digunakan untuk mendaftar. (2) Tidak ada komisi baru yang akan dihitung. (3) Saldo komisi yang sudah ada tetap tersimpan dan bisa ditarik sesuai syarat yang berlaku. (4) Fitur Autotrade (jika aktif) akan nonaktif.',
          },
        ],
      },
    ],
  },
  {
    id: 'syarat',
    label: 'Syarat & Ketentuan',
    abbr: 'SK',
    color: '#475569',
    desc: 'Aturan dan kebijakan program affiliator Stouch',
    sections: [
      {
        title: 'Ketentuan Program',
        articles: [
          {
            title: 'Apakah saya boleh membuat beberapa akun affiliator?',
            content:
              'Tidak. Setiap pengguna hanya diizinkan memiliki satu program affiliator aktif. Pembuatan akun ganda untuk mendapatkan beberapa kode referral adalah pelanggaran kebijakan dan dapat menyebabkan akun kamu diblokir.',
          },
          {
            title: 'Apakah saya boleh mengundang diri sendiri menggunakan kode saya sendiri?',
            content:
              'Tidak. Kode referral tidak dapat digunakan untuk akun milik kamu sendiri atau akun yang memiliki data yang sama (email, nomor telepon, rekening bank, atau perangkat yang sama). Sistem kami memiliki mekanisme deteksi untuk mencegah penyalahgunaan ini.',
          },
          {
            title: 'Apa yang dianggap sebagai pelanggaran program affiliator?',
            content:
              'Pelanggaran yang dapat menyebabkan status affiliator dicabut: (1) Membuat akun palsu atau akun ghost untuk memenuhi threshold. (2) Mengundang diri sendiri atau pihak yang berafiliasi langsung. (3) Mempromosikan Stouch dengan cara yang menyesatkan atau menjanjikan imbal hasil yang tidak realistis. (4) Memanipulasi sistem whitelist autotrade untuk kepentingan pribadi yang merugikan platform.',
          },
          {
            title: 'Apakah Stouch bisa mengubah ketentuan program affiliator?',
            content:
              'Ya. Stouch berhak mengubah persentase komisi, threshold, ketentuan penarikan, atau aturan program lainnya sewaktu-waktu. Perubahan akan diberitahukan melalui email atau notifikasi di platform. Dengan terus menggunakan program affiliator, kamu dianggap menyetujui perubahan tersebut.',
          },
        ],
      },
    ],
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

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
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{article.content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CategoryView({ category, onClose }: { category: Category; onClose: () => void }) {
  const totalArticles = category.sections.reduce((acc, s) => acc + s.articles.length, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING }}
    >
      <motion.button
        onClick={onClose}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors mb-6"
        whileHover={{ x: -3 }}
        transition={{ duration: 0.15 }}
      >
        ← Semua Topik
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

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip() {
  const totalArticles = CATEGORIES.reduce((a, c) => a + c.sections.reduce((b, s) => b + s.articles.length, 0), 0)
  const stats = [
    { label: 'Total Panduan', color: '#2563eb', num: totalArticles, suffix: ' Artikel' },
    { label: 'Topik', color: '#059669', num: CATEGORIES.length, suffix: ' Topik' },
    { label: 'Komisi Fase Baru', color: '#d97706', num: null, value: '80%' },
    { label: 'Min. Penarikan', color: '#7c3aed', num: null, value: 'Rp 50K' },
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

// ── Category grid ─────────────────────────────────────────────────────────────

function CategoryGrid({ onSelect }: { onSelect: (cat: Category) => void }) {
  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
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
              {cat.sections.reduce((acc, s) => acc + s.articles.length, 0)} panduan
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

// ── How-to steps strip ────────────────────────────────────────────────────────

const STEPS = [
  { icon: Users, color: '#2563eb', step: '01', title: 'Daftarkan Akun', desc: 'Pastikan akun Stouch kamu sudah aktif dan KYC terverifikasi.' },
  { icon: Mail, color: '#059669', step: '02', title: 'Ajukan Permohonan', desc: 'Hubungi support via email atau live chat untuk mengajukan sebagai affiliator.' },
  { icon: TrendingUp, color: '#d97706', step: '03', title: 'Tunggu Persetujuan', desc: 'Tim kami meninjau permohonan dalam 1–3 hari kerja.' },
  { icon: Wallet, color: '#7c3aed', step: '04', title: 'Mulai Undang & Earn', desc: 'Setelah disetujui, sebarkan kode referral dan raih komisi otomatis.' },
]

function HowToSteps() {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      {STEPS.map((s, i) => (
        <motion.div
          key={i}
          variants={fadeUp}
          className="bg-white rounded-2xl p-5 relative overflow-hidden"
          style={{ border: '1px solid #f0f0f0' }}
          whileHover={{ y: -4, boxShadow: `0 16px 40px ${s.color}18`, transition: { duration: 0.22 } }}
        >
          <motion.div
            className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.04]"
            style={{ background: s.color, transform: 'translate(30%, -30%)' }}
          />
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-black" style={{ color: s.color }}>{s.step}</span>
            <motion.div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${s.color}12` }}
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <s.icon size={15} style={{ color: s.color }} />
            </motion.div>
          </div>
          <p className="text-sm font-bold text-gray-800 mb-1">{s.title}</p>
          <p className="text-[11px] text-gray-400 leading-snug">{s.desc}</p>
          {i < STEPS.length - 1 && (
            <motion.div
              className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 z-10"
              style={{ background: '#e5e7eb' }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 + 0.3 }}
            />
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}

// ── Popular guides ────────────────────────────────────────────────────────────

function PopularGuides({ onSelect }: { onSelect: (cat: Category) => void }) {
  const popular = [
    { cat: 'cara-daftar', title: 'Bagaimana cara mengajukan permohonan sebagai affiliator?' },
    { cat: 'komisi', title: 'Bagaimana komisi dihitung?' },
    { cat: 'penarikan-komisi', title: 'Berapa minimum penarikan komisi?' },
    { cat: 'komisi', title: 'Kapan komisi mulai bisa saya terima?' },
    { cat: 'autotrade', title: 'Apa itu fitur Autotrade untuk affiliator?' },
    { cat: 'syarat', title: 'Apa yang dianggap sebagai pelanggaran program affiliator?' },
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

// ── Contact support ───────────────────────────────────────────────────────────

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
          <p className="text-sm font-bold text-gray-800 mb-0.5">Email Permohonan</p>
          <p className="text-xs text-gray-400 mb-2">Kirim permohonan affiliator dengan informasi lengkap kamu</p>
          <p className="text-xs font-semibold text-blue-600">support@stouch.id</p>
        </div>
      </motion.a>

      <motion.a
        href="https://wa.me/6285701866916?text=Halo%20Stouch%2C%20saya%20ingin%20mengajukan%20permohonan%20sebagai%20affiliator."
        target="_blank"
        rel="noopener noreferrer"
        variants={fadeUp}
        className="bg-white rounded-2xl p-5 flex items-start gap-4"
        style={{ border: '1px solid #f0f0f0' }}
        whileHover={{ y: -4, boxShadow: '0 16px 40px #05966914', transition: { duration: 0.22 } }}
        whileTap={{ scale: 0.98 }}
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
          <p className="text-sm font-bold text-gray-800 mb-0.5">WhatsApp</p>
          <p className="text-xs text-gray-400 mb-2">Chat langsung via WhatsApp untuk info dan permohonan affiliator</p>
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className="text-xs font-semibold text-emerald-600">+62 857-0186-6916</p>
          </div>
        </div>
      </motion.a>
    </motion.div>
  )
}

// ── Commission highlight banner ───────────────────────────────────────────────

function CommissionBanner() {
  const tiers = [
    { range: 'Fase Baru (2 bln pertama)', pct: '80%', note: 'Flat dari semua loss invitee', color: '#2563eb' },
    { range: '0–50 user aktif', pct: '50%', note: 'Fase Lama', color: '#059669' },
    { range: '51–70 user aktif', pct: '60%', note: 'Fase Lama', color: '#d97706' },
    { range: '71–100 user aktif', pct: '70%', note: 'Fase Lama', color: '#7c3aed' },
    { range: '101+ user aktif', pct: '80%', note: 'Fase Lama', color: '#dc2626' },
  ]

  return (
    <Reveal variants={scaleIn}>
      <div
        className="rounded-2xl p-5 sm:p-6 mb-10 sm:mb-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid #334155',
        }}
      >
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2563eb, transparent)', transform: 'translate(30%, -30%)' }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="flex items-center gap-2 mb-1">
          <Zap size={14} className="text-yellow-400" />
          <p className="text-[11px] font-bold text-yellow-400 uppercase tracking-widest">Sistem Komisi Dinamis</p>
        </div>
        <p className="text-base sm:text-lg font-bold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
          Raih hingga 80% komisi dari loss trader undanganmu
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {tiers.map((t, i) => (
            <motion.div
              key={i}
              className="rounded-xl p-3 text-center"
              style={{ background: `${t.color}18`, border: `1px solid ${t.color}30` }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...SPRING, delay: i * 0.08 }}
              whileHover={{ scale: 1.03 }}
            >
              <p className="text-xl font-black mb-0.5" style={{ color: t.color }}>{t.pct}</p>
              <p className="text-[10px] font-semibold text-gray-300 leading-tight">{t.range}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">{t.note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Reveal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AffiliatorRegistrationPageClient() {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [search, setSearch] = useState('')

  const searchResults = flatSearch(search)

  return (
    <div className="min-h-screen bg-gray-50">
      <PageNavbar
        title="Program Affiliator"
        subtitle="Cara daftar, komisi, dan semua yang perlu kamu tahu"
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

              {/* ── Hero ── */}
              <div className="py-10 sm:py-12 lg:py-16 text-center">
                <Reveal variants={scaleIn}>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 mb-5">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Panduan Affiliator Stouch</span>
                  </div>
                </Reveal>

                <AnimatedHeadline
                  text="Daftar Affiliator & Mulai Earn Komisi"
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3"
                  style={{ letterSpacing: '-0.04em', lineHeight: 1.1 }}
                />

                <Reveal delay={0.3}>
                  <p className="text-sm sm:text-base text-gray-500 mb-8">
                    Semua yang perlu kamu ketahui tentang cara daftar, komisi, dan manfaat menjadi affiliator Stouch
                  </p>
                </Reveal>

                {/* ── Search ── */}
                <Reveal delay={0.4} className="max-w-lg mx-auto">
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                    <input
                      type="text"
                      placeholder="Cari panduan affiliator..."
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

              {/* ── Stats ── */}
              <StatsStrip />

              {/* ── How-to steps ── */}
              <section className="mb-10 sm:mb-12">
                <SectionLabel title="Cara Daftar" subtitle="4 langkah mudah menjadi affiliator Stouch" />
                <HowToSteps />
              </section>

              {/* ── Commission banner ── */}
              <CommissionBanner />

              {/* ── Topic grid ── */}
              <section className="mb-10 sm:mb-12">
                <SectionLabel title="Semua Topik" subtitle="Pilih topik yang ingin kamu pelajari lebih lanjut" />
                <CategoryGrid onSelect={setActiveCategory} />
              </section>

              {/* ── Popular guides ── */}
              <section className="mb-10 sm:mb-12">
                <SectionLabel title="Panduan Populer" subtitle="Pertanyaan yang paling sering ditanyakan calon affiliator" />
                <PopularGuides onSelect={setActiveCategory} />
              </section>

              {/* ── Contact ── */}
              <section>
                <SectionLabel title="Siap Mendaftar?" subtitle="Hubungi tim kami untuk mengajukan permohonan affiliator" />
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