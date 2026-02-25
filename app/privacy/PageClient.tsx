'use client'


import { useState, useRef } from 'react'
import { ChevronDown, Menu, X, Shield, Lock, FileText, Eye, Database, Globe, UserCheck, AlertTriangle, Mail } from 'lucide-react'
import PageNavbar from '@/components/PageNavbar'
import {
  motion,
  useInView,
  AnimatePresence,
  type Variants,
} from 'framer-motion'


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
  icon: React.ReactNode
  clauses: Clause[]
}


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


function AnimatedHeadline({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
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
            visible: {
              opacity: 1, y: 0, filter: 'blur(0px)',
              transition: { ...SPRING },
            },
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  )
}


function CountUp({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
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

  return <span ref={ref}>{prefix}{val}{suffix}</span>
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


const SECTIONS: Section[] = [
  {
    id: 'pendahuluan', num: '0', title: 'Pendahuluan', color: '#2563eb',
    icon: <FileText size={12} />,
    clauses: [
      { id: '0.1', text: 'Kebijakan Privasi ini menetapkan bagaimana Verte Securities Limited ("Perusahaan," "Kami") mengumpulkan, menggunakan, mengungkapkan, membagikan, dan melindungi informasi pribadi Anda (termasuk data pribadi apa pun) saat Anda mengakses dan menggunakan Platform Perdagangan stouch melalui website resmi stouch.com, Aplikasi Seluler stouch, dan/atau layanan lain yang disediakan oleh Kami.' },
      { id: '0.2', text: 'Kebijakan Privasi ini merupakan bagian tak terpisahkan dan mengikat secara hukum dari Perjanjian Klien stouch, dan berlaku untuk semua pengguna yang mendaftar di Website atau menggunakan Aplikasi Seluler stouch, terlepas dari lokasi geografisnya.' },
      { id: '0.3', text: 'Data yang Anda berikan dikumpulkan dan diproses oleh Verte Securities Limited, sebuah perusahaan yang didirikan dan beroperasi berdasarkan hukum Republik Vanuatu, dengan nomor perusahaan 700726, dengan alamat terdaftar di International Business Centre, Suite 8, Pot 820/104, Route Elluk, Port Vila, Vanuatu.' },
      { id: '0.4', text: 'Dengan mendaftarkan Akun, masuk ke Website atau Aplikasi Seluler stouch, atau menggunakan bagian mana pun dari Layanan Kami, Anda mengonfirmasi bahwa Anda telah membaca dengan saksama, memahami, dan sepenuhnya menyetujui semua syarat dan ketentuan yang tercantum dalam Kebijakan Privasi ini tanpa syarat.' },
    ],
  },
  {
    id: 'penyediaan-informasi', num: '1', title: 'Penyediaan Informasi Tentang Anda', color: '#059669',
    icon: <UserCheck size={12} />,
    clauses: [
      { id: '1.1', text: 'Pendaftaran Pengguna dan Penyediaan Data Pribadi: Saat membuat Akun di Website atau mengakses Aplikasi Seluler stouch, Anda akan diminta untuk memberikan alamat email yang aktif dan valid. Anda dapat secara sukarela memberikan informasi pribadi tambahan, termasuk nama depan dan belakang, tanggal lahir, jenis kelamin, nomor telepon kontak, dan negara tempat tinggal.' },
      { id: '1.2', text: 'Penyediaan Data Pembayaran dan Identifikasi: Untuk dapat membuka Akun dan mengakses layanan tertentu, Anda akan diminta untuk memberikan informasi spesifik terkait pembayaran, mencakup:', subItems: ['Nama lengkap resmi', 'Nomor kartu bank', 'Tanggal kedaluwarsa kartu', 'Kode verifikasi kartu (CVV/CVC)', 'Detail bank atau lembaga keuangan penerbit', 'Jenis sistem pembayaran (misalnya, Visa, MasterCard)', 'Nomor paspor atau KTP', 'Tanggal lahir', 'Alamat tempat tinggal', 'Alamat email yang valid', 'Nomor telepon aktif', 'Data lain tergantung pada metode pembayaran'] },
      { id: '1.3', text: 'Verifikasi Identitas dan Kepatuhan AML/CTF: Untuk memenuhi kewajiban hukum KYC/AML/CTF, Kami mewajibkan Anda untuk menyerahkan dokumen berikut:', subItems: ['Foto yang jelas atau pindaian dokumen identitas yang sah (paspor atau KTP)', 'Foto sisi depan dan belakang kartu pembayaran yang digunakan untuk transaksi', 'Foto selfie Anda yang sedang memegang dokumen identitas dan kartu pembayaran', 'Tagihan utilitas terbaru yang berisi nama dan alamat Anda (jika diperlukan)', 'Surat referensi dari lembaga perbankan berlisensi (jika diperlukan)', 'Rekening koran yang mencantumkan nama dan riwayat transaksi Anda (jika diperlukan)', 'Dokumen resmi yang memverifikasi asal dana atau aset Anda (jika diperlukan)'] },
      { id: '1.4', text: 'Pengumpulan Data Aktivitas dan Interaksi Pengguna: Selama penggunaan Platform Perdagangan stouch, Kami mengumpulkan dan menyimpan data aktivitas, termasuk:', subItems: ['Catatan upaya login dan aktivitas sesi', 'Tanggal pendaftaran dan kategori akun', 'Riwayat alamat IP dan jenis perangkat yang digunakan', 'Preferensi antarmuka, bahasa yang dipilih, dan zona waktu', 'Jenis dan versi browser', 'Frekuensi dan sifat interaksi dalam Platform Perdagangan stouch', 'Log kesalahan dan data kinerja', 'Riwayat transaksi dan pengaduan', 'Catatan komunikasi dengan tim dukungan Kami'] },
      { id: '1.4.1', text: 'Jika Anda berpartisipasi dalam kampanye promosi atau kegiatan berbasis hadiah, Anda diwajibkan untuk memberikan nama lengkap, alamat pos, dan nomor telepon Anda untuk pengiriman hadiah atau reward.' },
      { id: '1.4.2', text: 'Kami dapat mengundang Anda untuk mengisi survei sukarela atau evaluasi layanan, yang mungkin meminta nama dan detail kontak Anda untuk keperluan umpan balik.' },
      { id: '1.4.3', text: 'Jika Anda menghubungi Layanan Dukungan Kami, Anda akan diminta untuk memberikan nama lengkap dan alamat email yang valid. Semua komunikasi tersebut dapat direkam dan disimpan untuk tujuan jaminan kualitas, penyelesaian sengketa, dan kepatuhan.' },
      { id: '1.5', text: 'Cookie dan Teknologi Pelacakan: Kami menggunakan Cookie dan teknologi pelacakan serupa untuk mendukung fungsionalitas dan kinerja Website. Cookie yang diperlukan meliputi:', subItems: ['Cookie untuk mengidentifikasi sumber akses Anda ke Website', 'Cookie untuk menjaga identitas sesi Anda selama navigasi', 'Cookie yang menyimpan preferensi teknis, seperti bahasa dan zona waktu'] },
      { id: '1.5.1', text: 'Sebagai bagian dari teknologi ini, Kami juga mengumpulkan dan menganalisis Data Penggunaan, termasuk alamat IP, pengidentifikasi sesi, jenis perangkat dan sistem operasi, jenis dan versi browser, zona waktu dan pengaturan bahasa, stempel waktu akses, serta URL atau sumber rujukan.' },
    ],
  },
  {
    id: 'dasar-hukum', num: '2', title: 'Dasar Hukum untuk Pemrosesan Informasi Anda', color: '#7c3aed',
    icon: <Shield size={12} />,
    clauses: [
      { id: '2.1', text: 'Kami mengumpulkan dan memproses data pribadi Anda hanya jika terdapat dasar hukum yang sah, meliputi:', subItems: ['Pelaksanaan Perjanjian: pemrosesan diperlukan untuk pelaksanaan perjanjian antara Anda dan Kami, termasuk Perjanjian Klien stouch', 'Persetujuan: Anda telah secara tegas memberikan persetujuan atas pengumpulan dan penggunaan data pribadi Anda', 'Kepatuhan Hukum: pemrosesan diperlukan untuk mematuhi kewajiban hukum atau peraturan, termasuk AML, CTF, pajak, dan regulasi keuangan', 'Kepentingan yang Sah: pemrosesan diperlukan untuk mengejar kepentingan bisnis sah Kami, seperti pencegahan penipuan dan optimalisasi layanan'] },
      { id: '2.2', text: 'Jika Anda memilih untuk tidak memberikan data pribadi penting tertentu atau menarik persetujuan yang telah diberikan sebelumnya, Kami mungkin tidak dapat memberikan layanan yang diminta atau mempertahankan fungsionalitas Akun Pribadi Anda.' },
    ],
  },
  {
    id: 'penyimpanan', num: '3', title: 'Penyimpanan Informasi Anda', color: '#d97706',
    icon: <Database size={12} />,
    clauses: [
      { id: '3.1', text: 'Kami menyimpan data pribadi Anda hanya selama diperlukan untuk memenuhi tujuan pengumpulannya. Data pribadi Anda dapat disimpan untuk alasan-alasan berikut:', subItems: ['Untuk mematuhi kewajiban yang timbul dari undang-undang dan kerangka peraturan yang berlaku', 'Untuk mendukung kinerja dan penegakan perjanjian yang dibuat dengan Anda', 'Untuk menyelesaikan perselisihan, menyelidiki insiden, atau menangani pengaduan pengguna', 'Untuk mempertahankan catatan bisnis dan operasional historis', 'Untuk melindungi kepentingan sah Kami, termasuk pencegahan penipuan dan pemantauan keamanan'] },
    ],
  },
  {
    id: 'tujuan-pemrosesan', num: '4', title: 'Tujuan Pemrosesan Informasi Anda', color: '#0891b2',
    icon: <Eye size={12} />,
    clauses: [
      { id: '4.1', text: 'Data pribadi yang Kami kumpulkan digunakan untuk memastikan kelancaran operasional Platform Perdagangan stouch. Tujuan utama pemrosesan data Anda meliputi:', subItems: ['Memberikan layanan berkualitas tinggi dan aman di Platform Perdagangan stouch', 'Meningkatkan kenyamanan dan efisiensi platform melalui penerapan Cookie dan teknologi serupa', 'Menyimpan dan memanfaatkan data kunjungan awal dan sesi berikutnya untuk kesinambungan interaksi', 'Menggunakan data pendaftaran dan verifikasi identitas untuk memverifikasi identitas Anda', 'Memastikan transaksi yang sah dan aman dengan memverifikasi dokumen keuangan', 'Memfasilitasi deposit dan transaksi keuangan lainnya', 'Mengumpulkan dan meninjau catatan aktivitas keuangan dan operasional Anda', 'Mengirimkan notifikasi sistem mengenai hal-hal operasional penting', 'Berkomunikasi dengan Anda mengenai perubahan operasional dan pembaruan layanan', 'Memberikan pengalaman pengguna yang dipersonalisasi', 'Menanggapi permintaan dukungan, pertanyaan, atau keluhan Anda secara efektif'] },
      { id: '4.2', text: 'Jika Kami bermaksud menggunakan data pribadi Anda untuk tujuan yang tidak dijelaskan secara eksplisit di atas, Kami akan meminta persetujuan Anda secara eksplisit dan jelas terlebih dahulu.' },
    ],
  },
  {
    id: 'pengungkapan', num: '5', title: 'Pengungkapan Informasi Anda', color: '#dc2626',
    icon: <AlertTriangle size={12} />,
    clauses: [
      { id: '5.1', text: 'Kami dapat mengungkapkan data pribadi Anda hanya jika diperlukan dan sesuai dengan Kebijakan Privasi ini. Pengungkapan dapat terjadi dalam keadaan berikut:', subItems: ['Pengalihan Bisnis: jika Perusahaan terlibat dalam merger, akuisisi, restrukturisasi, atau penjualan aset', 'Kewajiban Hukum dan Penegakan Hukum: jika diwajibkan oleh hukum yang berlaku atau permintaan sah dari otoritas pemerintah', 'Perlindungan Kepentingan Hukum dan Keamanan: ketika diperlukan untuk melindungi hak dan kepentingan Perusahaan atau pengguna'] },
      { id: '5.2', text: 'Kami memastikan bahwa setiap pihak ketiga yang menerima data tersebut terikat secara hukum untuk menjaga kerahasiaan dan memproses data pribadi sesuai dengan peraturan privasi dan perlindungan data yang berlaku.' },
    ],
  },
  {
    id: 'transfer', num: '6', title: 'Transfer Informasi Anda', color: '#db2777',
    icon: <Globe size={12} />,
    clauses: [
      { id: '6.1', text: 'Mengingat sifat internasional dari operasi Kami, data pribadi Anda dapat ditransfer ke, disimpan di, dan diproses di yurisdiksi selain yurisdiksi tempat Anda tinggal. Yurisdiksi ini mungkin tidak menawarkan tingkat perlindungan data yang sama.' },
      { id: '6.2', text: 'Dengan menyetujui Kebijakan Privasi ini, Anda mengakui dan secara tegas menyetujui transfer lintas batas tersebut, yang hanya dilakukan jika diperlukan untuk pelaksanaan perjanjian dan pemenuhan Layanan Kami.' },
      { id: '6.3', text: 'Kami mengambil semua langkah yang diperlukan untuk memastikan transfer data dilakukan dengan perlindungan yang memadai, meliputi:', subItems: ['Membuat perjanjian kontraktual dengan klausul perlindungan data standar yang disetujui otoritas regulasi', 'Memastikan penyedia layanan pihak ketiga beroperasi sesuai dengan kerangka perlindungan data yang kuat', 'Mewajibkan pihak ketiga untuk menjaga perlindungan teknis dan organisasional yang sesuai'] },
      { id: '6.4', text: 'Tidak ada pengalihan data pribadi Anda yang akan dilakukan kecuali Kami yakin bahwa kontrol yang memadai telah diterapkan untuk memastikan keamanan, kerahasiaan, dan perlakuan yang sah atas informasi Anda.' },
    ],
  },
  {
    id: 'hak-anda', num: '7', title: 'Hak Anda Terkait dengan Informasi Anda', color: '#475569',
    icon: <UserCheck size={12} />,
    clauses: [
      { id: '7.1', text: 'Kami mengakui hak-hak Anda berdasarkan undang-undang perlindungan data yang berlaku. Tunduk pada batasan hukum dan kontrak, Anda memiliki hak-hak utama berikut:', subItems: ['Hak Akses: meminta konfirmasi apakah Kami memproses data pribadi Anda dan menerima salinannya', 'Hak untuk Perbaikan: meminta koreksi atas data pribadi yang tidak akurat atau tidak lengkap', 'Hak untuk Penghapusan ("Hak untuk Dilupakan"): meminta penghapusan data pribadi Anda ketika tidak ada lagi dasar hukum yang sah', 'Hak untuk Pembatasan atau Keberatan terhadap Pemrosesan: meminta pembatasan atau mengajukan keberatan terhadap jenis pemrosesan tertentu', 'Hak untuk Menarik Persetujuan: menarik persetujuan Anda kapan saja jika persetujuan menjadi dasar hukum pemrosesan'] },
      { id: '7.2', text: 'Hak-hak ini tidak bersifat mutlak dan dapat tunduk pada batasan berdasarkan hukum yang berlaku, khususnya yang terkait dengan AML, KYC, pelaporan keuangan, atau kewajiban hukum lainnya.' },
    ],
  },
  {
    id: 'pihak-ketiga', num: '8', title: 'Informasi yang Kami Bagikan dengan Pihak Ketiga', color: '#7c3aed',
    icon: <Globe size={12} />,
    clauses: [
      { id: '8.1', text: 'Kami tidak mengungkapkan atau mentransfer data pribadi Anda kepada pihak ketiga yang tidak berafiliasi, kecuali pengungkapan tersebut diperlukan untuk memenuhi kewajiban kontraktual atau hukum Kami.' },
      { id: '8.2', text: 'Pihak ketiga yang dapat menerima data pribadi Anda dari Kami meliputi:', subItems: ['Karyawan Kami atau karyawan entitas afiliasi yang memerlukan akses untuk melaksanakan tugas mereka', 'Auditor profesional independen untuk tujuan kepatuhan atau audit peraturan', 'Organisasi penyelesaian sengketa atau arbiter yang menangani klaim atau keluhan hukum Anda', 'Sistem pembayaran dan lembaga keuangan yang terlibat dalam memproses transaksi Anda', 'Penyedia Sistem Pembayaran yang membantu pelaksanaan deposit, penarikan, dan operasi moneter lainnya', 'Penyedia layanan verifikasi identitas dan KYC untuk mematuhi persyaratan AML/CTF', 'Penyedia layanan infrastruktur dan TI yang penting untuk fungsionalitas Platform Perdagangan stouch'] },
      { id: '8.3', text: 'Untuk verifikasi identitas dan transaksi, kami bekerja sama dengan Sum and Substance Limited (Nomor Registrasi Inggris 09688671). Untuk informasi lebih lanjut, lihat Kebijakan Privasi SumSub: https://sumsub.com/privacy-notice/' },
      { id: '8.4', text: 'Kami juga dapat memberikan informasi agregat, anonim, atau statistik kepada mitra analitik dan pemasaran pihak ketiga, termasuk:', subItems: ['Google Analytics: untuk mengevaluasi interaksi pengguna dengan Platform Perdagangan stouch', 'Cloudflare: platform jaringan dan keamanan yang memproses dan melindungi data selama transmisi', 'Zendesk: penyedia layanan dukungan yang memproses komunikasi dengan tim dukungan Kami'] },
      { id: '8.5', text: 'Untuk keperluan pengiriman materi promosi dan hadiah, Kami dapat membagikan nama lengkap, alamat pengiriman, dan nomor telepon Anda kepada penyedia layanan pos atau kurir resmi.' },
      { id: '8.6', text: 'Apabila Perusahaan terlibat dalam merger, akuisisi, atau restrukturisasi, data pribadi Anda dapat dialihkan ke entitas baru, dengan ketentuan bahwa pihak penerima berkomitmen untuk terus melindungi data Anda.' },
      { id: '8.7', text: 'Kami dapat mentransfer data pribadi Anda ke negara-negara di luar Wilayah Ekonomi Eropa dengan memastikan perlindungan yang memadai telah diterapkan untuk menjamin tingkat perlindungan yang sebanding.' },
      { id: '8.8', text: 'Dalam keadaan luar biasa, dan hanya dengan persetujuan tegas Anda sebelumnya, Kami dapat membagikan data pribadi Anda dengan pihak ketiga yang tidak tercantum dalam Kebijakan Privasi ini.' },
    ],
  },
  {
    id: 'keamanan', num: '9', title: 'Melindungi Informasi Teknis dan Pribadi', color: '#2563eb',
    icon: <Lock size={12} />,
    clauses: [
      { id: '9.1', text: 'Kami menerapkan serangkaian perlindungan administratif, teknis, dan organisasi yang komprehensif yang dirancang untuk melindungi data pribadi Anda dan semua informasi lain yang dikirimkan atau disimpan melalui Platform Perdagangan stouch.' },
      { id: '9.2', text: 'Untuk melindungi transfer data antara perangkat Anda dan server Kami, Kami menggunakan teknologi enkripsi Secure Sockets Layer (SSL). Hal ini memastikan bahwa semua komunikasi dikirimkan dalam format terenkripsi dan aman, terlindungi dari intersepsi atau manipulasi oleh pihak ketiga.' },
      { id: '9.3', text: 'Meskipun Kami menerapkan teknologi dan praktik standar industri, penting untuk dipahami bahwa tidak ada metode transmisi melalui internet atau penyimpanan elektronik yang sepenuhnya aman. Kami mengimbau Anda untuk berhati-hati saat membagikan informasi sensitif secara daring.' },
    ],
  },
  {
    id: 'kata-sandi', num: '10', title: 'Kata Sandi dan Keamanan Akun', color: '#059669',
    icon: <Lock size={12} />,
    clauses: [
      { id: '10.1', text: 'Saat membuat Akun di Platform Perdagangan stouch, Anda diwajibkan untuk memberikan alamat email yang valid dan membuat kata sandi yang kuat dan rahasia. Kata sandi ini hanya Anda yang tahu dan tidak dapat dilihat atau diakses oleh sistem Kami dalam bentuk teks biasa.' },
      { id: '10.2', text: 'Kami tidak memiliki kemampuan atau hak untuk mengubah kata sandi atau kredensial email Anda. Anda bertanggung jawab penuh untuk menjaga kerahasiaan kredensial login Anda dan atas semua aktivitas yang dilakukan melalui Akun Anda.' },
      { id: '10.3', text: 'Kami sangat menyarankan agar Anda:', subItems: ['Menggunakan kata sandi yang unik dan kompleks yang terdiri dari campuran huruf, angka, dan simbol', 'Menghindari penggunaan kata sandi yang sama di beberapa layanan', 'Mengubah kata sandi Anda secara berkala dan segera jika Anda mencurigai adanya peretasan'] },
      { id: '10.4', text: 'Jika Anda mendeteksi atau mencurigai adanya penggunaan Akun Anda yang tidak sah atau melihat aktivitas mencurigakan, Anda harus segera memberi tahu Layanan Dukungan Kami agar tindakan cepat dapat diambil.' },
    ],
  },
  {
    id: 'anak-di-bawah-umur', num: '11', title: 'Penggunaan Layanan Kami oleh Anak di Bawah Umur', color: '#d97706',
    icon: <AlertTriangle size={12} />,
    clauses: [
      { id: '11.1', text: 'Layanan kami ditujukan khusus bagi individu yang telah mencapai usia dewasa sesuai hukum yang berlaku di yurisdiksi masing-masing. Kami tidak dengan sengaja mengumpulkan, memproses, atau menyimpan data pribadi dari individu di bawah umur.' },
      { id: '11.2', text: 'Jika Kami mengetahui bahwa seseorang yang tidak memenuhi persyaratan usia legal minimum telah mencoba mendaftar atau memberikan data pribadi, Kami akan segera menghapus informasi tersebut dari sistem Kami dan menutup Akun terkait.' },
      { id: '11.3', text: 'Kami sangat menganjurkan orang tua dan wali sah untuk memantau aktivitas online anak di bawah umur dan membantu Kami dalam menegakkan ketentuan ini.' },
      { id: '11.4', text: 'Dengan menggunakan Platform Perdagangan stouch Kami, Anda menyatakan dan menjamin bahwa Anda telah cukup umur sesuai dengan hukum di yurisdiksi Anda dan memiliki kapasitas hukum penuh.' },
    ],
  },
  {
    id: 'perubahan', num: '12', title: 'Perubahan pada Kebijakan Privasi Ini', color: '#dc2626',
    icon: <FileText size={12} />,
    clauses: [
      { id: '12.1', text: 'Kami berhak untuk merevisi, memperbarui, atau mengubah Kebijakan Privasi ini dari waktu ke waktu untuk menyesuaikan dengan perubahan hukum, peraturan, praktik kami, atau peningkatan layanan. Setiap perubahan tidak akan pernah membatasi atau mengurangi hak hukum Anda.' },
      { id: '12.2', text: 'Setiap kali Kami membuat perubahan material, versi yang direvisi akan dipublikasikan di Website dan akan menunjukkan tanggal revisi terakhir. Kami juga akan memberi tahu Anda melalui email atau metode komunikasi wajar lainnya.' },
      { id: '12.3', text: 'Kelanjutan penggunaan Anda atas Website, Aplikasi Seluler stouch, atau Layanan Kami setelah perubahan berlaku efektif merupakan pengakuan dan penerimaan Anda atas ketentuan yang diperbarui.' },
      { id: '12.4', text: 'Apabila terdapat perbedaan antara versi Bahasa Inggris Kebijakan Privasi ini dan terjemahannya ke dalam bahasa lain, versi Bahasa Inggris yang akan berlaku untuk tujuan interpretasi dan penegakan hukum.' },
    ],
  },
  {
    id: 'kontak', num: '13', title: 'Informasi Kontak', color: '#475569',
    icon: <Mail size={12} />,
    clauses: [
      { id: '13.1', text: 'Jika Anda memiliki pertanyaan, permasalahan, atau permintaan terkait pemrosesan data pribadi Anda, atau jika Anda ingin menggunakan hak Anda sebagaimana dijelaskan dalam Kebijakan Privasi ini, termasuk menarik persetujuan Anda atau memverifikasi data yang Kami simpan tentang Anda, Anda dapat menghubungi tim perlindungan data kami di: dataprotection@stouch.com' },
    ],
  },
]


function StatsStrip() {
  const stats = [
    { label: 'Total Bab', color: '#2563eb', num: 14, suffix: ' Bab' },
    { label: 'Berlaku Sejak', color: '#059669', num: null, value: 'Jan 2026' },
    { label: 'Diperbarui', color: '#d97706', num: null, value: '2026' },
    { label: 'Versi Bahasa', color: '#7c3aed', num: 2, suffix: ' Versi' },
  ]

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12"
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      {stats.map((s) => (
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


function SectionCard({ section, index }: { section: Section; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      id={`section-${section.id}`}
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid #f0f0f0', background: '#fff' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...SPRING, delay: index * 0.04 }}
      whileHover={{ boxShadow: `0 8px 32px ${section.color}12`, transition: { duration: 0.25 } }}
    >

      <motion.div
        className="h-0.5"
        style={{ background: `linear-gradient(90deg, ${section.color}, ${section.color}60)` }}
        initial={{ scaleX: 0, originX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.04 + 0.1, ease: 'easeOut' }}
      />

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all hover:bg-gray-50"
      >
        <motion.div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-[11px] tabular-nums"
          style={{ background: `linear-gradient(135deg, ${section.color}, ${section.color}cc)` }}
          initial={{ scale: 0, rotate: -90 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ ...SPRING, delay: index * 0.04 + 0.15 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          {section.icon}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tabular-nums" style={{ color: `${section.color}80` }}>
              {section.num}
            </span>
            <span className="text-sm font-semibold text-gray-800 leading-tight">{section.title}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">{section.clauses.length} ketentuan</p>
        </div>

        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex-shrink-0"
        >
          <ChevronDown size={15} className="text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: 'hidden', borderTop: '1px solid #f5f5f5' }}
          >
            <motion.div
              className="px-5 pb-5 space-y-0"
              variants={stagger(0.06)}
              initial="hidden"
              animate="visible"
            >
              {section.clauses.map((clause, ci) => (
                <motion.div
                  key={clause.id}
                  variants={fadeUp}
                  className="pt-4"
                >
                  <div className="flex items-start gap-3">
                    <motion.span
                      className="text-[10px] font-black flex-shrink-0 tabular-nums mt-0.5 px-1.5 py-0.5 rounded"
                      style={{ color: section.color, background: `${section.color}10` }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...SPRING, delay: ci * 0.05 }}
                    >
                      {clause.id}
                    </motion.span>
                    <p className="text-sm text-gray-600 leading-relaxed">{clause.text}</p>
                  </div>

                  {clause.subItems && (
                    <motion.ul
                      className="mt-2.5 ml-8 space-y-1.5"
                      variants={stagger(0.04)}
                      initial="hidden"
                      animate="visible"
                    >
                      {clause.subItems.map((item, i) => (
                        <motion.li
                          key={i}
                          variants={fadeLeft}
                          className="flex items-start gap-2.5"
                        >
                          <motion.span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                            style={{ background: `${section.color}60` }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ ...SPRING, delay: i * 0.04 }}
                          />
                          <span className="text-xs text-gray-500 leading-relaxed">{item}</span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}


function TableOfContents({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <motion.div
      className="rounded-2xl p-4 sticky top-6"
      style={{ border: '1px solid #f0f0f0', background: '#fff' }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SPRING, delay: 0.3 }}
    >
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Daftar Isi</p>
      <motion.div
        className="space-y-0.5"
        variants={stagger(0.04)}
        initial="hidden"
        animate="visible"
      >
        {SECTIONS.map((sec, i) => (
          <motion.button
            key={sec.id}
            variants={fadeLeft}
            onClick={() => onNavigate(sec.id)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-all group"
            whileHover={{ backgroundColor: `${sec.color}08`, x: 2 }}
            transition={{ duration: 0.15 }}
          >
            <motion.span
              className="text-[10px] font-black w-5 text-right flex-shrink-0 tabular-nums"
              style={{ color: `${sec.color}70` }}
            >
              {sec.num}
            </motion.span>
            <span className="text-xs text-gray-500 group-hover:text-gray-800 transition-colors leading-tight font-medium">{sec.title}</span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  )
}


function MobileTOC({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (id: string) => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[75vh] overflow-y-auto"
            style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="px-5 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white" style={{ borderBottom: '1px solid #f5f5f5' }}>
              <p className="text-sm font-bold text-gray-800">Daftar Isi</p>
              <motion.button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={13} className="text-gray-500" />
              </motion.button>
            </div>
            <motion.div
              className="p-3 space-y-0.5 pb-8"
              variants={stagger(0.03)}
              initial="hidden"
              animate="visible"
            >
              {SECTIONS.map(sec => (
                <motion.button
                  key={sec.id}
                  variants={fadeLeft}
                  onClick={() => { onNavigate(sec.id); onClose() }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all"
                  whileHover={{ backgroundColor: `${sec.color}08`, x: 4 }}
                >
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


function ProtectionHighlights() {
  const items = [
    { icon: <Lock size={16} />, title: 'Enkripsi SSL', desc: 'Semua data ditransmisikan dengan enkripsi end-to-end', color: '#2563eb' },
    { icon: <Shield size={16} />, title: 'Proteksi AML/KYC', desc: 'Verifikasi identitas ketat untuk keamanan transaksi', color: '#059669' },
    { icon: <Eye size={16} />, title: 'Transparansi Penuh', desc: 'Anda tahu data apa yang kami kumpulkan dan mengapa', color: '#7c3aed' },
    { icon: <UserCheck size={16} />, title: 'Hak Pengguna', desc: 'Akses, ubah, atau hapus data Anda kapan saja', color: '#d97706' },
  ]

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10"
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.title}
          variants={{
            hidden: { opacity: 0, y: 32 },
            visible: { opacity: 1, y: 0, transition: { ...SPRING, delay: i * 0.1 } },
          }}
          className="bg-white rounded-2xl p-4 sm:p-5"
          style={{ border: '1px solid #f0f0f0' }}
          whileHover={{ y: -4, boxShadow: `0 12px 32px ${item.color}18`, transition: { duration: 0.2 } }}
        >
          <motion.div
            className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${item.color}12`, color: item.color }}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ ...SPRING, delay: i * 0.1 + 0.2 }}
            whileHover={{ rotate: 10, scale: 1.1 }}
          >
            {item.icon}
          </motion.div>
          <p className="text-xs font-bold text-gray-800 mb-1">{item.title}</p>
          <p className="text-[11px] text-gray-400 leading-relaxed">{item.desc}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}


export default function PrivacyPageClient() {
  const [tocOpen, setTocOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`section-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })

      setTimeout(() => {
        const btn = el.querySelector('button') as HTMLButtonElement | null
        if (btn) btn.click()
      }, 400)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageNavbar
        title="Kebijakan Privasi"
        subtitle="Berlaku mulai 15 Januari 2026"
        rightSlot={
          <button
            onClick={() => setTocOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 transition-all hover:bg-gray-100"
            style={{ background: '#f6f6f6' }}
          >
            <Menu size={13} />Isi
          </button>
        }
      />

      <MobileTOC open={tocOpen} onClose={() => setTocOpen(false)} onNavigate={scrollToSection} />

      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 pb-20">


        <div className="py-10 sm:py-12 lg:py-16">
          <Reveal variants={scaleIn}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 mb-5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Dokumen Legal Resmi</span>
            </div>
          </Reveal>

          <AnimatedHeadline
            text="Kebijakan Privasi Kami"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            style={{ letterSpacing: '-0.04em', lineHeight: 1.1 }}
          />

          <Reveal delay={0.3}>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl leading-relaxed mb-6">
              Kami berkomitmen untuk menjaga kerahasiaan, keamanan, dan integritas semua data pribadi
              yang Anda percayakan kepada kami saat menggunakan Platform Perdagangan stouch.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <motion.div
              className="flex flex-wrap gap-3"
              variants={stagger(0.08)}
              initial="hidden"
              animate="visible"
            >
              {[
                { label: 'Berlaku', value: '15 Januari 2026' },
                { label: 'Versi', value: 'Bahasa Indonesia' },
                { label: 'Perusahaan', value: 'Verte Securities Ltd.' },
                { label: 'Total Bab', value: `${SECTIONS.length} Bab` },
              ].map(({ label, value }) => (
                <motion.div
                  key={label}
                  variants={scaleIn}
                  className="px-3 py-2 rounded-xl bg-white"
                  style={{ border: '1px solid #f0f0f0' }}
                  whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(0,0,0,0.07)', transition: { duration: 0.15 } }}
                >
                  <p className="text-[10px] text-gray-400">{label}</p>
                  <p className="text-xs font-bold text-gray-700">{value}</p>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>
        </div>


        <StatsStrip />


        <section className="mb-10 sm:mb-12">
          <SectionLabel title="Komitmen Kami" subtitle="Empat pilar perlindungan data Anda" />
          <ProtectionHighlights />
        </section>


        <Reveal>
          <motion.div
            className="rounded-2xl p-4 sm:p-5 flex items-start gap-3 mb-8"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div>
              <p className="text-xs font-bold text-emerald-700 mb-0.5">Komitmen Perlindungan Data</p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Kami berkomitmen untuk menjaga kerahasiaan, keamanan, dan integritas semua data pribadi yang Anda percayakan kepada Kami.
                Kebijakan Privasi ini merupakan bagian tak terpisahkan dari{' '}
                <a href="/agreement" className="font-semibold underline underline-offset-2 hover:text-emerald-900 transition-colors">Perjanjian Klien stouch</a>.
              </p>
            </div>
          </motion.div>
        </Reveal>


        <div className="flex gap-8 lg:gap-10 items-start">
          <aside className="hidden lg:block w-52 xl:w-60 flex-shrink-0">
            <TableOfContents onNavigate={scrollToSection} />
          </aside>

          <div className="flex-1 min-w-0">
            <SectionLabel title="Isi Kebijakan" subtitle="Klik bab untuk membaca detail ketentuan" />


            <Reveal className="mb-3">
              <motion.div
                className="rounded-2xl p-4 flex items-start gap-3 mb-5"
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
                whileHover={{ boxShadow: '0 8px 24px #2563eb14', transition: { duration: 0.2 } }}
              >
                <motion.div
                  initial={{ rotate: -10, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ ...SPRING, delay: 0.5 }}
                >
                  <Shield size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                </motion.div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  <span className="font-bold">Pengendali Data:</span> Verte Securities Limited — perusahaan yang didirikan berdasarkan hukum Republik Vanuatu,
                  nomor perusahaan 700726, beralamat di International Business Centre, Suite 8, Port Vila, Vanuatu.
                  Kontak perlindungan data:{' '}
                  <a href="mailto:dataprotection@stouch.com" className="font-semibold hover:underline">dataprotection@stouch.com</a>.
                </p>
              </motion.div>
            </Reveal>


            <div className="space-y-3">
              {SECTIONS.map((section, index) => (
                <SectionCard key={section.id} section={section} index={index} />
              ))}
            </div>


            <Reveal className="mt-6">
              <motion.div
                className="rounded-2xl p-5"
                style={{ background: '#f8fafc', border: '1px solid #e8edf2' }}
                whileHover={{ boxShadow: '0 8px 24px rgba(0,0,0,0.06)', transition: { duration: 0.2 } }}
              >
                <div className="flex items-start gap-3">
                  <Lock size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Informasi Hukum</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Kebijakan Privasi ini terakhir diperbarui pada 15 Januari 2026. Untuk pertanyaan terkait perlindungan data pribadi, hubungi{' '}
                      <a href="mailto:dataprotection@stouch.com" className="text-blue-500 hover:underline font-medium">
                        dataprotection@stouch.com
                      </a>.
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