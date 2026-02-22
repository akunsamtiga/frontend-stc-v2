'use client'

// app/help-center/PageClient.tsx
import { useState } from 'react'
import PageNavbar from '@/components/PageNavbar'
import {
  ChevronDown, ChevronUp, Search, X,
  Mail, MessageCircle, ChevronRight
} from 'lucide-react'

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
          { title: 'Masalah umum pada 2FA', content: 'Jika kode 2FA tidak diterima: (1) Pastikan waktu dan tanggal perangkatmu sudah sinkron — aplikasi autentikator sangat bergantung pada waktu yang akurat. (2) Pastikan kamu menggunakan kode yang dihasilkan untuk akun Stouch, bukan akun lain. (3) Kode diperbarui setiap 30 detik, tunggu kode baru jika kode saat ini hampir kedaluwarsa. (4) Jangan gunakan tanda hubung atau huruf kapital dalam kode. Jika masih bermasalah, gunakan kode pemulihan yang sudah kamu simpan sebelumnya.' },
        ],
      },
      {
        title: 'Pendaftaran & Login',
        articles: [
          { title: 'Cara mendaftar di Stouch?', content: 'Kunjungi halaman utama Stouch dan klik tombol "Daftar". Isi formulir dengan email aktif dan buat password yang kuat (minimal 8 karakter, kombinasi huruf besar, kecil, dan angka). Setelah mendaftar, cek email kamu untuk konfirmasi akun. Klik tautan konfirmasi dan akun kamu siap digunakan.' },
          { title: 'Lupa password, apa yang harus dilakukan?', content: 'Di halaman login, klik tautan "Lupa Password?" di bawah kolom password. Masukkan alamat email yang terdaftar di Stouch, lalu klik "Kirim". Cek email kamu untuk instruksi reset password. Tautan reset hanya berlaku selama 24 jam. Setelah mereset, kamu bisa login dengan password baru.' },
          { title: 'Cara mengonfirmasi alamat email?', content: 'Setelah mendaftar, Stouch akan mengirimkan email konfirmasi ke alamat yang kamu daftarkan. Buka email tersebut dan klik tombol atau tautan "Konfirmasi Email". Jika tidak menerima email dalam 5 menit, cek folder spam. Kamu juga bisa meminta pengiriman ulang email konfirmasi dari halaman pengaturan akun.' },
        ],
      },
      {
        title: 'Detail Akun',
        articles: [
          { title: 'Cara mengubah email atau nomor telepon?', content: 'Buka Pengaturan → tab Profil. Di bagian "Informasi Kontak", klik ikon edit di sebelah email atau nomor telepon. Masukkan data baru dan konfirmasi dengan password akunmu. Untuk perubahan email, kamu akan menerima email verifikasi di alamat baru. Klik tautan di email tersebut untuk menyelesaikan perubahan.' },
          { title: 'Cara mengubah mata uang akun?', content: 'Mata uang akun ditetapkan saat pendaftaran dan tidak dapat diubah setelah akun aktif. Jika kamu membutuhkan mata uang yang berbeda, silakan hubungi tim support kami di support@stouch.id untuk bantuan lebih lanjut.' },
          { title: 'Cara memblokir akun saya?', content: 'Jika kamu mencurigai adanya akses tidak sah ke akun, segera hubungi support kami melalui live chat atau email support@stouch.id. Tim kami dapat memblokir akun sementara untuk melindungi danamu. Kamu juga dapat mengubah password segera untuk mengamankan akun.' },
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
          { title: 'Mengapa akun saya perlu diverifikasi?', content: 'Verifikasi identitas (KYC) diperlukan untuk melindungi keamanan akunmu dan memastikan kepatuhan terhadap regulasi keuangan. Akun yang terverifikasi mendapatkan akses ke seluruh fitur platform, termasuk penarikan dana ke rekening bank. Proses ini juga melindungi dari penyalahgunaan akun oleh pihak tidak berwenang.' },
          { title: 'Dokumen apa yang dibutuhkan untuk verifikasi?', content: 'Untuk verifikasi identitas, kamu perlu mengunggah: (1) KTP atau paspor yang masih berlaku — foto harus jelas dan tidak buram. (2) Foto selfie sambil memegang dokumen identitas tersebut. Pastikan semua data pada dokumen terlihat jelas. Format yang diterima: JPG, PNG, PDF (maks. 2MB per file).' },
          { title: 'Berapa lama proses verifikasi?', content: 'Verifikasi biasanya selesai dalam 1–3 hari kerja setelah dokumen diterima. Kamu akan mendapatkan notifikasi melalui email ketika verifikasi selesai. Jika dokumen yang diunggah kurang jelas atau tidak lengkap, tim kami akan menghubungi kamu melalui email untuk meminta dokumen tambahan.' },
          { title: 'Verifikasi saya ditolak, apa yang harus dilakukan?', content: 'Jika verifikasi ditolak, kamu akan menerima email berisi alasan penolakan. Perbaiki masalah yang disebutkan (misalnya: foto tidak jelas, dokumen kedaluwarsa) lalu unggah ulang dokumen dari halaman Profil → Verifikasi. Pastikan foto diambil dalam pencahayaan yang baik dan semua teks pada dokumen dapat terbaca dengan jelas.' },
        ],
      },
      {
        title: 'Verifikasi Rekening Bank',
        articles: [
          { title: 'Cara menambahkan rekening bank?', content: 'Buka Profil → tab Rekening Bank → klik "Tambah Rekening". Isi nama bank, nomor rekening, dan nama pemilik rekening sesuai KTP. Pastikan nama pemilik rekening sama dengan nama akun Stouch kamu. Rekening yang telah diverifikasi akan digunakan sebagai tujuan penarikan dana.' },
          { title: 'Rekening bank saya perlu diverifikasi, berapa lamanya?', content: 'Verifikasi rekening bank membutuhkan waktu 1–2 hari kerja. Tim kami akan melakukan pengecekan untuk memastikan rekening valid dan sesuai dengan data KYC. Kamu akan mendapat notifikasi email setelah verifikasi selesai.' },
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
          { title: 'Apa itu binary option trading?', content: 'Binary option adalah instrumen trading di mana kamu memprediksi apakah harga suatu aset akan naik (CALL) atau turun (PUT) dalam jangka waktu tertentu. Jika prediksimu benar, kamu mendapatkan profit sesuai profit rate yang berlaku (hingga 95% untuk VIP). Jika salah, kamu kehilangan modal yang kamu pasang pada trade tersebut.' },
          { title: 'Aset apa saja yang tersedia di Stouch?', content: 'Stouch menyediakan berbagai aset trading: (1) Forex — pasangan mata uang utama seperti EUR/USD, GBP/USD, USD/JPY. (2) Cryptocurrency — BTC/USD, ETH/USD, dan lebih dari 20 koin kripto lainnya. (3) Komoditas — Emas (XAU/USD), Minyak, Perak. (4) Indeks Saham — S&P 500, NASDAQ, Dow Jones. Semua aset tersedia 24/7 untuk akun demo.' },
          { title: 'Berapa durasi trading yang tersedia?', content: 'Stouch menyediakan berbagai durasi trade: 1 detik, 1 menit, 2 menit, 3 menit, 5 menit, 10 menit, 15 menit, 30 menit, 45 menit, hingga 1 jam. Semakin pendek durasi, semakin tinggi volatilitas harga yang perlu diperhitungkan.' },
          { title: 'Berapa batas minimum dan maksimum trade?', content: 'Minimum trade: Rp 1.000 per transaksi. Maksimum trade bervariasi tergantung aset dan akun, umumnya hingga Rp 1.000.000 per transaksi. Untuk akun demo, kamu dapat berlatih dengan modal virtual tanpa batasan. Limit ini dapat berbeda untuk setiap aset.' },
        ],
      },
      {
        title: 'Akun Demo',
        articles: [
          { title: 'Apa itu akun demo?', content: 'Akun demo adalah akun latihan dengan saldo virtual yang memungkinkan kamu berlatih trading tanpa risiko kehilangan uang nyata. Semua fitur platform tersedia di akun demo, termasuk semua aset dan durasi trading. Saldo demo dapat di-reset kapan saja dari halaman pengaturan.' },
          { title: 'Bagaimana cara beralih antara akun demo dan real?', content: 'Di pojok kiri atas halaman trading, kamu akan menemukan toggle untuk beralih antara "Demo" dan "Real". Klik toggle tersebut untuk berpindah akun. Perlu diingat: profit dari akun demo tidak dapat ditarik dan tidak mempengaruhi saldo real kamu.' },
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
          { title: 'Metode deposit apa yang tersedia?', content: 'Stouch mendukung berbagai metode deposit: (1) Transfer Bank — BCA, Mandiri, BNI, BRI, dan bank lainnya. (2) E-Wallet — GoPay, OVO, Dana, ShopeePay. (3) Virtual Account — tersedia untuk semua bank utama di Indonesia. Semua transaksi deposit diproses secara aman menggunakan enkripsi SSL.' },
          { title: 'Berapa jumlah minimum deposit?', content: 'Minimum deposit di Stouch adalah Rp 10.000. Tidak ada batas maksimum untuk deposit. Dana yang kamu setorkan akan tersedia di akun real dalam beberapa menit setelah pembayaran dikonfirmasi.' },
          { title: 'Berapa lama proses deposit?', content: 'Untuk metode transfer bank dan virtual account: dana biasanya masuk dalam 5–15 menit setelah pembayaran. Untuk e-wallet: dana masuk secara instan setelah konfirmasi pembayaran. Jika dana belum masuk dalam 1 jam, hubungi support kami dengan menyertakan bukti transfer.' },
          { title: 'Deposit saya belum masuk setelah lebih dari 1 jam, apa yang harus dilakukan?', content: 'Jika deposit belum masuk setelah 1 jam: (1) Cek riwayat transaksi di aplikasi bank atau e-wallet untuk memastikan pembayaran berhasil. (2) Simpan bukti transfer/pembayaran. (3) Hubungi support kami melalui live chat atau email support@stouch.id dengan menyertakan bukti pembayaran dan jumlah yang ditransfer.' },
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
          { title: 'Bagaimana cara melakukan penarikan?', content: 'Buka menu Keuangan → Tarik Dana. Pilih rekening bank yang sudah terverifikasi, masukkan jumlah yang ingin ditarik, lalu klik "Ajukan Penarikan". Penarikan hanya dapat dilakukan ke rekening bank atas nama yang sama dengan akun Stouch. Pastikan akun kamu sudah terverifikasi sepenuhnya sebelum melakukan penarikan.' },
          { title: 'Berapa batas minimum dan maksimum penarikan?', content: 'Minimum penarikan: Rp 50.000. Batas maksimum harian tergantung status tier kamu: Standard: Rp 5.000.000/hari, Gold: Rp 20.000.000/hari, VIP: tidak terbatas. Upgrade status kamu dengan meningkatkan total deposit untuk mendapatkan limit penarikan lebih tinggi.' },
          { title: 'Berapa lama proses penarikan?', content: 'Waktu proses penarikan bergantung pada status tier kamu: Standard: 1–3 hari kerja, Gold: kurang dari 12 jam, VIP: kurang dari 1 jam (ekspres). Waktu proses dihitung sejak penarikan disetujui oleh tim kami. Penarikan yang diajukan di luar jam kerja akan diproses pada hari kerja berikutnya (kecuali VIP).' },
          { title: 'Syarat apa yang dibutuhkan untuk penarikan?', content: 'Untuk dapat melakukan penarikan, akun kamu harus memenuhi syarat berikut: (1) Verifikasi identitas (KYC) selesai. (2) Foto selfie terverifikasi. (3) Rekening bank sudah terdaftar dan diverifikasi atas nama yang sama dengan akun. (4) Tidak ada order trading yang sedang aktif (status ACTIVE).' },
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
          { title: 'Apa itu turnamen di Stouch?', content: 'Turnamen adalah kompetisi trading berkala yang diadakan oleh Stouch. Peserta bersaing untuk mendapatkan profit tertinggi dalam periode turnamen menggunakan akun demo khusus turnamen. Pemenang akan mendapatkan hadiah berupa saldo real yang dapat langsung digunakan untuk trading.' },
          { title: 'Bagaimana cara bergabung dengan turnamen?', content: 'Buka menu Turnamen di aplikasi, pilih turnamen yang tersedia, lalu klik "Daftar". Setiap turnamen memiliki ketentuan berbeda (durasi, hadiah, aset yang digunakan). Setelah mendaftar, kamu akan mendapatkan akun demo khusus turnamen dengan saldo awal yang telah ditentukan.' },
          { title: 'Bagaimana hadiah turnamen dibagikan?', content: 'Hadiah turnamen diberikan dalam bentuk saldo real yang langsung ditambahkan ke akun pemenang setelah turnamen berakhir. Jumlah hadiah dan distribusi ke setiap peringkat tertera di halaman detail turnamen. Pastikan akunmu sudah terverifikasi untuk dapat menerima hadiah.' },
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
          { title: 'Promosi apa saja yang tersedia di Stouch?', content: 'Stouch secara rutin mengadakan berbagai promosi untuk trader aktif, termasuk: (1) Bonus deposit — bonus persentase dari jumlah deposit tertentu. (2) Cashback trading — pengembalian sebagian dari trade yang kalah. (3) Promo event khusus — hadiah ekstra di momen tertentu (hari raya, anniversary, dll). Pantau halaman Promosi atau notifikasi di aplikasi untuk info promo terbaru.' },
          { title: 'Bagaimana cara mengklaim bonus?', content: 'Bonus biasanya diklaim secara otomatis setelah syarat terpenuhi (misalnya: setelah deposit minimum tertentu). Untuk bonus yang memerlukan kode promo, masukkan kode di halaman deposit sebelum melakukan pembayaran. Baca syarat dan ketentuan setiap promo dengan cermat sebelum mengklaim.' },
          { title: 'Apa itu program afiliasi Stouch?', content: 'Program afiliasi Stouch memungkinkan kamu mendapatkan komisi dari setiap trader yang mendaftar menggunakan kode referral kamu. Komisi diberikan secara otomatis ke akun kamu setiap kali trader yang kamu referensikan melakukan trade. Tidak ada batas maksimum komisi — semakin banyak trader yang kamu ajak, semakin besar penghasilan afiliasi kamu.' },
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
          { title: 'Apa perbedaan status Standard, Gold, dan VIP?', content: 'Stouch memiliki 3 tier status: (1) Standard — akses semua fitur dasar, profit rate standar, limit tarik Rp 5 jt/hari. (2) Gold — bonus profit +5%, limit tarik Rp 20 jt/hari, analisis market mingguan, support live chat prioritas. (3) VIP — bonus profit +10%, limit tarik tidak terbatas, penarikan ekspres < 1 jam, dedicated account manager, sinyal trading premium.' },
          { title: 'Bagaimana cara naik ke status Gold atau VIP?', content: 'Status naik secara otomatis berdasarkan total akumulasi deposit kamu — bukan saldo saat ini. Standard: deposit awal (gratis). Gold: total deposit ≥ Rp 200.000. VIP: total deposit ≥ Rp 1.600.000. Tidak perlu request manual — sistem akan memperbarui status kamu secara otomatis setelah syarat deposit terpenuhi.' },
          { title: 'Apakah status bisa turun?', content: 'Tidak. Status kamu tidak akan turun meskipun saldo berkurang atau kamu melakukan penarikan. Status hanya dihitung dari total historis deposit, bukan dari saldo aktif. Jadi setelah mencapai Gold atau VIP, statusmu akan tetap permanen.' },
          { title: 'Apa itu sinyal trading premium untuk VIP?', content: 'Sinyal trading premium adalah rekomendasi arah perdagangan (CALL/PUT) yang disiapkan oleh tim analis berpengalaman Stouch. Sinyal dikirim setiap hari secara eksklusif ke member VIP melalui notifikasi aplikasi. Sinyal mencakup rekomendasi aset, durasi trade, dan tingkat keyakinan analis. Sinyal bersifat informatif — keputusan final tetap ada di tanganmu.' },
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
          { title: 'Apa itu Stouch?', content: 'Stouch adalah platform trading online dengan jutaan transaksi aktif dari seluruh dunia. Kami telah menyediakan layanan trading sejak 2022 dan telah membangun reputasi sebagai platform berkelas dunia dengan berbagai pilihan aset keuangan. Stouch berkomitmen untuk memberikan pengalaman trading terbaik bagi semua level trader, dari pemula hingga profesional.' },
          { title: 'Apakah Stouch menyediakan layanan manajemen investasi?', content: 'Tidak. Stouch adalah platform trading mandiri — kami tidak menyediakan layanan manajemen investasi atau menerima dana untuk dikelola oleh pihak ketiga. Semua keputusan trading sepenuhnya ada di tangan pengguna. Hati-hati terhadap pihak yang mengatasnamakan Stouch dan menawarkan jasa pengelolaan dana.' },
          { title: 'Apakah saya harus membayar pajak atas penghasilan dari Stouch?', content: 'Kewajiban pajak atas penghasilan dari trading bergantung pada peraturan perpajakan di negara tempat tinggalmu. Di Indonesia, penghasilan dari trading termasuk objek pajak penghasilan. Kami menyarankan kamu berkonsultasi dengan konsultan pajak atau akuntan profesional untuk memahami kewajiban perpajakanmu. Stouch tidak bertanggung jawab atas kewajiban pajak pengguna.' },
          { title: 'Bagaimana Stouch menjaga keamanan dana pengguna?', content: 'Stouch menerapkan beberapa lapisan keamanan untuk melindungi dana dan data pengguna: (1) Enkripsi SSL 256-bit untuk semua komunikasi data. (2) Segregated accounts — dana pengguna disimpan terpisah dari dana operasional perusahaan. (3) Autentikasi dua faktor (2FA) tersedia untuk semua akun. (4) Monitoring transaksi 24/7 untuk mendeteksi aktivitas mencurigakan. (5) Proses verifikasi identitas (KYC) yang ketat.' },
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
          { title: 'Cara mengunduh aplikasi Stouch?', content: 'Aplikasi Stouch tersedia di: (1) Google Play Store — cari "Stouch Trading" atau klik tautan di website kami. (2) App Store (iOS) — cari "Stouch" di App Store. (3) APK langsung — unduh dari halaman Download di website Stouch untuk Android. Setelah instalasi, login menggunakan akun yang sudah terdaftar.' },
          { title: 'Cara menambahkan Google Play ke Android?', content: 'Jika Google Play Store tidak tersedia di perangkatmu: (1) Buka Pengaturan → Keamanan → aktifkan "Sumber Tidak Dikenal". (2) Unduh file APK Google Play Store dari sumber terpercaya. (3) Buka file APK yang diunduh dan ikuti instruksi instalasi. (4) Setelah Google Play terpasang, gunakan untuk mengunduh aplikasi Stouch.' },
          { title: 'Aplikasi Stouch tidak bisa dibuka atau crash, apa yang harus dilakukan?', content: 'Jika aplikasi bermasalah, coba langkah berikut: (1) Tutup paksa aplikasi dan buka kembali. (2) Pastikan koneksi internet kamu stabil. (3) Bersihkan cache aplikasi: Pengaturan → Aplikasi → Stouch → Hapus Cache. (4) Perbarui aplikasi ke versi terbaru dari toko aplikasi. (5) Uninstall dan install ulang aplikasi. Jika masalah berlanjut, hubungi support kami dengan menyebutkan tipe perangkat dan versi OS kamu.' },
          { title: 'Apakah ada perbedaan fitur antara versi web dan aplikasi mobile?', content: 'Aplikasi mobile Stouch memiliki fitur yang setara dengan versi web, termasuk akses ke semua aset, riwayat trading, deposit, penarikan, dan pengaturan akun. Beberapa fitur seperti notifikasi push dan Face ID/fingerprint login hanya tersedia di aplikasi mobile. Versi web dioptimalkan untuk layar yang lebih besar dan mungkin menampilkan lebih banyak data chart secara bersamaan.' },
        ],
      },
    ],
  },
]

