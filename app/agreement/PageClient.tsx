'use client'

// app/agreement/PageClient.tsx
import { useState } from 'react'
import PageNavbar from '@/components/PageNavbar'
import { ChevronDown, ChevronUp, Menu, X, Scale, AlertTriangle } from 'lucide-react'

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
      { id: '1.10', text: '\'Akun Demo\' berarti akun simulasi di Platform Perdagangan. Mata uangnya sama dengan mata uang Akun Riil Klien. Dana di Akun Demo tidak membentuk kewajiban keuangan Perusahaan kepada Klien.' },
      { id: '1.11', text: '\'Deposit\' berarti dana yang ditransfer oleh Klien ke Rekening Klien.' },
      { id: '1.12', text: '\'Kedaluwarsa\' berarti saat Perdagangan dieksekusi setelah mencapai waktu penutupan yang telah ditentukan.' },
      { id: '1.13', text: '\'File Log\' berarti catatan yang berisi data sistem mengenai operasi Server Perusahaan dan interaksi Klien dengan Website.' },
      { id: '1.14', text: '\'Pasar\' berarti Akun Pribadi Klien di mana Manfaat dapat dibeli atau ditukar dengan Stocken.' },
      { id: '1.15', text: '\'Pengganda\' berarti koefisien yang mewakili rasio antara Nilai Perdagangan dan investasi Klien, yang ditetapkan saat pembukaan Transaksi dalam perdagangan CFD. Pengganda tidak boleh melebihi 10.' },
      { id: '1.16', text: '\'Transaksi Non-Perdagangan\' berarti tindakan seperti Deposit, Penarikan, dan aktivitas lain di luar lingkup Transaksi Perdagangan.' },
      { id: '1.17', text: '\'Perdagangan Terbuka\' berarti Perdagangan yang belum mencapai Kedaluwarsa atau belum ditutup oleh Klien.' },
      { id: '1.18', text: '\'Penyedia Sistem Pembayaran\' berarti entitas yang menawarkan layanan pembayaran elektronik.' },
      { id: '1.19', text: '\'Perdagangan Bebas Risiko\' berarti Perdagangan yang dilakukan atas biaya Perusahaan. Klien dapat dengan bebas mengelola keuntungan yang diperoleh tanpa batasan. Perdagangan Bebas Risiko tidak menimbulkan kewajiban finansial Perusahaan kepada Klien.' },
      { id: '1.20', text: '\'Saldo Stocken\' berarti jumlah total Stocken yang dimiliki oleh Klien.' },
      { id: '1.21', text: '\'Stocken\' (\'STN\') berarti unit yang tidak dapat dipindahtangankan, tidak dapat dikonversi menjadi uang tunai, dan tidak dapat diwariskan yang dikreditkan ke Saldo Stocken Klien yang dapat ditukar dengan Manfaat di Pasar. Stocken bukan merupakan sekuritas, instrumen pembayaran, atau mata uang.' },
      { id: '1.22', text: '\'Perdagangan\' berarti Transaksi Perdagangan yang berlawanan yang memiliki nomor identifikasi yang sama.' },
      { id: '1.23', text: '\'Aktivitas Perdagangan\' berarti tindakan Klien seperti Deposit, Penarikan, Transaksi Perdagangan, pendaftaran Turnamen berbayar, pengisian saldo akun Turnamen (pembelian ulang), dan aktivasi Bonus atau hadiah.' },
      { id: '1.24', text: '\'Mekanisme Perdagangan\' berarti instrumen keuangan derivatif berdasarkan Aset yang disediakan oleh Perusahaan dalam Platform Perdagangan, yang tidak memerlukan kepemilikan aktual atas Aset tersebut. Dua jenis mekanisme tersedia: Perdagangan FTT dan Perdagangan CFD.' },
      { id: '1.25', text: '\'Order Perdagangan\' berarti instruksi Klien untuk melaksanakan Transaksi Perdagangan dengan ketentuan tertentu.' },
      { id: '1.26', text: '\'Platform Perdagangan\' berarti sistem perangkat lunak yang dapat diakses melalui Akun Pribadi Klien, yang digunakan untuk menampilkan Kuotasi secara real-time, mengirimkan Order Perdagangan, melacak hasil eksekusi, dan menjalankan fungsi-fungsi terkait.' },
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
      { id: '2.3',  text: 'Untuk memastikan penyediaan layanan yang sah dan aman, Perusahaan akan melakukan verifikasi identitas Klien dan informasi yang dikirimkan. Perusahaan dapat meminta Klien untuk memberikan foto salah satu dari berikut ini: (i) halaman paspor Klien yang menampilkan foto dan data pribadi; atau (ii) bagian depan dan belakang kartu identitas Klien; atau (iii) SIM Klien. Selain itu, Perusahaan mungkin memerlukan tagihan utilitas terbaru, rekening koran, pindaian kartu bank, atau dokumen lain jika dokumen yang dikirimkan sebelumnya tidak cukup untuk memverifikasi identitas, detail pembayaran, atau keakuratan informasi.' },
      { id: '2.4',  text: 'Verifikasi biasanya selesai dalam waktu 20 menit setelah menerima semua dokumen yang diminta; tetapi, Perusahaan dapat memperpanjang periode ini hingga 7 hari kalender jika diperlukan.' },
      { id: '2.5',  text: 'Apabila Klien menolak untuk memberikan dokumen atau informasi yang diperlukan, Perusahaan berhak untuk menangguhkan dan selanjutnya memblokir layanan Akun Klien. Dana yang disetorkan dapat dikembalikan hanya melalui detail pembayaran yang diberikan pada saat pendaftaran atau ditahan hingga verifikasi selesai.' },
      { id: '2.6',  text: 'Perusahaan dapat meminta partisipasi dalam konferensi video, dengan pemberitahuan kepada Klien setidaknya 24 jam sebelumnya, untuk mengonfirmasi identitas dan keaslian dokumen.' },
      { id: '2.7',  text: 'Dengan mendaftar, Klien setuju untuk menerima email—termasuk konten promosi—panggilan telepon, dan pesan SMS dari Perusahaan. Klien dapat berhenti berlangganan komunikasi email kapan saja dengan mengklik "Berhenti Berlangganan" di email, menonaktifkan opsi di Akun Pribadi, atau menghubungi Dukungan Perusahaan.' },
      { id: '2.8',  text: 'Setiap Klien hanya berhak memiliki satu Akun di Website. Penemuan beberapa Akun yang terhubung dengan alamat IP, perangkat, metode pembayaran, atau indikator lain yang sama dapat mengakibatkan pembatalan Perdagangan dan hasil keuangan pada semua Akun tersebut dan memblokirnya.' },
      { id: '2.9',  text: 'Jika tidak ada Aktivitas Perdagangan yang terjadi di Akun Klien selama 90 hari berturut-turut, biaya layanan bulanan sebesar $30/€30 (atau setara dengan $30) akan dibebankan, dibatasi pada Saldo Akun atau dana yang dipotong sesuai dengan klausul 2.10. Biaya ini dibatalkan pada saat dimulainya kembali Aktivitas Perdagangan.' },
      { id: '2.10', text: 'Perusahaan berhak memotong seluruh Saldo Akun jika tidak ada Aktivitas Perdagangan yang terjadi di Akun Klien selama 6 bulan berturut-turut.' },
      { id: '2.11', text: 'Untuk memulihkan dana ke Akun, Klien harus menghubungi Dukungan Perusahaan sebagaimana dijelaskan di bagian XIII.' },
    ],
  },
  {
    id: 'ftt', roman: 'III', title: 'Perdagangan FTT (Fixed Time Trading)', color: '#d97706',
    clauses: [
      { id: '3.1', text: 'Untuk membuka Perdagangan, Klien memilih Aset, menentukan jumlah investasi dan arah pergerakan harga, dan menetapkan waktu penutupan Perdagangan.' },
      { id: '3.2', text: 'Perdagangan secara otomatis ditutup setelah mencapai waktu penutupan yang telah ditentukan.' },
      { id: '3.3', text: 'Sebuah perdagangan dianggap menguntungkan jika, pada saat penutupan, Kuotasi Aset saat ini melebihi Kuotasi pembukaan ketika arah yang dipilih adalah "naik", atau jika Kuotasi saat ini lebih rendah daripada Kuotasi pembukaan ketika arahnya "turun." Profitabilitas suatu Perdagangan bersifat tetap dan ditentukan oleh jumlah investasi Klien, Aset yang dipilih, dan waktu eksekusi.' },
      { id: '3.4', text: 'Keuntungan dihitung sebagai persentase keuntungan dikalikan dengan investasi Klien.' },
    ],
  },
  {
    id: 'cfd', roman: 'IV', title: 'Perdagangan CFD', color: '#7c3aed',
    clauses: [
      { id: '4.1', text: 'Untuk membuka Perdagangan, Klien memilih Aset, menentukan jumlah investasi, Pengganda, dan arah pergerakan harga.' },
      { id: '4.2', text: 'Perdagangan ditutup berdasarkan instruksi Klien atau secara otomatis. Perdagangan ditutup secara otomatis: (i) jika terjadi Stop Loss teknikal, yaitu jika kerugian mencapai 95% dari jumlah yang diinvestasikan; atau (ii) setelah 15 hari sejak pembukaan Perdagangan.' },
      { id: '4.3', text: 'Perdagangan menguntungkan jika, pada penutupan, Kuotasi lebih tinggi daripada pembukaan untuk Perdagangan dengan arah "naik", atau lebih rendah daripada pembukaan untuk Perdagangan dengan arah "turun".' },
      { id: '4.4', text: 'Keuntungan atau kerugian dari sebuah Perdagangan dihitung sebagai: Jumlah Investasi × Pengganda × (Kuotasi Penutupan / Kuotasi Pembukaan - 1).' },
      { id: '4.5', text: 'Ketika sebuah Perdagangan dibuka, komisi sebesar 0,02% dari Nilai Perdagangan dikurangkan dari Akun Demo Klien. Komisi ini dibulatkan ke sepersepuluh terdekat dalam mata uang Akun Demo.' },
      { id: '4.6', text: 'Klien dapat memiliki maksimal 15 Perdagangan terbuka secara simultan dalam Trading CFD.' },
      { id: '4.7', text: 'Kerugian maksimum pada Perdagangan yang dilakukan dengan mekanisme CFD tidak boleh melebihi 100% dari jumlah investasi Klien.' },
      { id: '4.8', text: 'Perdagangan CFD diizinkan dari hari Senin pukul 07.00 UTC hingga Jumat 21.00 UTC. Di luar jangka waktu ini, pembukaan atau penutupan Perdagangan tidak tersedia.' },
      { id: '4.9', text: 'Trading CFD tersedia secara eksklusif di Akun Demo.' },
    ],
  },
  {
    id: 'transaksi', roman: 'V', title: 'Transaksi Perdagangan', color: '#0891b2',
    clauses: [
      { id: '5.1.1', text: 'Klien mengetahui bahwa satu-satunya sumber resmi untuk aliran Kuotasi adalah Server Perusahaan. Kuotasi yang ditampilkan di Platform Perdagangan hanya berfungsi sebagai referensi indikatif dan mungkin tidak lengkap karena masalah konektivitas antara Platform Perdagangan dan Server.' },
      { id: '5.1.2', text: 'Kuotasi Aset di Platform Perdagangan dihitung sebagai rata-rata aritmatika dari harga pembelian dan penjualan: (pembelian + penjualan) / 2.' },
      { id: '5.1.3', text: 'Jika Order Perdagangan dieksekusi berdasarkan Kuotasi non-pasar, Perusahaan harus menyesuaikan hasil keuangan Perdagangan sesuai dengan Kuotasi pasar yang berlaku pada saat eksekusi atau membatalkan hasil Perdagangan.' },
      { id: '5.3',   text: 'Waktu pemrosesan bergantung pada kualitas komunikasi antara Platform Perdagangan dan Server dan kondisi pasar. Dalam keadaan normal, pemrosesan biasanya membutuhkan 0–4 detik; kondisi pasar yang buruk dapat memperpanjang durasi ini.' },
      { id: '5.4.1', text: 'Investasi minimum per perdagangan adalah $1/€1 atau setara dengan $1; maksimum adalah $5.000/€5.000 atau setara dengan $5.000.' },
      { id: '5.4.2', text: 'Order Perdagangan untuk membuka Perdagangan dapat ditolak jika: (i) diajukan sebelum Penawaran Harga pertama dari Aset diterima oleh Platform Perdagangan pada saat pembukaan pasar; dan/atau (ii) dana yang tersedia tidak mencukupi di Akun Klien.' },
      { id: '5.4.3', text: 'Server dapat menolak Order Perdagangan dalam kondisi pasar yang tidak normal.' },
      { id: '5.4.4', text: 'Sebuah Perdagangan dianggap terbuka setelah entri yang sesuai muncul di File Log. Setiap Perdagangan diberi pengenal unik.' },
      { id: '5.5.1', text: 'Perdagangan ditutup pada Kuotasi Aset terkini yang tercatat di Server pada waktu penutupan.' },
      { id: '5.7',   text: 'Perusahaan dapat membatasi jumlah maksimum Perdagangan per Klien dalam interval yang ditentukan (menit, jam, hari).' },
      { id: '5.8',   text: 'Perusahaan berhak untuk mengubah persentase profitabilitas, jumlah investasi minimum dan maksimum, dan jangka waktu Kedaluwarsa untuk satu atau beberapa Aset.' },
      { id: '5.9',   text: 'Kerusakan sistem Perusahaan, koneksi internet yang tidak stabil, pemadaman listrik, gangguan bursa, upaya akses yang tidak sah, kejadian force majeure, atau penangguhan perdagangan pasar keuangan yang memengaruhi Aset dapat membatalkan Perdagangan yang dieksekusi selama kejadian tersebut.' },
    ],
  },
  {
    id: 'non-perdagangan', roman: 'VI', title: 'Transaksi Non-Perdagangan', color: '#dc2626',
    clauses: [
      { id: '6.1',  text: 'Metode resmi untuk Deposit dan Penarikan ditetapkan di Website Perusahaan. Klien menanggung semua risiko yang terkait dengan penggunaan sistem pembayaran, termasuk komisi dan biaya konversi mata uang. Komisi penarikan berlaku: Indonesia: 5% untuk semua permintaan penarikan di atas batas 1 dalam waktu 24 jam.' },
      { id: '6.2',  text: 'Deposit dilakukan melalui antarmuka internal Website. Deposit minimum adalah $10/€10 atau setara dengan $10, dapat diturunkan sesuai dengan kebijakan Perusahaan di negara-negara tertentu atau acara promosi.' },
      { id: '6.3',  text: 'Deposit menggunakan detail pembayaran pihak ketiga sangat dilarang. Deteksi aktivitas penipuan dalam transaksi keuangan memberi wewenang kepada Perusahaan untuk membatalkan transaksi tersebut dan memblokir Akun Klien.' },
      { id: '6.4',  text: 'Permintaan penarikan diajukan melalui antarmuka Website. Jumlah Penarikan minimum adalah $10/€10 atau setara dengan $10, dapat diturunkan sesuai dengan kebijakan Perusahaan.' },
      { id: '6.5',  text: 'Dana didebet dari Akun hanya setelah eksekusi pembayaran aktual. Penarikan dana bersifat final dan tidak dapat dikembalikan.' },
      { id: '6.6',  text: 'Klien bertanggung jawab penuh atas keakuratan informasi yang diberikan dalam permintaan Penarikan.' },
      { id: '6.7',  text: 'Permintaan penarikan dana diproses dalam waktu 3 hari kerja sejak pengajuan. Penerimaan aktual tergantung pada sistem pembayaran dan waktu pemrosesan Penyedia Sistem Pembayaran.' },
      { id: '6.8',  text: 'Batas penarikan: $3.000/€3.000 setiap hari; $10.000/€10.000 sebelum akhir minggu berjalan; $40.000/€40.000 sebelum akhir bulan berjalan. Batasan dapat diturunkan bergantung pada metode penarikan.' },
      { id: '6.9',  text: 'Penarikan dana dapat ditunda hingga 10 hari kerja oleh layanan keamanan Perusahaan setelah pemberitahuan sebelumnya.' },
      { id: '6.10', text: 'Penarikan dana dilakukan melalui metode dan akun yang sama dengan yang digunakan untuk Deposit. Jika tidak memungkinkan, Klien dapat menggunakan metode/akun alternatif yang sesuai dengan data yang diverifikasi.' },
      { id: '6.11', text: 'Untuk kepatuhan AML, Perusahaan dapat meminta bukti bahwa akun penarikan adalah milik Klien, termasuk salinan identitas dan dokumen tempat tinggal, yang harus diberikan dalam waktu 14 hari kalender sejak permintaan.' },
      { id: '6.12', text: 'Perusahaan dapat menolak permintaan penarikan jika Akun tersebut digunakan secara nyata untuk operasi pertukaran antara sistem pembayaran.' },
      { id: '6.13', text: 'Jika Klien menarik dana sebelum mencapai Omzet Perdagangan yang melebihi dua kali jumlah Deposit, maka akan dikenakan biaya penarikan sebesar 10% dari Saldo Akun atau Deposit terakhir (mana saja yang lebih besar).' },
      { id: '6.18', text: 'Perusahaan berhak untuk membatasi jumlah yang tersedia untuk Penarikan hingga jumlah total Deposit Klien yang dibuat dalam 30 hari kalender sebelumnya.' },
      { id: '6.19', text: 'Jika Perusahaan mencurigai adanya tindakan curang atau menipu oleh Klien, Perusahaan dapat memblokir Akun Klien dengan segera, tanpa pemberitahuan sebelumnya, dan menangguhkan semua transaksi Akun termasuk Deposit dan Penarikan untuk jangka waktu tidak lebih dari 10 hari kerja.' },
      { id: '6.20', text: 'Kebijakan Pengembalian Dana: Semua pengembalian dana akan diproses secara eksklusif melalui Transaksi Non-Perdagangan. Apabila dana didepositkan melalui kartu bank, Klien dapat meminta pengembalian dana melalui email support@stouch.com. Pengembalian dana akan berlaku hanya jika tersedia dana yang mencukupi di Akun Klien untuk menutupinya.' },
    ],
  },
  {
    id: 'bonus', roman: 'VII', title: 'Bonus, Turnamen, dan Promosi', color: '#db2777',
    clauses: [
      { id: '7.1',  text: 'Bonus dikreditkan ke Akun Klien sesuai dengan program promosi atau bonus yang diselenggarakan oleh Perusahaan. Bonus yang dikreditkan ke Akun bukan merupakan kewajiban finansial Perusahaan kepada Klien.' },
      { id: '7.2',  text: 'Jumlah Bonus bergantung pada ketentuan khusus dari promosi atau program dan/atau ukuran Deposit Klien.' },
      { id: '7.3',  text: 'Setelah Bonus diaktifkan, dana di Akun Klien dapat ditarik tanpa pembatalan Bonus hanya setelah Klien menyelesaikan Omzet Perdagangan Wajib, yang dihitung sebagai jumlah Bonus dikalikan dengan faktor leverage. Jika tidak ditentukan, leverage adalah 40 untuk Bonus non-deposit dan Bonus deposit yang sama dengan atau melebihi 50% dari Deposit; dan 35 untuk Bonus deposit di bawah 50% dari Deposit.' },
      { id: '7.4',  text: 'Kecuali ditentukan lain, setiap promosi hanya memberikan hak kepada Klien untuk menerima Bonus sebanyak satu kali.' },
      { id: '7.5',  text: 'Keuntungan yang diperoleh dari Perdagangan menggunakan Bonus dapat tunduk pada batasan Penarikan.' },
      { id: '7.6',  text: 'Bonus Non-Deposit harus diaktifkan dalam waktu 3 hari setelah dikreditkan di Akun Pribadi Klien.' },
      { id: '7.7',  text: 'Setelah aktivasi, Klien dapat membatalkan Bonus melalui antarmuka Akun Pribadi Klien di Website kapan pun, apabila tidak ada Perdagangan Terbuka dan/atau permintaan Penarikan berstatus menunggu di Akun tersebut.' },
      { id: '7.8',  text: 'Bonus dapat didebit dari Akun Klien setelah berakhirnya promosi terkait.' },
      { id: '7.9',  text: 'Hanya satu Bonus aktif yang boleh ada per Akun Klien; Bonus tambahan tidak dapat diaktifkan hingga menyelesaikan Omzet Perdagangan Wajib untuk Bonus aktif.' },
      { id: '7.10', text: 'Jika Saldo Akun Klien turun di bawah jumlah investasi Perdagangan minimum yang disyaratkan, Bonus akan hangus.' },
      { id: '7.11', text: 'Partisipasi turnamen dilakukan melalui akun turnamen virtual khusus dalam mata uang virtual (₮) dengan saldo awal yang sama untuk semua peserta. Tujuannya adalah untuk mencapai saldo tertinggi di akhir Turnamen; dana hadiah didistribusikan di antara para pemenang yang telah memenangkan peringkat hadiah.' },
      { id: '7.12', text: 'Klien dapat mengikuti semua Turnamen dan promosi yang tersedia, tetapi bertanggung jawab untuk meninjau ketentuan yang berlaku yang diposting di Website.' },
      { id: '7.13', text: 'Hadiah uang yang diberikan untuk Turnamen dikreditkan ke Akun Riil Klien pada saat aktivasi, kecuali dinyatakan lain.' },
      { id: '7.14', text: 'Kecurigaan terhadap aktivitas curang Klien dalam Turnamen atau promosi dapat menyebabkan peninjauan ulang atau pembatalan hasil dan larangan untuk berpartisipasi di masa mendatang.' },
    ],
  },
  {
    id: 'pasar', roman: 'VIII', title: 'Pasar', color: '#0ea5e9',
    clauses: [
      { id: '8.1', text: 'Di Pasar, setiap Manfaat diberi nilai dalam mata uang Akun Riil Klien dan dalam Stocken, yang ditentukan sepenuhnya oleh Perusahaan dan ditampilkan sesuai dengan itu.' },
      { id: '8.2', text: 'Penjelasan terperinci dan ketentuan penggunaan Manfaat tersedia di dalam Pasar.' },
      { id: '8.3', text: 'Perusahaan dapat secara sepihak merevisi nilai Manfaat, memodifikasi atau menghapus Manfaat, atau menghentikan akses Pasar setiap saat.' },
      { id: '8.4', text: 'Manfaat dapat dibeli menggunakan dana dari Akun Riil Klien atau ditukar dengan Stocken.' },
      { id: '8.5', text: 'Manfaat yang dipilih diberikan kepada Klien setelah dikurangi jumlah yang diperlukan dari Akun Riil atau Saldo Stocken Klien.' },
      { id: '8.6', text: 'Biaya Manfaat tidak dapat dikembalikan.' },
      { id: '8.7', text: 'Manfaat hanya ditujukan untuk penggunaan pribadi Klien dan tidak dapat dialihkan kepada pihak ketiga.' },
      { id: '8.8', text: 'Klien mengakui bahwa materi di Pasar bukan merupakan saran investasi atau perdagangan; semua keputusan perdagangan adalah atas kebijakan Klien sendiri, dan Perusahaan tidak bertanggung jawab atas kerugian langsung, tidak langsung, atau kerugian lain yang timbul dari informasi Pasar.' },
      { id: '8.9', text: 'Pelanggaran ketentuan Perjanjian oleh Klien dapat mengakibatkan Perusahaan membatasi akses Pasar Klien atas kebijakannya sendiri.' },
    ],
  },
  {
    id: 'stocken', roman: 'IX', title: 'Stocken', color: '#d97706',
    clauses: [
      { id: '9.1', text: 'Klien hanya boleh memiliki 1 Saldo Stocken. Penemuan beberapa akun yang terhubung dengan alamat IP, perangkat, metode pembayaran, atau indikator lain yang sama dapat mengakibatkan pembatalan Saldo Stocken.' },
      { id: '9.2', text: 'Kecurigaan terhadap penipuan atau kecurangan Klien dapat menyebabkan pembatalan Saldo Stocken Klien.' },
      { id: '9.3', text: 'Setelah Klien meninggal dunia atau tidak mampu secara hukum, Saldo Stocken mereka dibatalkan.' },
      { id: '9.4', text: 'Stocken dikreditkan ke Saldo Stocken Klien untuk setiap Perdagangan di Akun Riil mereka, tidak termasuk Perdagangan dengan hasil nol, sebanding dengan jumlah investasi. Nilai 1 Stocken ditampilkan di Akun Pribadi Klien.' },
      { id: '9.5', text: 'Stocken dikreditkan setelah penutupan Perdagangan.' },
      { id: '9.6', text: 'Perdagangan yang dibatalkan sesuai dengan klausul 5.1.3 Perjanjian ini akan mengakibatkan pembatalan Stocken yang terkait.' },
      { id: '9.7', text: 'Stocken dapat ditukar dengan Manfaat di Pasar. Jika pertukaran dibatalkan, Stocken akan dikembalikan ke Saldo Stocken Klien.' },
      { id: '9.8', text: 'Stocken dibatalkan 30 hari setelah: (i) pengkreditan Stocken yang pertama setelah Saldo Stocken nol jika tidak ada penukaran yang terjadi selama periode tersebut; atau (ii) penukaran Manfaat yang terakhir jika Saldo Stocken tidak nol.' },
    ],
  },
  {
    id: 'risiko', roman: 'X', title: 'Risiko Klien', color: '#ef4444',
    clauses: [
      { id: '10.1', text: 'Klien sepenuhnya mengakui bahwa: (i) perdagangan instrumen keuangan melibatkan risiko yang signifikan; disarankan untuk melakukan penilaian kapasitas keuangan terlebih dahulu; (ii) Transaksi Perdagangan yang dilakukan melalui Platform Perdagangan bersifat over-the-counter, tidak diperdagangkan di bursa, dan memiliki risiko yang lebih tinggi; (iii) informasi atau rekomendasi dari Perusahaan atau mitra bukan merupakan penawaran langsung untuk melakukan perdagangan; (iv) kegagalan teknis, koneksi internet yang tidak stabil, pemadaman listrik, atau faktor lain dapat menyebabkan kerugian finansial Klien.' },
      { id: '10.2', text: 'Klien menanggung semua risiko terkait pembatasan hukum di yurisdiksi mereka dan bertanggung jawab atas kepatuhan.' },
      { id: '10.3', text: 'Perusahaan tidak menjamin keuntungan Klien atau tidak adanya kerugian dari penggunaan layanannya.' },
    ],
  },
  {
    id: 'jaminan', roman: 'XI', title: 'Jaminan, Tanggung Jawab, dan Force Majeure', color: '#475569',
    clauses: [
      { id: '11.1',  text: 'Perusahaan bukan lembaga kredit, tidak menerima dana untuk investasi dengan bunga, dan tidak melakukan kegiatan perbankan.' },
      { id: '11.2',  text: 'Perusahaan tidak memberikan layanannya di beberapa negara/wilayah tertentu termasuk Australia, Kanada, Amerika Serikat, Inggris, dan negara-negara lain di mana dilarang oleh hukum atau kebijakan internal Perusahaan.' },
      { id: '11.3',  text: 'Klien menjamin bahwa Perdagangan di Akun mereka dilakukan atas nama dan kepentingan mereka sendiri dan bahwa mereka bukan warga negara dan/atau penduduk yurisdiksi yang membatasi layanan.' },
      { id: '11.4',  text: 'Penyediaan dokumen palsu atau tidak valid oleh Klien selama verifikasi dapat menyebabkan penolakan layanan, pemotongan dana Klien dalam jumlah kerugian aktual yang disebabkan oleh Klien kepada Perusahaan, dan penolakan penarikan keuntungan Klien.' },
      { id: '11.5',  text: 'Klien menjamin bahwa dana yang disetorkan adalah sah dan tidak berasal dari kegiatan ilegal, dan setuju untuk tidak menggunakan Website untuk pencucian uang atau pelanggaran lainnya.' },
      { id: '11.6',  text: 'Klien setuju untuk menyediakan dokumentasi dan bekerja sama untuk memastikan kepatuhan AML.' },
      { id: '11.7',  text: 'Setiap tindakan Klien atau pihak ketiga dengan partisipasi Klien, yang mengganggu kestabilan sistem atau layanan Perusahaan dapat mengakibatkan penangguhan Akun Klien, penolakan layanan, pemotongan dana Klien, penolakan penarikan keuntungan Klien, dan/atau penolakan pendaftaran ulang mereka.' },
      { id: '11.8',  text: 'Klien bertanggung jawab untuk menjaga kredensial login mereka dan harus segera memberi tahu Perusahaan jika ada akses tidak sah ke kredensial login mereka atau Akun Klien.' },
      { id: '11.9',  text: 'Perusahaan tidak bertanggung jawab atas tindakan atau kelalaian Klien di Platform Perdagangan, termasuk kerugian Klien dari Transaksi Perdagangan.' },
      { id: '11.10', text: 'Perusahaan tidak bertanggung jawab atas kegagalan (termasuk kerugian Klien) yang disebabkan oleh serangan peretas, kerusakan teknis baik pada Klien maupun Perusahaan, atau gangguan komunikasi di luar kendalinya.' },
      { id: '11.11', text: 'Perusahaan tidak bertanggung jawab atas kerugian Klien yang diakibatkan oleh peristiwa force majeure, termasuk tetapi tidak terbatas pada bencana alam, aksi teroris, konflik militer, kerusuhan, pemogokan, pembatasan pemerintah yang memengaruhi Perjanjian, perubahan peraturan pasar atau mata uang.' },
      { id: '11.12', text: 'Keuntungan Klien yang diperoleh dari penggunaan bot trading, kecerdasan buatan, perangkat lunak khusus yang tidak secara langsung disetujui oleh Perusahaan, atau eksploitasi kerentanan dalam perangkat lunak bursa atau Server Perusahaan tidak akan menjadi kewajiban keuangan Perusahaan.' },
      { id: '11.13', text: 'Jika terjadi pelanggaran Perjanjian oleh Klien, Perusahaan berhak untuk mengakhiri Perjanjian secara sepihak tanpa pemberitahuan sebelumnya.' },
    ],
  },
  {
    id: 'sengketa', roman: 'XII', title: 'Penyelesaian Sengketa', color: '#059669',
    clauses: [
      { id: '12.1', text: 'Klien harus terlebih dahulu menyampaikan sengketa kepada Tim Dukungan Perusahaan. Jika tidak puas, Klien dapat meminta eskalasi ke Departemen Penyelesaian Sengketa melalui Tim Dukungan Perusahaan atau mengirimkan keluhan melalui email complaints@stouch.com.' },
      { id: '12.2', text: 'Pengaduan harus menyertakan nama lengkap Klien, email, tanggal dan detail operasi yang disengketakan, deskripsi terperinci, dan dokumen pendukung jika tersedia.' },
      { id: '12.3', text: 'Keluhan yang berisi pernyataan provokatif, tuduhan tidak berdasar, ancaman, penghinaan, atau bahasa yang tidak senonoh terhadap Perusahaan atau stafnya dapat ditolak.' },
      { id: '12.4', text: 'Perusahaan akan mengakui penerimaan pengaduan Klien oleh Departemen Penyelesaian Sengketa dalam waktu 2 hari kerja, memberikan Klien temuan awal dan jadwal keputusan.' },
      { id: '12.5', text: 'Perusahaan merespons Klien dengan langkah-langkah penyelesaian sengketa dan rekomendasi dalam waktu 10 hari kerja sejak diterimanya pengaduan Klien. Periode ini dapat diperpanjang hingga 10 hari kerja dengan pemberitahuan kepada Klien jika diperlukan informasi tambahan.' },
      { id: '12.6', text: 'Klaim atas kehilangan keuntungan atau kerugian moral tidak dipertimbangkan.' },
      { id: '12.7', text: 'Jika Klien tidak mengajukan banding atas respons Perusahaan dalam waktu 5 hari kerja setelah respons dikirim ke Klien, maka sengketa dianggap telah diselesaikan.' },
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
      { id: '15.4', text: 'Klien dapat mengakhiri Perjanjian kapan saja dengan alasan apa pun. Untuk mengakhiri secara sepihak, Klien harus memblokir Akun mereka melalui antarmuka Akun Pribadi atau Dukungan Perusahaan setelah menarik dana.' },
      { id: '15.5', text: 'Membuka blokir Akun atas permintaan Klien mengembalikan Perjanjian sesuai dengan versi saat ini.' },
      { id: '15.6', text: 'Perusahaan dapat mengakhiri Perjanjian kapan pun secara sepihak tanpa memberikan alasan.' },
      { id: '15.7', text: 'Perusahaan harus memberi tahu Klien setidaknya 1 bulan kalender sebelum penghentian aktivitasnya. Dalam hal ini, Perusahaan harus membayar penuh dana Akun Klien.' },
      { id: '15.8', text: 'Perusahaan dapat mengubah Perjanjian kapan saja; perubahan berlaku setelah dipublikasikan di Website kecuali dinyatakan sebaliknya. Klien bertanggung jawab untuk meninjau pembaruan.' },
      { id: '15.9', text: 'Ketidaksetujuan Klien dengan amandemen mengharuskan penghentian penggunaan layanan oleh Klien dan pemblokiran Akun Klien melalui Akun Pribadi atau Dukungan Perusahaan, setelah Penarikan dana.' },
    ],
  },
  {
    id: 'ketentuan-akhir', roman: 'XVI', title: 'Ketentuan Akhir', color: '#7c3aed',
    clauses: [
      { id: '16.1', text: 'Klien tidak dapat mengalihkan hak atau kewajiban kepada pihak ketiga berdasarkan Perjanjian ini.' },
      { id: '16.2', text: 'Jika terjadi perbedaan, versi bahasa Inggris yang berlaku di atas terjemahan.' },
      { id: '16.3', text: 'Perjanjian ini diatur oleh hukum Republik Vanuatu. Setiap sengketa yang timbul dari atau sehubungan dengan Perjanjian ini akhirnya akan diselesaikan oleh pengadilan yang berwenang di Republik Vanuatu.' },
    ],
  },
]

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
        <span className="text-[11px] font-black tabular-nums flex-shrink-0 w-8 text-center tracking-wide" style={{ color: `${section.color}80` }}>
          {section.roman}
        </span>
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
                <span className="text-[10px] font-bold flex-shrink-0 mt-0.5 w-10 sm:w-12 tabular-nums" style={{ color: `${section.color}70` }}>{clause.id}</span>
                <p className="text-sm text-gray-600 leading-relaxed">{clause.text}</p>
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
          <span className="text-[10px] font-black w-7 text-right flex-shrink-0 tabular-nums" style={{ color: `${sec.color}70` }}>{sec.roman}</span>
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
              <span className="text-[10px] font-black w-7 text-right flex-shrink-0 tabular-nums" style={{ color: `${sec.color}70` }}>{sec.roman}</span>
              <span className="text-sm text-gray-700 font-medium leading-tight">{sec.title}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Client page export ───────────────────────────────────────────────────────

