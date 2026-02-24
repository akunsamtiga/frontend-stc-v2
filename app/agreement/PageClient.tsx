'use client'

// app/agreement/PageClient.tsx
import { useState, useRef } from 'react'
import PageNavbar from '@/components/PageNavbar'
import { Menu, X, Scale, AlertTriangle, ChevronDown, FileText, Globe, DollarSign, Shield, Users, BookOpen, Gavel } from 'lucide-react'
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
}

interface Section {
  id: string
  roman: string
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

// ─── Reveal ────────────────────────────────────────────────────────────────────

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
    id: 'definisi', roman: 'I', title: 'Definisi', color: '#2563eb',
    clauses: [
      { id: '1.1',  text: '\'Saldo Akun\' berarti jumlah agregat dana di Akun Klien, tidak termasuk Transaksi Terbuka, dan merupakan kewajiban keuangan Perusahaan kepada Klien pada waktu tertentu, kecuali ditentukan lain.' },
      { id: '1.2',  text: '\'Aset\' berarti pasangan mata uang, komoditas, saham, dan indeks saham yang tersedia untuk diperdagangkan melalui instrumen keuangan di Website.' },
      { id: '1.3',  text: '\'Manfaat\' berarti item yang tersedia untuk dibeli atau ditukar dengan Stocken oleh Klien di dalam Pasar.' },
      { id: '1.4',  text: '\'Bonus\' berarti dana yang dikreditkan ke Akun Klien untuk meningkatkan kapasitas trading. Bonus bukan merupakan kewajiban keuangan Perusahaan kepada Klien.' },
      { id: '1.5',  text: '\'Akun Pribadi Klien\' berarti area Website dengan akses terbatas yang memungkinkan Klien untuk menggunakan layanan Perusahaan setelah otorisasi masuk berhasil.' },
      { id: '1.6',  text: '\'Akun Riil Klien\' (\'Akun\', \'Akun Klien\') berarti akun Klien yang ditetapkan di Platform Perdagangan yang menunjukkan pembaruan real-time dari Transaksi Non-perdagangan, Perdagangan Terbuka dan Tertutup, dan perubahan lain dari kewajiban keuangan Perusahaan kepada Klien. Mata uang akun mencakup dolar AS dan euro.' },
      { id: '1.7',  text: '\'Perdagangan Tertutup\' berarti Perdagangan yang telah mencapai Kedaluwarsa atau telah ditutup sesuai dengan perintah Klien.' },
      { id: '1.8',  text: '\'Server Perusahaan\' (\'Server\') berarti sistem teknologi yang bertanggung jawab untuk mengirimkan umpan Kuotasi langsung dan memproses Order Perdagangan Klien.' },
      { id: '1.9',  text: '\'Copy Trading\' artinya fungsionalitas yang dapat diakses di Akun Pribadi Klien yang memungkinkan Klien untuk mereplikasi Perdagangan yang dilakukan oleh trader lain di Platform Trading.' },
      { id: '1.10', text: '\'Akun Demo\' berarti akun simulasi di Platform Perdagangan. Dana di Akun Demo tidak membentuk kewajiban keuangan Perusahaan kepada Klien.' },
      { id: '1.11', text: '\'Deposit\' berarti dana yang ditransfer oleh Klien ke Rekening Klien.' },
      { id: '1.12', text: '\'Kedaluwarsa\' berarti saat Perdagangan dieksekusi setelah mencapai waktu penutupan yang telah ditentukan.' },
      { id: '1.13', text: '\'File Log\' berarti catatan yang berisi data sistem mengenai operasi Server Perusahaan dan interaksi Klien dengan Website.' },
      { id: '1.14', text: '\'Pasar\' berarti Akun Pribadi Klien di mana Manfaat dapat dibeli atau ditukar dengan Stocken.' },
      { id: '1.15', text: '\'Pengganda\' berarti koefisien yang mewakili rasio antara Nilai Perdagangan dan investasi Klien, yang ditetapkan saat pembukaan Transaksi dalam perdagangan CFD. Pengganda tidak boleh melebihi 10.' },
      { id: '1.16', text: '\'Transaksi Non-Perdagangan\' berarti tindakan seperti Deposit, Penarikan, dan aktivitas lain di luar lingkup Transaksi Perdagangan.' },
      { id: '1.17', text: '\'Perdagangan Terbuka\' berarti Perdagangan yang belum mencapai Kedaluwarsa atau belum ditutup oleh Klien.' },
      { id: '1.18', text: '\'Penyedia Sistem Pembayaran\' berarti entitas yang menawarkan layanan pembayaran elektronik.' },
      { id: '1.19', text: '\'Perdagangan Bebas Risiko\' berarti Perdagangan yang dilakukan atas biaya Perusahaan. Klien dapat dengan bebas mengelola keuntungan yang diperoleh tanpa batasan.' },
      { id: '1.20', text: '\'Saldo Stocken\' berarti jumlah total Stocken yang dimiliki oleh Klien.' },
      { id: '1.21', text: '\'Stocken\' (\'STN\') berarti unit yang tidak dapat dipindahtangankan, tidak dapat dikonversi menjadi uang tunai, dan tidak dapat diwariskan yang dikreditkan ke Saldo Stocken Klien.' },
      { id: '1.22', text: '\'Perdagangan\' berarti Transaksi Perdagangan yang berlawanan yang memiliki nomor identifikasi yang sama.' },
      { id: '1.23', text: '\'Aktivitas Perdagangan\' berarti tindakan Klien seperti Deposit, Penarikan, Transaksi Perdagangan, pendaftaran Turnamen berbayar, dan aktivasi Bonus atau hadiah.' },
      { id: '1.24', text: '\'Mekanisme Perdagangan\' berarti instrumen keuangan derivatif berdasarkan Aset yang disediakan oleh Perusahaan dalam Platform Perdagangan. Dua jenis tersedia: Perdagangan FTT dan Perdagangan CFD.' },
      { id: '1.25', text: '\'Order Perdagangan\' berarti instruksi Klien untuk melaksanakan Transaksi Perdagangan dengan ketentuan tertentu.' },
      { id: '1.26', text: '\'Platform Perdagangan\' berarti sistem perangkat lunak yang dapat diakses melalui Akun Pribadi Klien, digunakan untuk menampilkan Kuotasi secara real-time dan mengirimkan Order Perdagangan.' },
      { id: '1.27', text: '\'Transaksi Perdagangan\' berarti transaksi over-the-counter yang melibatkan Aset, yang dilakukan antara Perusahaan dan Klien dalam mode penyelesaian tunai.' },
      { id: '1.28', text: '\'Omzet Perdagangan\' berarti total kumulatif investasi Klien dalam Perdagangan yang dilakukan sejak Deposit terakhir mereka.' },
      { id: '1.29', text: '\'Nilai Perdagangan\' dihitung sebagai investasi Klien dikalikan dengan Pengganda yang ditetapkan.' },
      { id: '1.30', text: '\'Turnamen\' berarti kompetisi berdurasi terbatas yang menawarkan hadiah uang tunai.' },
      { id: '1.31', text: '\'Kuotasi\' berarti nilai digital suatu Aset pada saat tertentu.' },
      { id: '1.32', text: '\'Penarikan\' berarti pemotongan dana dari Akun Klien dan transfernya ke akun eksternal Klien.' },
    ],
  },
  {
    id: 'pendaftaran', roman: 'II', title: 'Pendaftaran & Verifikasi', color: '#059669',
    clauses: [
      { id: '2.1',  text: 'Pendaftaran di Website wajib dilakukan oleh Klien. Untuk menyelesaikan pendaftaran, Klien harus: (i) memberikan alamat email yang valid dan membuat kata sandi; (ii) memilih mata uang untuk Akunnya; dan (iii) menyetujui syarat dan ketentuan Perjanjian.' },
      { id: '2.2',  text: 'Dengan mendaftar di Website, Klien menyatakan dan menjamin bahwa ia adalah orang dewasa yang cakap secara hukum dan telah membaca, memahami, dan menyetujui semua ketentuan Perjanjian.' },
      { id: '2.3',  text: 'Untuk memastikan penyediaan layanan yang sah dan aman, Perusahaan akan melakukan verifikasi identitas Klien. Perusahaan dapat meminta foto paspor, KTP, SIM, tagihan utilitas, rekening koran, atau dokumen lain yang diperlukan.' },
      { id: '2.4',  text: 'Verifikasi biasanya selesai dalam waktu 20 menit setelah menerima semua dokumen yang diminta; tetapi, Perusahaan dapat memperpanjang periode ini hingga 7 hari kalender jika diperlukan.' },
      { id: '2.5',  text: 'Apabila Klien menolak untuk memberikan dokumen atau informasi yang diperlukan, Perusahaan berhak untuk menangguhkan dan selanjutnya memblokir layanan Akun Klien.' },
      { id: '2.6',  text: 'Perusahaan dapat meminta partisipasi dalam konferensi video, dengan pemberitahuan kepada Klien setidaknya 24 jam sebelumnya, untuk mengonfirmasi identitas dan keaslian dokumen.' },
      { id: '2.7',  text: 'Dengan mendaftar, Klien setuju untuk menerima email—termasuk konten promosi—panggilan telepon, dan pesan SMS dari Perusahaan.' },
      { id: '2.8',  text: 'Setiap Klien hanya berhak memiliki satu Akun di Website. Penemuan beberapa Akun yang terhubung dapat mengakibatkan pembatalan Perdagangan dan pemblokiran akun.' },
      { id: '2.9',  text: 'Jika tidak ada Aktivitas Perdagangan selama 90 hari berturut-turut, biaya layanan bulanan sebesar $30/€30 akan dibebankan.' },
      { id: '2.10', text: 'Perusahaan berhak memotong seluruh Saldo Akun jika tidak ada Aktivitas Perdagangan yang terjadi selama 6 bulan berturut-turut.' },
      { id: '2.11', text: 'Untuk memulihkan dana ke Akun, Klien harus menghubungi Dukungan Perusahaan sebagaimana dijelaskan di bagian XIII.' },
    ],
  },
  {
    id: 'ftt', roman: 'III', title: 'Perdagangan FTT (Fixed Time Trading)', color: '#d97706',
    clauses: [
      { id: '3.1', text: 'Untuk membuka Perdagangan, Klien memilih Aset, menentukan jumlah investasi dan arah pergerakan harga, dan menetapkan waktu penutupan Perdagangan.' },
      { id: '3.2', text: 'Perdagangan secara otomatis ditutup setelah mencapai waktu penutupan yang telah ditentukan.' },
      { id: '3.3', text: 'Sebuah perdagangan dianggap menguntungkan jika, pada saat penutupan, Kuotasi Aset saat ini melebihi Kuotasi pembukaan ketika arah yang dipilih adalah "naik", atau jika Kuotasi saat ini lebih rendah daripada Kuotasi pembukaan ketika arahnya "turun."' },
      { id: '3.4', text: 'Keuntungan dihitung sebagai persentase keuntungan dikalikan dengan investasi Klien.' },
    ],
  },
  {
    id: 'cfd', roman: 'IV', title: 'Perdagangan CFD', color: '#7c3aed',
    clauses: [
      { id: '4.1', text: 'Untuk membuka Perdagangan, Klien memilih Aset, menentukan jumlah investasi, Pengganda, dan arah pergerakan harga.' },
      { id: '4.2', text: 'Perdagangan ditutup berdasarkan instruksi Klien atau secara otomatis jika terjadi Stop Loss teknikal (kerugian mencapai 95% dari jumlah yang diinvestasikan) atau setelah 15 hari sejak pembukaan.' },
      { id: '4.3', text: 'Perdagangan menguntungkan jika, pada penutupan, Kuotasi lebih tinggi daripada pembukaan untuk arah "naik", atau lebih rendah daripada pembukaan untuk arah "turun".' },
      { id: '4.4', text: 'Keuntungan atau kerugian dihitung sebagai: Jumlah Investasi × Pengganda × (Kuotasi Penutupan / Kuotasi Pembukaan - 1).' },
      { id: '4.5', text: 'Ketika sebuah Perdagangan dibuka, komisi sebesar 0,02% dari Nilai Perdagangan dikurangkan dari Akun Demo Klien.' },
      { id: '4.6', text: 'Klien dapat memiliki maksimal 15 Perdagangan terbuka secara simultan dalam Trading CFD.' },
      { id: '4.7', text: 'Kerugian maksimum pada Perdagangan yang dilakukan dengan mekanisme CFD tidak boleh melebihi 100% dari jumlah investasi Klien.' },
      { id: '4.8', text: 'Perdagangan CFD diizinkan dari hari Senin pukul 07.00 UTC hingga Jumat 21.00 UTC.' },
      { id: '4.9', text: 'Trading CFD tersedia secara eksklusif di Akun Demo.' },
    ],
  },
  {
    id: 'transaksi', roman: 'V', title: 'Transaksi Perdagangan', color: '#0891b2',
    clauses: [
      { id: '5.1.1', text: 'Klien mengetahui bahwa satu-satunya sumber resmi untuk aliran Kuotasi adalah Server Perusahaan. Kuotasi yang ditampilkan di Platform Perdagangan hanya berfungsi sebagai referensi indikatif.' },
      { id: '5.1.2', text: 'Kuotasi Aset di Platform Perdagangan dihitung sebagai rata-rata aritmatika dari harga pembelian dan penjualan: (pembelian + penjualan) / 2.' },
      { id: '5.1.3', text: 'Jika Order Perdagangan dieksekusi berdasarkan Kuotasi non-pasar, Perusahaan harus menyesuaikan hasil keuangan Perdagangan sesuai dengan Kuotasi pasar yang berlaku atau membatalkan hasil Perdagangan.' },
      { id: '5.3',   text: 'Dalam keadaan normal, pemrosesan biasanya membutuhkan 0–4 detik; kondisi pasar yang buruk dapat memperpanjang durasi ini.' },
      { id: '5.4.1', text: 'Investasi minimum per perdagangan adalah $1/€1; maksimum adalah $5.000/€5.000.' },
      { id: '5.4.2', text: 'Order Perdagangan untuk membuka Perdagangan dapat ditolak jika: (i) diajukan sebelum Penawaran Harga pertama dari Aset diterima; dan/atau (ii) dana yang tersedia tidak mencukupi.' },
      { id: '5.4.3', text: 'Server dapat menolak Order Perdagangan dalam kondisi pasar yang tidak normal.' },
      { id: '5.4.4', text: 'Sebuah Perdagangan dianggap terbuka setelah entri yang sesuai muncul di File Log dengan pengenal unik.' },
      { id: '5.5.1', text: 'Perdagangan ditutup pada Kuotasi Aset terkini yang tercatat di Server pada waktu penutupan.' },
      { id: '5.7',   text: 'Perusahaan dapat membatasi jumlah maksimum Perdagangan per Klien dalam interval yang ditentukan.' },
      { id: '5.8',   text: 'Perusahaan berhak untuk mengubah persentase profitabilitas, jumlah investasi minimum dan maksimum, dan jangka waktu Kedaluwarsa untuk satu atau beberapa Aset.' },
      { id: '5.9',   text: 'Kerusakan sistem, koneksi internet yang tidak stabil, pemadaman listrik, gangguan bursa, atau kejadian force majeure dapat membatalkan Perdagangan yang dieksekusi selama kejadian tersebut.' },
    ],
  },
  {
    id: 'non-perdagangan', roman: 'VI', title: 'Transaksi Non-Perdagangan', color: '#dc2626',
    clauses: [
      { id: '6.1',  text: 'Metode resmi untuk Deposit dan Penarikan ditetapkan di Website Perusahaan. Klien menanggung semua risiko yang terkait dengan penggunaan sistem pembayaran. Komisi penarikan berlaku: Indonesia: 5% untuk semua permintaan penarikan di atas batas 1 dalam waktu 24 jam.' },
      { id: '6.2',  text: 'Deposit minimum adalah $10/€10, dapat diturunkan sesuai dengan kebijakan Perusahaan di negara-negara tertentu atau acara promosi.' },
      { id: '6.3',  text: 'Deposit menggunakan detail pembayaran pihak ketiga sangat dilarang.' },
      { id: '6.4',  text: 'Jumlah Penarikan minimum adalah $10/€10, dapat diturunkan sesuai dengan kebijakan Perusahaan.' },
      { id: '6.5',  text: 'Dana didebet dari Akun hanya setelah eksekusi pembayaran aktual. Penarikan dana bersifat final dan tidak dapat dikembalikan.' },
      { id: '6.6',  text: 'Klien bertanggung jawab penuh atas keakuratan informasi yang diberikan dalam permintaan Penarikan.' },
      { id: '6.7',  text: 'Permintaan penarikan dana diproses dalam waktu 3 hari kerja sejak pengajuan.' },
      { id: '6.8',  text: 'Batas penarikan: $3.000/€3.000 setiap hari; $10.000/€10.000 sebelum akhir minggu berjalan; $40.000/€40.000 sebelum akhir bulan berjalan.' },
      { id: '6.9',  text: 'Penarikan dana dapat ditunda hingga 10 hari kerja oleh layanan keamanan Perusahaan setelah pemberitahuan sebelumnya.' },
      { id: '6.10', text: 'Penarikan dana dilakukan melalui metode dan akun yang sama dengan yang digunakan untuk Deposit.' },
      { id: '6.11', text: 'Untuk kepatuhan AML, Perusahaan dapat meminta bukti bahwa akun penarikan adalah milik Klien.' },
      { id: '6.12', text: 'Perusahaan dapat menolak permintaan penarikan jika Akun digunakan untuk operasi pertukaran antara sistem pembayaran.' },
      { id: '6.13', text: 'Jika Klien menarik dana sebelum mencapai Omzet Perdagangan yang melebihi dua kali jumlah Deposit, biaya penarikan sebesar 10% dari Saldo Akun atau Deposit terakhir akan dikenakan.' },
      { id: '6.18', text: 'Perusahaan berhak untuk membatasi jumlah yang tersedia untuk Penarikan hingga jumlah total Deposit Klien yang dibuat dalam 30 hari kalender sebelumnya.' },
      { id: '6.19', text: 'Jika Perusahaan mencurigai adanya tindakan curang, Perusahaan dapat memblokir Akun Klien dengan segera, tanpa pemberitahuan sebelumnya.' },
      { id: '6.20', text: 'Kebijakan Pengembalian Dana: Semua pengembalian dana diproses melalui Transaksi Non-Perdagangan. Klien dapat meminta pengembalian dana melalui email support@stouch.com.' },
    ],
  },
  {
    id: 'bonus', roman: 'VII', title: 'Bonus, Turnamen, dan Promosi', color: '#db2777',
    clauses: [
      { id: '7.1',  text: 'Bonus dikreditkan ke Akun Klien sesuai dengan program promosi atau bonus yang diselenggarakan oleh Perusahaan. Bonus yang dikreditkan bukan merupakan kewajiban finansial Perusahaan kepada Klien.' },
      { id: '7.2',  text: 'Jumlah Bonus bergantung pada ketentuan khusus dari promosi atau program dan/atau ukuran Deposit Klien.' },
      { id: '7.3',  text: 'Setelah Bonus diaktifkan, dana di Akun Klien dapat ditarik tanpa pembatalan Bonus hanya setelah Klien menyelesaikan Omzet Perdagangan Wajib.' },
      { id: '7.4',  text: 'Kecuali ditentukan lain, setiap promosi hanya memberikan hak kepada Klien untuk menerima Bonus sebanyak satu kali.' },
      { id: '7.5',  text: 'Keuntungan yang diperoleh dari Perdagangan menggunakan Bonus dapat tunduk pada batasan Penarikan.' },
      { id: '7.6',  text: 'Bonus Non-Deposit harus diaktifkan dalam waktu 3 hari setelah dikreditkan di Akun Pribadi Klien.' },
      { id: '7.7',  text: 'Setelah aktivasi, Klien dapat membatalkan Bonus melalui antarmuka Akun Pribadi kapan pun, apabila tidak ada Perdagangan Terbuka dan/atau permintaan Penarikan berstatus menunggu.' },
      { id: '7.8',  text: 'Bonus dapat didebit dari Akun Klien setelah berakhirnya promosi terkait.' },
      { id: '7.9',  text: 'Hanya satu Bonus aktif yang boleh ada per Akun Klien.' },
      { id: '7.10', text: 'Jika Saldo Akun Klien turun di bawah jumlah investasi Perdagangan minimum yang disyaratkan, Bonus akan hangus.' },
      { id: '7.11', text: 'Partisipasi turnamen dilakukan melalui akun turnamen virtual khusus. Tujuannya adalah mencapai saldo tertinggi di akhir Turnamen; dana hadiah didistribusikan di antara para pemenang.' },
      { id: '7.12', text: 'Klien bertanggung jawab untuk meninjau ketentuan Turnamen dan promosi yang tersedia yang diposting di Website.' },
      { id: '7.13', text: 'Hadiah uang yang diberikan untuk Turnamen dikreditkan ke Akun Riil Klien pada saat aktivasi, kecuali dinyatakan lain.' },
      { id: '7.14', text: 'Kecurigaan terhadap aktivitas curang Klien dalam Turnamen atau promosi dapat menyebabkan peninjauan ulang atau pembatalan hasil.' },
    ],
  },
  {
    id: 'pasar', roman: 'VIII', title: 'Pasar', color: '#0ea5e9',
    clauses: [
      { id: '8.1', text: 'Di Pasar, setiap Manfaat diberi nilai dalam mata uang Akun Riil Klien dan dalam Stocken, yang ditentukan sepenuhnya oleh Perusahaan.' },
      { id: '8.2', text: 'Penjelasan terperinci dan ketentuan penggunaan Manfaat tersedia di dalam Pasar.' },
      { id: '8.3', text: 'Perusahaan dapat secara sepihak merevisi nilai Manfaat, memodifikasi atau menghapus Manfaat, atau menghentikan akses Pasar setiap saat.' },
      { id: '8.4', text: 'Manfaat dapat dibeli menggunakan dana dari Akun Riil Klien atau ditukar dengan Stocken.' },
      { id: '8.5', text: 'Manfaat yang dipilih diberikan kepada Klien setelah dikurangi jumlah yang diperlukan dari Akun Riil atau Saldo Stocken Klien.' },
      { id: '8.6', text: 'Biaya Manfaat tidak dapat dikembalikan.' },
      { id: '8.7', text: 'Manfaat hanya ditujukan untuk penggunaan pribadi Klien dan tidak dapat dialihkan kepada pihak ketiga.' },
      { id: '8.8', text: 'Klien mengakui bahwa materi di Pasar bukan merupakan saran investasi atau perdagangan; semua keputusan perdagangan adalah atas kebijakan Klien sendiri.' },
      { id: '8.9', text: 'Pelanggaran ketentuan Perjanjian oleh Klien dapat mengakibatkan Perusahaan membatasi akses Pasar Klien atas kebijakannya sendiri.' },
    ],
  },
  {
    id: 'stocken', roman: 'IX', title: 'Stocken', color: '#d97706',
    clauses: [
      { id: '9.1', text: 'Klien hanya boleh memiliki 1 Saldo Stocken. Penemuan beberapa akun yang terhubung dapat mengakibatkan pembatalan Saldo Stocken.' },
      { id: '9.2', text: 'Kecurigaan terhadap penipuan atau kecurangan Klien dapat menyebabkan pembatalan Saldo Stocken Klien.' },
      { id: '9.3', text: 'Setelah Klien meninggal dunia atau tidak mampu secara hukum, Saldo Stocken mereka dibatalkan.' },
      { id: '9.4', text: 'Stocken dikreditkan ke Saldo Stocken Klien untuk setiap Perdagangan di Akun Riil mereka, tidak termasuk Perdagangan dengan hasil nol, sebanding dengan jumlah investasi.' },
      { id: '9.5', text: 'Stocken dikreditkan setelah penutupan Perdagangan.' },
      { id: '9.6', text: 'Perdagangan yang dibatalkan sesuai dengan klausul 5.1.3 Perjanjian ini akan mengakibatkan pembatalan Stocken yang terkait.' },
      { id: '9.7', text: 'Stocken dapat ditukar dengan Manfaat di Pasar. Jika pertukaran dibatalkan, Stocken akan dikembalikan ke Saldo Stocken Klien.' },
      { id: '9.8', text: 'Stocken dibatalkan 30 hari setelah: (i) pengkreditan Stocken yang pertama setelah Saldo Stocken nol jika tidak ada penukaran yang terjadi; atau (ii) penukaran Manfaat yang terakhir jika Saldo Stocken tidak nol.' },
    ],
  },
  {
    id: 'risiko', roman: 'X', title: 'Risiko Klien', color: '#ef4444',
    clauses: [
      { id: '10.1', text: 'Klien sepenuhnya mengakui bahwa: (i) perdagangan instrumen keuangan melibatkan risiko yang signifikan; (ii) Transaksi Perdagangan yang dilakukan melalui Platform Perdagangan bersifat over-the-counter dengan risiko lebih tinggi; (iii) informasi atau rekomendasi dari Perusahaan bukan merupakan penawaran langsung untuk melakukan perdagangan; (iv) kegagalan teknis atau faktor lain dapat menyebabkan kerugian finansial Klien.' },
      { id: '10.2', text: 'Klien menanggung semua risiko terkait pembatasan hukum di yurisdiksi mereka dan bertanggung jawab atas kepatuhan.' },
      { id: '10.3', text: 'Perusahaan tidak menjamin keuntungan Klien atau tidak adanya kerugian dari penggunaan layanannya.' },
    ],
  },
  {
    id: 'jaminan', roman: 'XI', title: 'Jaminan, Tanggung Jawab, dan Force Majeure', color: '#475569',
    clauses: [
      { id: '11.1',  text: 'Perusahaan bukan lembaga kredit, tidak menerima dana untuk investasi dengan bunga, dan tidak melakukan kegiatan perbankan.' },
      { id: '11.2',  text: 'Perusahaan tidak memberikan layanannya di beberapa negara/wilayah tertentu termasuk Australia, Kanada, Amerika Serikat, Inggris, dan negara-negara lain di mana dilarang oleh hukum atau kebijakan internal Perusahaan.' },
      { id: '11.3',  text: 'Klien menjamin bahwa Perdagangan di Akun mereka dilakukan atas nama dan kepentingan mereka sendiri.' },
      { id: '11.4',  text: 'Penyediaan dokumen palsu atau tidak valid oleh Klien selama verifikasi dapat menyebabkan penolakan layanan dan penolakan penarikan keuntungan Klien.' },
      { id: '11.5',  text: 'Klien menjamin bahwa dana yang disetorkan adalah sah dan tidak berasal dari kegiatan ilegal.' },
      { id: '11.6',  text: 'Klien setuju untuk menyediakan dokumentasi dan bekerja sama untuk memastikan kepatuhan AML.' },
      { id: '11.7',  text: 'Setiap tindakan Klien yang mengganggu kestabilan sistem atau layanan Perusahaan dapat mengakibatkan penangguhan Akun Klien.' },
      { id: '11.8',  text: 'Klien bertanggung jawab untuk menjaga kredensial login mereka dan harus segera memberi tahu Perusahaan jika ada akses tidak sah.' },
      { id: '11.9',  text: 'Perusahaan tidak bertanggung jawab atas tindakan atau kelalaian Klien di Platform Perdagangan, termasuk kerugian dari Transaksi Perdagangan.' },
      { id: '11.10', text: 'Perusahaan tidak bertanggung jawab atas kegagalan yang disebabkan oleh serangan peretas, kerusakan teknis, atau gangguan komunikasi di luar kendalinya.' },
      { id: '11.11', text: 'Perusahaan tidak bertanggung jawab atas kerugian Klien yang diakibatkan oleh peristiwa force majeure, termasuk tetapi tidak terbatas pada bencana alam, aksi teroris, konflik militer, atau pembatasan pemerintah.' },
      { id: '11.12', text: 'Keuntungan yang diperoleh dari penggunaan bot trading, kecerdasan buatan, atau eksploitasi kerentanan dalam perangkat lunak tidak akan menjadi kewajiban keuangan Perusahaan.' },
      { id: '11.13', text: 'Jika terjadi pelanggaran Perjanjian oleh Klien, Perusahaan berhak untuk mengakhiri Perjanjian secara sepihak tanpa pemberitahuan sebelumnya.' },
    ],
  },
  {
    id: 'sengketa', roman: 'XII', title: 'Penyelesaian Sengketa', color: '#059669',
    clauses: [
      { id: '12.1', text: 'Klien harus terlebih dahulu menyampaikan sengketa kepada Tim Dukungan Perusahaan. Jika tidak puas, Klien dapat meminta eskalasi ke Departemen Penyelesaian Sengketa atau mengirimkan keluhan melalui email complaints@stouch.com.' },
      { id: '12.2', text: 'Pengaduan harus menyertakan nama lengkap Klien, email, tanggal dan detail operasi yang disengketakan, deskripsi terperinci, dan dokumen pendukung jika tersedia.' },
      { id: '12.3', text: 'Keluhan yang berisi pernyataan provokatif, tuduhan tidak berdasar, ancaman, atau bahasa yang tidak senonoh terhadap Perusahaan atau stafnya dapat ditolak.' },
      { id: '12.4', text: 'Perusahaan akan mengakui penerimaan pengaduan dalam waktu 2 hari kerja, memberikan Klien temuan awal dan jadwal keputusan.' },
      { id: '12.5', text: 'Perusahaan merespons Klien dengan langkah-langkah penyelesaian dalam waktu 10 hari kerja sejak diterimanya pengaduan, dapat diperpanjang hingga 10 hari kerja lagi jika diperlukan informasi tambahan.' },
      { id: '12.6', text: 'Klaim atas kehilangan keuntungan atau kerugian moral tidak dipertimbangkan.' },
      { id: '12.7', text: 'Jika Klien tidak mengajukan banding atas respons Perusahaan dalam waktu 5 hari kerja, maka sengketa dianggap telah diselesaikan.' },
    ],
  },
  {
    id: 'kontak', roman: 'XIII', title: 'Kontak', color: '#2563eb',
    clauses: [
      { id: '13.1', text: 'Klien dapat menghubungi Perusahaan melalui: (i) email Dukungan Perusahaan: support@stouch.com; (ii) obrolan online di Website.' },
      { id: '13.2', text: 'Detail kontak Klien termasuk email terdaftar dan nomor telepon yang disediakan di Akun Pribadi mereka.' },
      { id: '13.3', text: 'Perusahaan tidak bertanggung jawab atas kesalahan informasi kontak Klien yang dikirimkan saat pendaftaran.' },
    ],
  },
  {
    id: 'pajak', roman: 'XIV', title: 'Pajak', color: '#6b7280',
    clauses: [
      { id: '14', text: 'Perusahaan bukan agen pajak dan tidak mengungkapkan data transaksi Klien kecuali atas permintaan resmi dari pihak yang berwenang.' },
    ],
  },
  {
    id: 'masa-berlaku', roman: 'XV', title: 'Masa Berlaku dan Pengakhiran', color: '#0891b2',
    clauses: [
      { id: '15.1', text: 'Perjanjian ini berlaku efektif setelah Klien melakukan pendaftaran di Website. Hak dan kewajiban berdasarkan Perjanjian ini tetap berlaku sampai pengakhiran Perjanjian.' },
      { id: '15.2', text: 'Pengakhiran dapat terjadi: (i) atas inisiatif salah satu Pihak; atau (ii) pada saat Klien meninggal dunia atau tidak mampu secara hukum; atau (iii) pada saat Perusahaan dilikuidasi.' },
      { id: '15.3', text: 'Perusahaan harus memenuhi kewajibannya kepada Klien pada saat pengakhiran sesuai dengan Perjanjian.' },
      { id: '15.4', text: 'Klien dapat mengakhiri Perjanjian kapan saja dengan memblokir Akun mereka melalui antarmuka Akun Pribadi atau Dukungan Perusahaan setelah menarik dana.' },
      { id: '15.5', text: 'Membuka blokir Akun atas permintaan Klien mengembalikan Perjanjian sesuai dengan versi saat ini.' },
      { id: '15.6', text: 'Perusahaan dapat mengakhiri Perjanjian kapan pun secara sepihak tanpa memberikan alasan.' },
      { id: '15.7', text: 'Perusahaan harus memberi tahu Klien setidaknya 1 bulan kalender sebelum penghentian aktivitasnya dan harus membayar penuh dana Akun Klien.' },
      { id: '15.8', text: 'Perusahaan dapat mengubah Perjanjian kapan saja; perubahan berlaku setelah dipublikasikan di Website. Klien bertanggung jawab untuk meninjau pembaruan.' },
      { id: '15.9', text: 'Ketidaksetujuan Klien dengan amandemen mengharuskan penghentian penggunaan layanan dan pemblokiran Akun Klien.' },
    ],
  },
  {
    id: 'ketentuan-akhir', roman: 'XVI', title: 'Ketentuan Akhir', color: '#7c3aed',
    clauses: [
      { id: '16.1', text: 'Klien tidak dapat mengalihkan hak atau kewajiban kepada pihak ketiga berdasarkan Perjanjian ini.' },
      { id: '16.2', text: 'Jika terjadi perbedaan, versi bahasa Inggris yang berlaku di atas terjemahan.' },
      { id: '16.3', text: 'Perjanjian ini diatur oleh hukum Republik Vanuatu. Setiap sengketa yang timbul akhirnya akan diselesaikan oleh pengadilan yang berwenang di Republik Vanuatu.' },
    ],
  },
]

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatsStrip() {
  const stats = [
    { label: 'Total Bab', color: '#2563eb', num: SECTIONS.length, suffix: ' Bab' },
    { label: 'Total Pasal', color: '#059669', num: SECTIONS.reduce((a, s) => a + s.clauses.length, 0), suffix: ' Pasal' },
    { label: 'Min. Trade', color: '#d97706', num: null, value: '$1 / €1' },
    { label: 'Berlaku', color: '#7c3aed', num: null, value: 'Jan 2026' },
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

// ─── Key highlights ────────────────────────────────────────────────────────────

function KeyHighlights() {
  const items = [
    { icon: <FileText size={16} />, title: 'Hukum Vanuatu', desc: 'Perjanjian diatur oleh hukum Republik Vanuatu', color: '#2563eb' },
    { icon: <DollarSign size={16} />, title: 'Deposit Min $10', desc: 'Minimum deposit Rp 10.000 atau setara $10', color: '#059669' },
    { icon: <Shield size={16} />, title: 'Verifikasi KYC', desc: 'Identitas diverifikasi dalam 20 menit–7 hari', color: '#7c3aed' },
    { icon: <Gavel size={16} />, title: 'Sengketa 10 Hari', desc: 'Waktu respons resmi untuk setiap pengaduan', color: '#d97706' },
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
    <motion.div id={`section-${section.id}`}
      className="bg-white rounded-2xl overflow-hidden scroll-mt-20"
      style={{ border: '1px solid #f0f0f0' }}
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...SPRING, delay: index * 0.03 }}
      whileHover={{ boxShadow: `0 8px 32px ${section.color}12`, transition: { duration: 0.25 } }}>

      <motion.div className="h-0.5"
        style={{ background: `linear-gradient(90deg, ${section.color}, ${section.color}60)` }}
        initial={{ scaleX: 0, originX: 0 }} whileInView={{ scaleX: 1 }}
        viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.03 + 0.1, ease: 'easeOut' }} />

      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left hover:bg-gray-50 transition-colors">
        <motion.span
          className="text-[10px] font-black tabular-nums flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white tracking-wide"
          style={{ background: `linear-gradient(135deg, ${section.color}, ${section.color}cc)`, fontSize: '10px' }}
          initial={{ scale: 0, rotate: -90 }} whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }} transition={{ ...SPRING, delay: index * 0.03 + 0.15 }}
          whileHover={{ scale: 1.15, rotate: 5 }}>
          {section.roman}
        </motion.span>
        <p className="flex-1 text-sm sm:text-[15px] font-bold text-gray-800 pr-3 leading-snug">{section.title}</p>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${section.color}12`, color: section.color }}>
            {section.clauses.length} pasal
          </span>
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
            <motion.div variants={stagger(0.05)} initial="hidden" animate="visible">
              {section.clauses.map((clause, i) => (
                <motion.div key={clause.id} variants={fadeUp}
                  className="px-5 sm:px-6 py-4"
                  style={{ borderTop: i > 0 ? '1px solid #f9f9f9' : 'none', background: i % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                  <div className="flex gap-3 sm:gap-4">
                    <motion.span
                      className="text-[10px] font-bold flex-shrink-0 mt-0.5 w-10 sm:w-12 tabular-nums px-1 py-0.5 rounded h-fit text-center"
                      style={{ color: section.color, background: `${section.color}10` }}
                      initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...SPRING, delay: i * 0.04 }}>
                      {clause.id}
                    </motion.span>
                    <p className="text-sm text-gray-600 leading-relaxed">{clause.text}</p>
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
      <motion.div variants={stagger(0.03)} initial="hidden" animate="visible">
        {SECTIONS.map(sec => (
          <motion.button key={sec.id} variants={fadeLeft} onClick={() => onNavigate(sec.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all group"
            whileHover={{ backgroundColor: `${sec.color}08`, x: 2 }} transition={{ duration: 0.15 }}>
            <span className="text-[10px] font-black w-7 text-right flex-shrink-0 tabular-nums" style={{ color: `${sec.color}70` }}>{sec.roman}</span>
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
                  <span className="text-[10px] font-black w-7 text-right flex-shrink-0 tabular-nums" style={{ color: `${sec.color}70` }}>{sec.roman}</span>
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

export default function AgreementPageClient() {
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
      <PageNavbar title="Perjanjian Klien" subtitle="Berlaku mulai 15 Januari 2026"
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

          <AnimatedHeadline text="Perjanjian Klien"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            style={{ letterSpacing: '-0.04em', lineHeight: 1.1 }} />

          <Reveal delay={0.3}>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-6 max-w-2xl">
              Sesuai dengan syarat dan ketentuan yang ditetapkan di sini, Verte Securities Limited,
              perusahaan yang terdaftar berdasarkan hukum Republik Vanuatu, nomor perusahaan{' '}
              <span className="font-semibold text-gray-700">700726</span>, memberikan akses kepada seseorang ('Klien') ke website stouch.com.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <motion.div className="flex flex-wrap gap-3" variants={stagger(0.08)} initial="hidden" animate="visible">
              {[
                { label: 'Berlaku', value: '15 Januari 2026' },
                { label: 'Versi', value: 'Bahasa Indonesia' },
                { label: 'Yurisdiksi', value: 'Republik Vanuatu' },
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

        {/* Stats */}
        <StatsStrip />

        {/* Highlights */}
        <section className="mb-10 sm:mb-12">
          <SectionLabel title="Poin Utama" subtitle="Ringkasan ketentuan penting dalam perjanjian ini" />
          <KeyHighlights />
        </section>

        {/* Body */}
        <div className="flex gap-8 lg:gap-10 items-start">
          <aside className="hidden lg:block w-52 xl:w-60 flex-shrink-0">
            <TableOfContents onNavigate={scrollToSection} />
          </aside>
          <div className="flex-1 min-w-0">
            <SectionLabel title="Isi Perjanjian" subtitle="Klik bab untuk membaca detail ketentuan" />

            {/* Warning banner */}
            <Reveal className="mb-3">
              <motion.div className="rounded-2xl p-4 flex items-start gap-3 mb-5"
                style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
                whileHover={{ boxShadow: '0 8px 24px #f59e0b14', transition: { duration: 0.2 } }}>
                <motion.div initial={{ rotate: -10, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ ...SPRING, delay: 0.5 }}>
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                </motion.div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-bold">Penting:</span> Dengan mendaftar di Website, Klien mengakui penerimaan Perjanjian ini dan Kebijakan Privasi.
                  Penerimaan tersebut merupakan persetujuan penuh dan tanpa syarat untuk semua ketentuan dalam Perjanjian ini.
                  Jika terjadi perbedaan, versi bahasa Inggris yang berlaku.
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
                    <p className="text-xs font-semibold text-gray-700 mb-1">Ketentuan Hukum</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Perjanjian ini diatur oleh hukum Republik Vanuatu. Terakhir diperbarui 15 Januari 2026.
                      Hubungi{' '}<a href="mailto:support@stouch.com" className="text-blue-500 hover:underline font-medium">support@stouch.com</a>
                      {' '}atau{' '}<a href="mailto:complaints@stouch.com" className="text-blue-500 hover:underline font-medium">complaints@stouch.com</a>.
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