// ─── Article Accordion ────────────────────────────────────────────────────────

function ArticleItem({ article }: { article: Article }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: '#f5f5f5' }}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm font-medium text-gray-800 pr-4 leading-snug">{article.title}</span>
        {open
          ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" />
          : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 pb-4" style={{ borderTop: '1px solid #f5f5f5' }}>
          <p className="text-sm text-gray-600 leading-relaxed pt-3">{article.content}</p>
        </div>
      )}
    </div>
  )
}

// ─── Category View ────────────────────────────────────────────────────────────

function CategoryView({ category, onClose }: { category: Category; onClose: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onClose}
          className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
        >
          ← Semua Kategori
        </button>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
          style={{ background: `${category.color}12`, color: category.color }}
        >
          {category.abbr}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>{category.label}</h2>
          <p className="text-xs text-gray-400">{category.desc}</p>
        </div>
      </div>
      <div className="space-y-4">
        {category.sections.map((section, si) => (
          <div key={si} className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
            <div className="px-5 py-3.5 bg-gray-50" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{section.title}</p>
            </div>
            {section.articles.map((article, ai) => (
              <ArticleItem key={ai} article={article} />
            ))}
          </div>
        ))}
      </div>
    </div>
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

        {!activeCategory && (
          <>
            {/* ── Hero & search ── */}
            <div className="py-10 sm:py-12 lg:py-14 text-center max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3" style={{ letterSpacing: '-0.04em' }}>
                Ada yang bisa kami bantu?
              </h1>
              <p className="text-sm text-gray-400 mb-6">Cari jawaban dari ribuan artikel bantuan Stouch</p>

              <div className="relative max-w-lg mx-auto">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari artikel bantuan..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                  style={{ border: '1.5px solid #e5e7eb', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6b7280')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={15} />
                  </button>
                )}
              </div>

              {search && (
                <div
                  className="mt-2 bg-white rounded-2xl overflow-hidden text-left max-w-lg mx-auto"
                  style={{ border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                >
                  {searchResults.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-gray-400">
                      Tidak ada hasil untuk &quot;<span className="text-gray-600 font-medium">{search}</span>&quot;
                    </div>
                  ) : (
                    searchResults.map((r, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                        style={{ borderColor: '#f5f5f5' }}
                        onClick={() => {
                          const cat = CATEGORIES.find(c => c.id === r.categoryId)
                          if (cat) { setActiveCategory(cat); setSearch('') }
                        }}
                      >
                        <p className="text-sm font-medium text-gray-800 leading-snug">{r.article.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${r.categoryColor}12`, color: r.categoryColor }}>
                            {r.categoryLabel}
                          </span>
                          <span className="text-[11px] text-gray-400">{r.sectionTitle}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* ── Category grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-12">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat)}
                  className="bg-white rounded-2xl p-4 sm:p-5 text-left transition-all duration-150 hover:shadow-md active:scale-95 group"
                  style={{ border: '1px solid #f0f0f0' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 font-black text-xs tracking-wide"
                    style={{ background: `${cat.color}10`, color: cat.color }}>
                    {cat.abbr}
                  </div>
                  <p className="text-sm font-bold text-gray-800 mb-1 leading-tight">{cat.label}</p>
                  <p className="text-[11px] text-gray-400 leading-snug hidden sm:block">{cat.desc}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[10px] text-gray-400">
                      {cat.sections.reduce((acc, s) => acc + s.articles.length, 0)} artikel
                    </span>
                    <ChevronRight size={10} className="text-gray-300" />
                  </div>
                </button>
              ))}
            </div>

            {/* ── Popular articles ── */}
            <section className="mb-12">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Artikel Populer</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { cat: 'akun',       title: 'Cara mengaktifkan autentikasi dua faktor (2FA)?' },
                  { cat: 'deposit',    title: 'Metode deposit apa yang tersedia?' },
                  { cat: 'penarikan',  title: 'Berapa lama proses penarikan?' },
                  { cat: 'vip-gold',   title: 'Bagaimana cara naik ke status Gold atau VIP?' },
                  { cat: 'trading',    title: 'Apa itu akun demo?' },
                  { cat: 'verifikasi', title: 'Dokumen apa yang dibutuhkan untuk verifikasi?' },
                ].map((item, i) => {
                  const cat = CATEGORIES.find(c => c.id === item.cat)!
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveCategory(cat)}
                      className="bg-white rounded-xl px-4 py-3.5 text-left flex items-center gap-3 hover:shadow-sm transition-all active:scale-95"
                      style={{ border: '1px solid #f0f0f0', borderLeft: `3px solid ${cat.color}` }}
                    >
                      <p className="text-sm text-gray-700 font-medium leading-snug">{item.title}</p>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* ── Contact support ── */}
            <section>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Masih butuh bantuan?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="mailto:support@stouch.id"
                  className="bg-white rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-all active:scale-95"
                  style={{ border: '1px solid #f0f0f0' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#2563eb12' }}>
                    <Mail size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 mb-0.5">Email Support</p>
                    <p className="text-xs text-gray-400 mb-2">Untuk pertanyaan detail, verifikasi, dan keluhan</p>
                    <p className="text-xs font-semibold text-blue-600">support@stouch.id</p>
                  </div>
                </a>
                <div className="bg-white rounded-2xl p-5 flex items-start gap-4" style={{ border: '1px solid #f0f0f0' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#05966912' }}>
                    <MessageCircle size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 mb-0.5">Live Chat</p>
                    <p className="text-xs text-gray-400 mb-2">Respon cepat untuk masalah teknis dan pertanyaan umum</p>
                    <p className="text-xs font-semibold text-emerald-600">Tersedia di aplikasi</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeCategory && (
          <div className="pt-6">
            <CategoryView category={activeCategory} onClose={() => setActiveCategory(null)} />
          </div>
        )}

      </main>
    </div>
  )
}