export default function AgreementPageClient() {
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
        title="Perjanjian Klien"
        subtitle="Berlaku mulai 15 Januari 2026"
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
            Perjanjian Klien
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-2xl">
            Sesuai dengan syarat dan ketentuan yang ditetapkan di sini, Verte Securities Limited,
            sebuah perusahaan yang terdaftar sesuai dengan hukum Republik Vanuatu, nomor perusahaan{' '}
            <span className="font-semibold text-gray-700">700726</span>, beralamat di International
            Business Centre, Suite 8, Pot 820/104, Route Elluk, Port Vila, Vanuatu memberikan akses
            kepada seseorang (&apos;Klien&apos;) ke website stouch.com.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Berlaku',     value: '15 Januari 2026' },
              { label: 'Versi',       value: 'Bahasa Indonesia' },
              { label: 'Yurisdiksi',  value: 'Republik Vanuatu' },
              { label: 'Total Bab',   value: `${SECTIONS.length} Bab` },
            ].map(({ label, value }) => (
              <div key={label} className="px-3 py-2 rounded-xl bg-white" style={{ border: '1px solid #f0f0f0' }}>
                <p className="text-[10px] text-gray-400">{label}</p>
                <p className="text-xs font-bold text-gray-700">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-8 lg:gap-10 items-start">
          <aside className="hidden lg:block w-52 xl:w-60 flex-shrink-0">
            <TableOfContents onNavigate={scrollToSection} />
          </aside>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="rounded-2xl p-4 flex items-start gap-3 mb-5" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-bold">Penting:</span> Dengan mendaftar di Website, Klien mengakui
                penerimaan Perjanjian ini dan Kebijakan Privasi. Penerimaan tersebut merupakan persetujuan
                penuh dan tanpa syarat untuk semua ketentuan dalam Perjanjian ini. Jika terjadi perbedaan,
                versi bahasa Inggris yang berlaku.
              </p>
            </div>

            {SECTIONS.map(section => <SectionCard key={section.id} section={section} />)}

            <div className="rounded-2xl p-5 mt-6" style={{ background: '#f8fafc', border: '1px solid #e8edf2' }}>
              <div className="flex items-start gap-3">
                <Scale size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Ketentuan Hukum</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Perjanjian ini diatur oleh hukum Republik Vanuatu. Terakhir diperbarui 15 Januari 2026.
                    Hubungi{' '}
                    <a href="mailto:support@stouch.com" className="text-blue-500 hover:underline font-medium">support@stouch.com</a>
                    {' '}atau{' '}
                    <a href="mailto:complaints@stouch.com" className="text-blue-500 hover:underline font-medium">complaints@stouch.com</a>.
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