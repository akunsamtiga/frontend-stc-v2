'use client'

// app/copytrading-agreement/PageClient.tsx
import { useState } from 'react'
import PageNavbar from '@/components/PageNavbar'
import { ChevronDown, ChevronUp, Menu, X, Scale, AlertTriangle } from 'lucide-react'

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
      {
        id: '3.2', text: 'Papan peringkat Trader yang Disalin berisi informasi berikut tentang Trader yang Disalin:',
        subItems: [
          'nama panggilan (jika ada) atau ID trader',
          'bendera negara pendaftaran',
          'status di Platform Trading',
          'profitabilitas',
          'tingkat komisi',
          'jumlah Perdagangan Trader yang Disalin yang disalin oleh Trader',
          'keuntungan selama tujuh hari terakhir',
          'kerugian selama tujuh hari terakhir',
          'riwayat Perdagangan yang menguntungkan selama tujuh hari terakhir',
        ],
      },
      { id: '3.3', text: 'Klien memilih untuk menyalin atau tidak menyalin Perdagangan Trader yang Disalin secara sukarela dan atas kebijakannya sendiri. Semua keputusan tersebut merupakan masalah pribadi setiap Klien dan dibuat tanpa rekomendasi atau saran dari Perusahaan.' },
      { id: '3.4', text: 'Trader dapat menyalin Perdagangan dari Trader yang Disalin dalam jumlah tak terbatas.' },
    ],
  },
  {
    id: 'awal-penyalinan', num: '4', title: 'Awal Penyalinan', color: '#d97706',
    clauses: [
      { id: '4.1', text: 'Untuk mulai Menyalin Perdagangan Trader yang Disalin, Klien harus menekan tombol \'Mulai menyalin\' di Kartu Trader yang Disalin.' },
      {
        id: '4.2', text: 'Saat mulai menyalin Perdagangan Trader yang Disalin, Trader harus mencantumkan:',
        subItems: [
          'jumlah maksimum investasi Trader dalam satu Copy Trade dalam Penyalinan ini',
          'jumlah maksimum Copy Trade dalam Penyalinan ini',
          'batas kerugian dalam Penyalinan ini',
        ],
      },
      { id: '4.3', text: 'Jumlah maksimum Copy Trade dalam satu kali Penyalinan tidak boleh melebihi lima puluh (50) Perdagangan.' },
    ],
  },
  {
    id: 'pembukaan-penutupan', num: '5', title: 'Pembukaan dan Penutupan Copy Trade', color: '#0891b2',
    clauses: [
      { id: '5.1', text: 'Copy Trade dibuka dan ditutup secara otomatis tanpa konsultasi, kesepakatan, atau persetujuan sebelumnya.' },
      { id: '5.2', text: 'Hanya Perdagangan Trader yang Disalin yang dibuka setelah Trader mulai menyalin Perdagangan Trader yang Disalin yang disalin.' },
      { id: '5.3', text: 'Kecuali ditentukan lain di sini, Copy Trade memiliki parameter yang sama dengan Perdagangan Trader yang Disalin.' },
      { id: '5.4', text: 'Jika investasi Trader yang Disalin dalam Perdagangan lebih besar dari jumlah maksimum investasi Trader dalam satu Copy Trade yang ditentukan oleh Trader, dan/atau lebih besar dari Saldo Akun Trader, dan/atau lebih besar dari selisih antara batas kerugian yang ditentukan oleh Trader dan kerugian Trader dalam Penyalinan ini, jumlah investasi Trader dalam Copy Trade sama dengan jumlah maksimum investasi Trader dalam satu Copy Trade yang ditentukan oleh Trader, atau Saldo Akun Trader, atau selisih antara batas kerugian yang ditentukan oleh Trader dan kerugian Trader dalam Penyalinan ini, mana pun yang lebih kecil.' },
      { id: '5.5', text: 'Jika Trader yang Disalin membuka Perdagangan dengan aset yang tidak dapat diakses oleh Trader tersebut, Perdagangan tersebut tidak disalin di Akun Trader.' },
    ],
  },
  {
    id: 'akhir-penyalinan', num: '6', title: 'Akhir Penyalinan', color: '#dc2626',
    clauses: [
      { id: '6.1', text: 'Trader dapat berhenti Menyalin Perdagangan Trader yang Disalin kapan saja melalui tombol \'Berhenti menyalin\' di Kartu Trader yang Disalin. Trader dapat mulai Menyalin Perdagangan Trader yang Disalin yang sama lagi setelahnya kapan saja, jika mereka masih berada di papan peringkat Trader yang Disalin.' },
      {
        id: '6.2', text: 'Selain itu, Penyalinan Perdagangan Trader yang Disalin berhenti secara otomatis sebagai berikut:',
        subItems: [
          'jika jumlah maksimum Copy Trade dalam Penyalinan ini yang dicantumkan oleh Trader tercapai',
          'jika batas kerugian dalam Penyalinan yang dicantumkan oleh Trader tercapai',
          'jika Trader yang Disalin telah membatasi Penyalinan Perdagangannya',
          'jika Trader yang Disalin telah dihapus dari papan peringkat Trader yang Disalin',
          'jika Saldo Akun Trader kurang dari jumlah minimum investasi Klien dalam suatu Perdagangan — dalam kasus ini, Penyalinan Perdagangan dari semua Trader yang Disalin berhenti',
        ],
      },
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
      {
        id: '8.3', text: 'Perusahaan berhak:',
        subItems: [
          'untuk menetapkan dan/atau mengubah batasan jumlah Copy Trade dalam satu Penyalinan, jumlah Trader yang Disalin yang Perdagangannya dapat disalin oleh Trader tersebut, dan jenis batasan lainnya',
          'atas kebijakannya sendiri, untuk menghentikan segala bentuk Penyalinan',
          'atas kebijakannya sendiri, untuk mengubah fungsionalitas, menangguhkan atau menghentikan penyediaan layanan Copy Trading',
          'atas kebijakannya sendiri, untuk menangguhkan atau mengakhiri Perjanjian Copy Trading ini',
        ],
      },
    ],
  },
  {
    id: 'pengungkapan-risiko', num: '9', title: 'Pengungkapan Risiko', color: '#ef4444',
    clauses: [
      {
        id: '9.1', text: 'Trader sepenuhnya mengakui hal-hal berikut:',
        subItems: [
          'Copy Trading melibatkan peningkatan risiko. Dengan menggunakan Copy Trading, Trader mungkin mengalami kerugian finansial yang serius, atau kehilangan seluruh dana di Akun mereka',
          'Trader yang Disalin bukan merupakan perwakilan dan/atau mitra Perusahaan',
          'tingkat keuntungan Trader yang Disalin saat ini tidak menjamin hasil sukses mereka di masa mendatang',
          'penyediaan layanan Copy Trading bukan merupakan nasihat investasi',
          'Trader yang Disalin dapat membatasi Penyalinan Perdagangan mereka kapan saja',
          'Trader yang Disalin dapat dihapus dari papan peringkat Trader yang Disalin kapan saja',
          'jika Trader tidak memiliki akses ke semua aset yang tersedia bagi Trader yang Disalin yang Perdagangannya disalin, Trader dapat memperoleh hasil yang secara material berbeda dari Trader yang Disalin',
          'Copy Trading mungkin dibatasi atau tidak tersedia di yurisdiksi tertentu, bergantung pada kebijakan Perusahaan sendiri',
          'merupakan tanggung jawab Trader sepenuhnya untuk memastikan dan mematuhi hukum dan persyaratan setempat terkait Copy Trading',
        ],
      },
      {
        id: '9.2', text: 'Trader menggunakan Copy Trading dengan risiko mereka sendiri. Saat memulai menggunakan Copy Trading, Trader bertanggung jawab atas kemungkinan kerugian finansial seperti kerugian langsung atau kehilangan keuntungan yang diakibatkan oleh risiko berikut:',
        subItems: [
          'kemungkinan kerugian, keuntungan yang hilang, dan lain-lain, yang mungkin timbul ketika menyalin Perdagangan dari satu atau lebih Trader yang Disalin',
          'risiko yang terkait dengan kurangnya pengalaman Copy Trader yang tidak memiliki keterampilan, pengalaman, dan/atau pendidikan yang diperlukan untuk menghasilkan keuntungan yang diharapkan',
          'risiko Trader yang Menyalin tidak dapat mengakses Platform Trading karena alasan objektif atau subjektif',
          'risiko kemungkinan klaim oleh otoritas pajak dan keuangan di yurisdiksi tempat Trader berada, terdaftar, atau tinggal',
        ],
      },
    ],
  },
  {
    id: 'jaminan-kewajiban', num: '10', title: 'Jaminan dan Kewajiban', color: '#0ea5e9',
    clauses: [
      { id: '10.1', text: 'Perusahaan tidak menyatakan atau menjamin kinerja Trader yang Disalin dan/atau terulangnya hasil masa lalu yang telah diperoleh oleh Trader yang Disalin, yang Perdagangannya disalin oleh Trader tersebut, dan laba atau rugi yang diperoleh atau dialami Trader tersebut mungkin tidak sama dengan Trader yang Disalin.' },
      { id: '10.2', text: 'Perusahaan tidak bertanggung jawab atas segala kerugian langsung, tidak langsung, atau konsekuensial, atau segala kerugian lain yang mungkin dialami Trader akibat penggunaan Copy Trading.' },
      { id: '10.3', text: 'Penggunaan Copy Trading merupakan pilihan Klien. Memutuskan apakah akan menyalin Perdagangan dan menyalin Perdagangan dari Trader yang Disalin tertentu adalah tanggung jawab Klien. Dalam membuat keputusan seperti itu, Klien harus mempertimbangkan dengan cermat situasi keuangan mereka secara keseluruhan.' },
      { id: '10.4', text: 'Perusahaan memberikan instruksi tentang Copy Trading untuk tujuan informasi saja. Jika Trader membuat keputusan berdasarkan informasi yang disediakan di Website atau diperoleh melalui layanan Copy Trading, mereka melakukannya atas risiko mereka sendiri.' },
      { id: '10.5', text: 'Apabila terjadi pelanggaran Perjanjian Copy Trading ini oleh Trader dan/atau jika Perusahaan mencurigai bahwa Trader mencoba mengeksploitasi kelemahan fungsional, dan/atau melakukan kegiatan penipuan atau jahat, Perusahaan berhak untuk melarang Trader dan mengakhiri Perjanjian ini segera, serta menghentikan penggunaan Copy Trading oleh mereka.' },
    ],
  },
  {
    id: 'amandemen', num: '11', title: 'Amandemen dan Pengakhiran', color: '#d97706',
    clauses: [
      { id: '11.1', text: 'Kewajiban dan hak Trader dan Perusahaan yang ditetapkan oleh Perjanjian Copy Trading ini dianggap sebagai tindakan jangka panjang dan berlaku sampai dengan berakhirnya Perjanjian Copy Trading ini atau Perjanjian Klien stouch.' },
      { id: '11.2', text: 'Trader berhak untuk mengakhiri Perjanjian Copy Trading ini kapan saja, apa pun motifnya. Mereka dapat melakukannya melalui tombol \'Berhenti menyalin\' di Kartu Copy Trading untuk semua Trader yang Disalin. Apabila setelah itu, Trader memutuskan untuk melanjutkan penyalinan Perdagangan, Perjanjian ini akan kembali berlaku sesuai dengan versi yang berlaku pada saat dilanjutkannya penyalinan.' },
      { id: '11.3', text: 'Perusahaan berhak untuk mengakhiri Perjanjian ini secara sepihak kapan saja tanpa memberikan alasan.' },
      { id: '11.4', text: 'Setelah berakhirnya Perjanjian Copy Trading ini, penyalinan Perdagangan pada Akun Trader berhenti.' },
      { id: '11.5', text: 'Perusahaan memiliki kewenangan setiap saat untuk membuat perubahan pada Perjanjian Copy Trading ini. Jika ada perubahan yang dibuat pada Perjanjian, perubahan tersebut akan berlaku sejak saat teks Perjanjian yang diubah tersebut diposting di Website, kecuali ditentukan lain tanggal berlakunya perubahan tersebut. Trader diwajibkan secara mandiri untuk memahami versi terbaru dari Perjanjian ini yang diposting di Website.' },
      { id: '11.6', text: 'Jika Trader tidak menyetujui versi Perjanjian yang telah diubah, dia harus mengakhirinya melalui tombol \'Berhenti menyalin\' di Kartu Copy Trading untuk semua Trader yang Disalin yang Perdagangan telah mulai mereka salin.' },
    ],
  },
]

// ─── Sub-items ────────────────────────────────────────────────────────────────

function SubList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="mt-3 space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: `${color}60` }} />
          <span className="text-sm text-gray-500 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(false)

  return (
    <div id={`section-${section.id}`} className="bg-white rounded-2xl overflow-hidden scroll-mt-20" style={{ border: '1px solid #f0f0f0' }}>
      <div className="h-0.5" style={{ background: section.color }} />
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-[11px] font-black tabular-nums flex-shrink-0 w-6 text-center" style={{ color: `${section.color}80` }}>{section.num}</span>
        <p className="flex-1 text-sm sm:text-[15px] font-bold text-gray-800 pr-3 leading-snug">{section.title}</p>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${section.color}12`, color: section.color }}>
            {section.clauses.length} pasal
          </span>
          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </button>
      {open && (
        <div style={{ borderTop: `2px solid ${section.color}18` }}>
          {section.clauses.map((clause, i) => (
            <div key={clause.id} className="px-5 sm:px-6 py-4" style={{ borderTop: i > 0 ? '1px solid #f9f9f9' : 'none', background: i % 2 === 0 ? '#fafafa' : '#ffffff' }}>
              <div className="flex gap-3 sm:gap-4">
                <span className="text-[10px] font-bold flex-shrink-0 mt-0.5 w-8 sm:w-10 tabular-nums" style={{ color: `${section.color}70` }}>{clause.id}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 leading-relaxed">{clause.text}</p>
                  {clause.subItems && <SubList items={clause.subItems} color={section.color} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TOC ──────────────────────────────────────────────────────────────────────

function TableOfContents({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <nav className="sticky top-20 space-y-0.5">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Daftar Isi</p>
      {SECTIONS.map(sec => (
        <button key={sec.id} onClick={() => onNavigate(sec.id)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all hover:bg-gray-100 group">
          <span className="text-[10px] font-black w-5 text-right flex-shrink-0 tabular-nums" style={{ color: `${sec.color}70` }}>{sec.num}</span>
          <span className="text-[11px] text-gray-500 group-hover:text-gray-800 transition-colors leading-tight truncate">{sec.title}</span>
        </button>
      ))}
    </nav>
  )
}

function MobileTOC({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (id: string) => void }) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[75vh] overflow-y-auto" style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}>
        <div className="px-5 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white" style={{ borderBottom: '1px solid #f5f5f5' }}>
          <p className="text-sm font-bold text-gray-800">Daftar Isi</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><X size={13} className="text-gray-500" /></button>
        </div>
        <div className="p-3 space-y-0.5 pb-8">
          {SECTIONS.map(sec => (
            <button key={sec.id} onClick={() => { onNavigate(sec.id); onClose() }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-gray-50 transition-all">
              <span className="text-[10px] font-black w-5 text-right flex-shrink-0 tabular-nums" style={{ color: `${sec.color}70` }}>{sec.num}</span>
              <span className="text-sm text-gray-700 font-medium leading-tight">{sec.title}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Client page export ───────────────────────────────────────────────────────

export default function CopyTradingPageClient() {
  const [tocOpen, setTocOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`section-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.querySelector('button')?.click()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageNavbar
        title="Perjanjian Copy Trading"
        subtitle="Berlaku mulai 6 November 2025"
        rightSlot={
          <button onClick={() => setTocOpen(true)} className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 transition-all hover:bg-gray-100" style={{ background: '#f6f6f6' }}>
            <Menu size={13} />Isi
          </button>
        }
      />

      <MobileTOC open={tocOpen} onClose={() => setTocOpen(false)} onNavigate={scrollToSection} />

      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 pb-20">
        <div className="py-8 sm:py-10 lg:py-12 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 mb-5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Dokumen Legal Resmi</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" style={{ letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            Perjanjian Copy Trading
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-2xl">
            Perjanjian ini mengatur penyediaan layanan Copy Trading oleh Perusahaan kepada Kliennya.
            Dokumen ini merupakan bagian yang tidak terpisahkan dari Perjanjian Klien stouch dan harus
            dibaca bersama dengannya. Klien menerima Perjanjian ini dengan mulai menggunakan layanan
            Copy Trading.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Berlaku',   value: '6 November 2025' },
              { label: 'Versi',     value: 'Bahasa Indonesia' },
              { label: 'Platform',  value: 'Website & Akun Riil' },
              { label: 'Total Bab', value: `${SECTIONS.length} Bab` },
            ].map(({ label, value }) => (
              <div key={label} className="px-3 py-2 rounded-xl bg-white" style={{ border: '1px solid #f0f0f0' }}>
                <p className="text-[10px] text-gray-400">{label}</p>
                <p className="text-xs font-bold text-gray-700">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-4 sm:p-5 flex items-start gap-3 mb-6 max-w-3xl lg:max-w-none" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0 mt-1.5" />
          <div>
            <p className="text-xs font-bold text-sky-800 mb-0.5">Dokumen Pelengkap</p>
            <p className="text-xs text-sky-700 leading-relaxed">
              Perjanjian Copy Trading ini merupakan pelengkap{' '}
              <a href="/agreement" className="font-semibold underline underline-offset-2 hover:text-sky-900 transition-colors">Perjanjian Klien stouch</a>.
              Jika terjadi perbedaan antara kedua dokumen, ketentuan Perjanjian Copy Trading ini yang akan berlaku.
              Copy Trading hanya tersedia untuk Fixed Time Trades (FTT) di Akun Riil.
            </p>
          </div>
        </div>

        <div className="flex gap-8 lg:gap-10 items-start">
          <aside className="hidden lg:block w-52 xl:w-60 flex-shrink-0">
            <TableOfContents onNavigate={scrollToSection} />
          </aside>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="rounded-2xl p-4 flex items-start gap-3 mb-5" style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
              <AlertTriangle size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-800 leading-relaxed">
                <span className="font-bold">Peringatan Risiko:</span> Copy Trading melibatkan peningkatan
                risiko. Dengan menggunakan layanan ini, Trader mungkin mengalami kerugian finansial yang
                serius atau kehilangan seluruh dana di Akun mereka. Tingkat keuntungan Trader yang Disalin
                saat ini tidak menjamin hasil sukses di masa mendatang.
              </p>
            </div>

            {SECTIONS.map(section => <SectionCard key={section.id} section={section} />)}

            <div className="rounded-2xl p-5 mt-6" style={{ background: '#f8fafc', border: '1px solid #e8edf2' }}>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}