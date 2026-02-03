'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Newspaper,
  ChevronLeft,
  Calendar,
  TrendingUp,
  AlertCircle,
  Award,
  Zap,
  BookOpen,
  Search,
  ChevronRight
} from 'lucide-react'

type NewsCategory = 'all' | 'announcement' | 'update' | 'promotion' | 'education' | 'market'

interface NewsItem {
  id: string
  title: string
  excerpt: string
  category: NewsCategory
  date: string
  featured?: boolean
  badge?: string
}

const generateDynamicDate = (daysAgo: number) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const generateNewsData = (): NewsItem[] => {
  const articles = [
    {
      title: 'Peluncuran Trading Tournament Bulan Ini dengan Hadiah $100,000',
      excerpt: 'Bersiaplah untuk turnamen trading terbesar tahun ini yang akan segera dimulai! Dengan total hadiah mencapai $100,000, kompetisi ini terbuka untuk semua level trader dari pemula hingga profesional. Peserta akan berkompetisi dalam berbagai kategori termasuk Forex, Crypto, dan Saham dengan sistem penilaian yang fair dan transparan. Hadiah utama senilai $50,000 menanti para juara, sementara 100 pemenang lainnya akan membawa pulang berbagai hadiah menarik. Pendaftaran dibuka terbatas hanya untuk 1000 peserta pertama, jadi segera daftarkan diri Anda sekarang!',
      category: 'announcement' as const,
      badge: 'HOT'
    },
    {
      title: 'Update Platform: Fitur AI Trading Assistant Kini Tersedia',
      excerpt: 'Kami dengan bangga memperkenalkan AI Trading Assistant, fitur revolusioner yang akan mengubah cara Anda trading. Ditenagai oleh machine learning terkini dan analisis big data real-time, asisten AI ini memberikan rekomendasi trading yang akurat berdasarkan pola pasar historis dan kondisi terkini. Fitur ini mampu menganalisis ratusan indikator teknikal secara simultan, memberikan signal entry dan exit yang optimal, serta menyesuaikan strategi berdasarkan profil risiko masing-masing trader. Beta testing menunjukkan peningkatan akurasi trading hingga 40% dibandingkan analisis manual. Akses eksklusif untuk member premium tersedia mulai minggu depan.',
      category: 'update' as const,
      badge: 'NEW'
    },
    {
      title: 'Promo Spesial: Cashback 20% untuk Semua Member',
      excerpt: 'Nikmati kesempatan emas mendapatkan cashback 20% untuk setiap transaksi trading Anda selama periode promo berlangsung. Tidak ada batasan maksimal cashback, semakin banyak Anda trading, semakin besar cashback yang Anda dapatkan. Promo ini berlaku untuk semua instrumen trading termasuk Forex major pairs, cryptocurrency populer, saham blue chip, dan komoditas. Cashback akan dikreditkan secara otomatis setiap akhir minggu ke akun trading Anda dan dapat langsung digunakan untuk trading atau withdrawal. Syarat dan ketentuan berlaku, pastikan akun Anda terverifikasi penuh untuk menikmati promo ini.',
      category: 'promotion' as const
    },
    {
      title: 'Panduan Lengkap: Strategi Trading untuk Pemula',
      excerpt: 'Memulai journey trading bisa terasa overwhelming, tapi dengan panduan yang tepat, siapapun bisa menjadi trader sukses. Guide komprehensif ini membahas fundamental trading dari A hingga Z, mulai dari memahami chart candlestick, indikator teknikal populer seperti RSI dan MACD, hingga teknik manajemen risiko yang proper. Anda akan belajar cara membaca pergerakan pasar, mengidentifikasi trend, menentukan level support dan resistance, serta kapan waktu terbaik untuk entry dan exit. Dilengkapi dengan contoh real case study dan latihan praktis yang bisa langsung diterapkan. Download e-book gratis dan dapatkan akses ke video tutorial eksklusif.',
      category: 'education' as const
    },
    {
      title: 'Analisis Market: Peluang Trading di Pasar Crypto',
      excerpt: 'Pasar cryptocurrency menunjukkan pergerakan bullish yang kuat dalam beberapa minggu terakhir dengan Bitcoin menembus level resistance krusial di $50,000. Analisis teknikal menunjukkan formasi golden cross pada timeframe daily yang mengindikasikan momentum positif berkelanjutan. Ethereum juga menunjukkan kekuatan dengan volume trading yang meningkat signifikan, sementara altcoin seperti Solana dan Cardano mulai menunjukkan tanda-tanda accumulation. Para analis memproyeksikan potensi rally hingga akhir quarter dengan target Bitcoin di $65,000. Namun trader harus tetap waspada terhadap volatilitas tinggi dan selalu gunakan stop loss yang ketat untuk melindungi modal.',
      category: 'market' as const
    },
    {
      title: 'Pengumuman: Maintenance Sistem Terjadwal',
      excerpt: 'Dalam rangka meningkatkan performa platform dan keamanan sistem, kami akan melakukan maintenance terjadwal pada server utama. Maintenance akan berlangsung selama 4 jam mulai pukul 02:00 WIB hingga 06:00 WIB dengan downtime minimal yang diharapkan tidak lebih dari 30 menit. Selama periode ini, beberapa fitur mungkin tidak dapat diakses termasuk login, deposit, dan withdrawal. Namun posisi trading yang sudah terbuka akan tetap aman dan stop loss/take profit akan tetap berfungsi normal. Kami merekomendasikan untuk menutup posisi yang tidak perlu atau menghindari membuka posisi baru menjelang waktu maintenance. Tim teknis akan standby 24/7 untuk memastikan proses berjalan lancar.',
      category: 'announcement' as const
    },
    {
      title: 'Success Story: Trader Pemula Raih Profit $10,000',
      excerpt: 'Kisah inspiratif dari Rudi Santoso, seorang karyawan swasta yang berhasil mengubah $500 menjadi $10,000 dalam waktu 3 bulan melalui trading Forex. Tanpa background finansial, Rudi memulai dengan belajar autodidak dari artikel dan video tutorial gratis. Kunci suksesnya terletak pada disiplin ketat dalam menerapkan risk management, tidak pernah risk lebih dari 2% per trade, dan konsisten mengikuti trading plan yang sudah dibuat. Dia fokus hanya pada 2 pair currency EUR/USD dan GBP/USD, menguasai betul karakteristik pergerakan kedua pair tersebut. Strategy sederhana yang digunakannya adalah kombinasi moving average dan RSI untuk konfirmasi trend. Simak interview lengkap dan detail strategi yang dia gunakan dalam artikel ini.',
      category: 'education' as const
    },
    {
      title: 'Update: Tambahan Instrumen Trading Baru',
      excerpt: 'Platform kami terus berkembang dengan menambahkan 50+ instrumen trading baru untuk memenuhi kebutuhan diversifikasi portfolio trader. Instrumen baru mencakup saham-saham teknologi terkini seperti Nvidia, AMD, dan Meta, cryptocurrency emerging seperti Avalanche dan Polygon, serta komoditas strategis termasuk lithium dan rare earth metals. Setiap instrumen dilengkapi dengan spread kompetitif, leverage hingga 1:100, dan eksekusi order yang cepat. Kami juga menambahkan fitur fractional trading untuk saham mahal sehingga trader dengan modal kecil tetap bisa berinvestasi pada perusahaan-perusahaan blue chip. Chart analysis tersedia dengan 20+ indikator teknikal dan drawing tools profesional.',
      category: 'update' as const
    },
    {
      title: 'Promo Referral: Dapatkan Bonus hingga $500',
      excerpt: 'Program referral kami yang paling generous kembali hadir dengan reward yang lebih besar! Ajak teman, keluarga, atau kolega untuk bergabung dan dapatkan bonus hingga $500 untuk setiap referral yang memenuhi syarat. Bonus $100 langsung ketika referral melakukan deposit pertama minimal $200, tambahan $200 ketika mereka trading volume $10,000, dan bonus ultimate $200 lagi ketika referral tetap aktif trading selama 3 bulan berturut-turut. Yang lebih menarik, tidak ada batasan jumlah referral yang bisa Anda ajak, semakin banyak yang join semakin besar passive income Anda. Bonus dapat di-withdraw atau digunakan untuk trading, terserah Anda. Link referral khusus tersedia di dashboard member area.',
      category: 'promotion' as const
    },
    {
      title: 'Webinar Gratis: Technical Analysis Masterclass',
      excerpt: 'Daftarkan diri Anda untuk webinar eksklusif bersama veteran trader profesional yang telah berkecimpung di industri selama 15 tahun. Dalam sesi 3 jam ini, Anda akan mempelajari teknik analisis teknikal advanced yang jarang dibagikan secara publik, termasuk cara membaca institutional orderflow, mendeteksi liquidity trap, dan memanfaatkan market structure untuk profit konsisten. Materi mencakup price action trading, multi-timeframe analysis, dan psychological level yang sering menjadi turning point pasar. Sesi live trading akan dilakukan untuk demonstrasi real-time bagaimana menerapkan konsep-konsep tersebut. Kapasitas terbatas hanya 500 peserta, semua peserta akan mendapatkan recording dan slide presentation lengkap. Q&A session interaktif di akhir webinar.',
      category: 'education' as const
    },
    {
      title: 'Berita Pasar: Bitcoin Menembus Level $50,000',
      excerpt: 'Bitcoin menciptakan history baru dengan menembus psychological level $50,000 untuk pertama kalinya sejak 6 bulan lalu, dipicu oleh sentiment positif dari institutional adoption yang meningkat. Volume trading mencapai rekor tertinggi dengan $40 miliar dalam 24 jam terakhir, menunjukkan conviction kuat dari buyer. Technical analysis mengindikasikan potential continuation hingga resistance berikutnya di $55,000 dengan support kuat di $48,000. On-chain metrics menunjukkan whale accumulation yang agresif dan exchange outflow yang signifikan, signal bullish jangka panjang. Namun beberapa analyst memperingatkan kemungkinan pullback karena RSI sudah memasuki zona overbought. Trader disarankan untuk wait and see konfirmasi breakout atau ambil profit partial di level current.',
      category: 'market' as const
    },
    {
      title: 'Update Regulasi: Perubahan Kebijakan Trading 2024',
      excerpt: 'Otoritas finansial mengumumkan update regulasi trading yang akan berlaku efektif mulai quarter depan dengan beberapa perubahan signifikan. Leverage maksimal untuk retail trader akan dikurangi dari 1:500 menjadi 1:100 untuk instrumen Forex dan 1:50 untuk cryptocurrency, bertujuan melindungi trader dari excessive risk. Mandatory negative balance protection akan diterapkan untuk semua broker, memastikan trader tidak bisa loss lebih dari deposit mereka. Proses verifikasi KYC diperkuat dengan requirement dokumen tambahan dan face recognition untuk mencegah fraud. Ketentuan withdrawal diperketat dengan maksimum 3x deposit bonus untuk anti money laundering. Platform kami sudah fully compliant dengan regulasi baru, memastikan keamanan dana dan legalitas trading Anda.',
      category: 'announcement' as const
    },
    {
      title: 'Tips Trading: Cara Mengelola Risiko dengan Efektif',
      excerpt: 'Risk management adalah fondasi kesuksesan trading jangka panjang yang sering diabaikan oleh trader pemula. Rule nomor satu adalah never risk lebih dari 2% dari total capital per trade, memastikan Anda bisa survive dari serie losing streak tanpa margin call. Diversifikasi portfolio dengan trading multiple instruments dari different markets untuk mengurangi correlation risk. Gunakan stop loss yang calculated berdasarkan ATR atau structure support/resistance, bukan arbitrary number. Position sizing harus disesuaikan dengan volatilitas instrument dan risk appetite Anda, tidak selalu sama untuk setiap trade. Maintain minimum risk-reward ratio 1:2, artinya potential profit harus minimal 2x dari potential loss. Psychological aspect juga crucial, hindari revenge trading dan emotional decision making setelah loss.',
      category: 'education' as const
    },
    {
      title: 'Promo Deposit: Bonus 50% untuk New Member',
      excerpt: 'Welcome bonus spektakuler untuk member baru yang bergabung platform kami! Dapatkan bonus deposit 50% untuk first deposit Anda dengan maksimum bonus hingga $5,000. Misalnya deposit $1,000 akan mendapat $500 bonus tambahan, total $1,500 untuk trading. Bonus dapat digunakan sebagai margin untuk membuka posisi lebih besar dan maximize profit potential. Requirements untuk withdrawal profit dari bonus sangat reasonable, hanya perlu trading volume 20x dari jumlah bonus dalam 60 hari. Semua instrumen eligible untuk fulfill volume requirement tanpa restriction. New member juga mendapat akses gratis ke premium tools senilai $200 per bulan selama 3 bulan pertama, termasuk trading signals, economic calendar, dan market analysis harian. Promo terbatas hanya untuk 200 member pertama bulan ini.',
      category: 'promotion' as const
    },
    {
      title: 'Market Analysis: Tren Forex Minggu Ini',
      excerpt: 'Analisis mendalam terhadap pergerakan major currency pairs menunjukkan trend dominan Dollar strengthening sejak rilis data NFP yang exceed expectation. EUR/USD mengalami tekanan bearish dengan breakdown dari support 1.0800, berpotensi melanjutkan decline menuju 1.0700 jika Fed maintain hawkish stance. GBP/USD masih range-bound di 1.2500-1.2650 menunggu clarity dari BOE meeting minggu depan. USD/JPY bullish continuation dengan target 152.00 supported oleh interest rate differential yang melebar. AUD/USD vulnerable terhadap downside risk karena weakening Chinese economy dan commodity price yang terkoreksi. Strategy trading yang recommended adalah follow trend dengan strict risk management, avoid counter-trend trading di kondisi momentum yang kuat seperti sekarang.',
      category: 'market' as const
    },
    {
      title: 'Pengumuman: Peluncuran Mobile App Versi 2.0',
      excerpt: 'Kami excited mengumumkan launching mobile app versi 2.0 dengan complete overhaul design dan tons of new features yang akan revolutionize mobile trading experience Anda. UI/UX dirancang ulang total dengan focus pada simplicity dan efficiency, memungkinkan Anda execute order dalam 2 tap saja. Advanced charting dengan 100+ indicators dan drawing tools sama powerful dengan desktop version. Push notification real-time untuk price alerts, economic events, dan margin level warning. Biometric authentication dengan fingerprint dan face ID untuk security maksimal. Quick deposit & withdrawal langsung dari app tanpa perlu web browser. Offline mode untuk view chart history dan trading journal even tanpa koneksi internet. Available untuk iOS dan Android, download gratis di App Store dan Play Store mulai besok.',
      category: 'update' as const
    },
    {
      title: 'Educational: Memahami Candlestick Pattern',
      excerpt: 'Candlestick pattern adalah bahasa universal yang digunakan trader di seluruh dunia untuk membaca market psychology dan prediksi future price movement. Pattern seperti Doji mengindikasikan indecision di market, Hammer dan Shooting Star menandakan potential reversal, sedangkan Engulfing pattern menunjukkan shift momentum yang kuat. Understanding tidak hanya recognize pattern tapi juga context dimana pattern tersebut muncul - apakah di support/resistance, trending market, atau ranging market. Confirmation dari volume dan indicator lain sangat penting untuk meningkatkan success rate. Course lengkap kami mengajarkan 20+ pattern paling profitable dengan real chart examples dan backtest statistics. Setiap pattern dijelaskan psychology nya, entry point optimal, stop loss placement, dan risk-reward ratio yang realistic.',
      category: 'education' as const
    },
    {
      title: 'Promo Weekend: Double Cashback Setiap Sabtu',
      excerpt: 'Weekend trading menjadi lebih menguntungkan dengan promo Double Cashback khusus setiap hari Sabtu! Semua transaksi trading yang Anda lakukan dari pukul 00:00 hingga 23:59 WIB akan mendapat cashback 2x lipat dari rate normal. Standard cashback 0.5 pips per lot menjadi 1 pip per lot, artinya trading 100 lot dalam sehari bisa dapat cashback senilai $1,000. Berlaku untuk semua pairs Forex, commodities, dan indices tanpa restriction. Scalper dan day trader yang active di weekend sangat diuntungkan karena frekuensi trading tinggi = cashback lebih besar. Cashback dikreditkan instant setelah trade close, bisa langsung dicairkan atau used untuk trading lagi. No minimum trading volume requirement, bahkan micro lot eligible untuk cashback. Manfaatkan weekend liquidity untuk maximize profit dan bonus!',
      category: 'promotion' as const
    },
    {
      title: 'Market Update: Analisis Saham Tech Giant',
      excerpt: 'Sektor teknologi menunjukkan recovery yang impresif setelah koreksi tajam quarter lalu, dengan mega cap stocks leading the charge. Apple stock rally 15% dalam sebulan didorong oleh strong iPhone sales dan expansion ke AI product. Microsoft menembus all-time high berkat cloud revenue growth yang exceed expectation dan ChatGPT integration success. Google rebound dari regulatory concern dengan advertising revenue yang beat consensus estimate. Nvidia remain investor favorite dengan dominasi di AI chip market dan order backlog yang penuh sampai tahun depan. Amazon mulai bullish reversal setelah cost cutting program berhasil improve profit margin. Technical outlook untuk tech sector overall masih positive dengan uptrend intact, pullback minor adalah buying opportunity. Analyst consensus rating majority buy dengan average price target 20% upside from current level.',
      category: 'market' as const
    },
    {
      title: 'Tutorial: Cara Menggunakan Indikator MACD',
      excerpt: 'MACD (Moving Average Convergence Divergence) adalah salah satu indicator paling versatile dan powerful untuk trend following dan momentum trading. Terdiri dari MACD line, signal line, dan histogram, indicator ini memberikan multiple signals dalam satu tool. Crossover bullish ketika MACD line cross above signal line mengindikasikan momentum buying yang meningkat, ideal untuk entry long. Sebaliknya, crossover bearish signal potential short opportunity. Divergence antara MACD dan price adalah early warning dari trend reversal yang sering terjadi sebelum price actually berbalik. Histogram expansion menunjukkan momentum yang strengthening, contraction menandakan weakening momentum. Setting standard 12, 26, 9 cocok untuk daily trading, tapi bisa di-adjust sesuai timeframe dan instrument. Kombinasi MACD dengan support/resistance level dan volume analysis meningkatkan win rate significantly.',
      category: 'education' as const
    },
    {
      title: 'Promo Flash Sale: Trading Fee Discount 30%',
      excerpt: 'Limited time flash sale dengan discount trading fee hingga 30% untuk semua member! Periode promo hanya 72 jam, jadi act fast untuk maximize savings. Standard commission $7 per lot menjadi hanya $4.9, spread untuk major pairs dikurangi 30% dari normal rate. High frequency trader yang biasa trading ratusan lot per hari bisa save ribuan dollar dalam fees. Discount berlaku automatic tanpa perlu klaim manual atau enter voucher code, semua trades during promo period langsung dapat discount. Tidak ada minimum atau maximum trading volume, scalping dengan profit kecil pun tetap worthwhile karena cost nya jauh lebih rendah. Semua asset class included: Forex, stocks, commodities, indices, dan cryptocurrencies. Calculate berapa banyak Anda bisa hemat dan trade lebih banyak dengan modal yang sama.',
      category: 'promotion' as const
    },
    {
      title: 'Berita: Kemitraan Strategis dengan Broker Internasional',
      excerpt: 'Milestone penting dalam growth trajectory kami dengan announcement partnership strategis bersama broker internasional terkemuka yang regulated di multiple jurisdictions. Kolaborasi ini membuka akses ke deeper liquidity pool dengan spread yang lebih tight dan slippage yang minimal even during volatile market condition. Clients kami benefit dari institutional-grade execution speed dengan average latency dibawah 10ms dan order fill rate 99.9%. Access ke dark pool dan prime broker network memberikan advantage signifikan especially untuk large volume traders. Technology infrastructure di-upgrade menggunakan co-location server di major financial hubs seperti London, New York, dan Tokyo. Partnership juga include knowledge sharing program dimana expert analysts dari partner broker akan provide exclusive market insights dan trading strategies untuk our premium members. Further product expansion planned untuk next quarter including CFD on stocks, options, dan futures.',
      category: 'announcement' as const
    },
    {
      title: 'Tips: 5 Kesalahan Umum yang Harus Dihindari Trader',
      excerpt: 'Kesalahan pertama dan paling fatal adalah trading tanpa stop loss, mengharapkan market akan berbalik sesuai harapan - ini adalah gambling bukan trading. Kedua, over-leveraging dengan risk terlalu besar per trade karena serakah ingin cepat kaya, 90% traders yang bangkrut disebabkan oleh hal ini. Ketiga, lack of trading plan dan decision making berdasarkan emosi atau random signal dari social media tanpa proper analysis. Keempat, tidak maintain trading journal sehingga tidak belajar dari mistakes dan terus mengulang kesalahan yang sama. Kelima, chasing losses dengan revenge trading setelah experiencing losing streak, ini pasti berujung pada losses yang lebih besar. Solutions untuk hindari mistakes ini adalah education yang proper, discipline dalam execute trading plan, dan realistic expectation tentang return yang sustainable dari trading.',
      category: 'education' as const
    },
    {
      title: 'Update: Peningkatan Kecepatan Eksekusi Order',
      excerpt: 'Infrastructure upgrade terbaru berhasil meningkatkan order execution speed hingga 50% lebih cepat dari sebelumnya, critical untuk trader yang depend on precise entry timing. Server hardware di-upgrade menggunakan latest generation processors dan SSD storage dengan throughput 10x lebih tinggi. Network latency dikurangi melalui implementation of direct market access dan removal of unnecessary intermediaries dalam order routing. Average execution time now below 50 milliseconds untuk 95% orders, dengan zero requotes even during major news releases yang typically cause volatility spikes. Slippage rate turun drastis dari 0.5 pips menjadi hanya 0.1 pips average, saving signifikan especially untuk high frequency trading strategies. Live monitoring dashboard available untuk verify execution quality dan transparency tentang reject rate atau timeout. Testing results menunjukkan 99.8% order fills at requested price atau better during normal market conditions.',
      category: 'update' as const
    },
    {
      title: 'Promo Anniversary: Hadiah Total $50,000',
      excerpt: 'Celebrate anniversary kami yang ke-5 dengan mega promo hadiah total $50,000 untuk loyal members! Multiple contests running simultaneously dengan berbagai kategori: highest profit percentage, most consistent profitable months, largest trading volume, dan best risk-adjusted return. Grand prize $20,000 untuk overall champion, plus kategori prizes masing-masing $5,000. Participation automatic untuk semua active members, no registration fee atau minimum deposit requirement. Contest period 2 bulan memberikan sufficient time untuk compete fairly. Leaderboard updated real-time supaya Anda bisa track position dan adjust strategy. Special bonus prizes untuk top 100 finishers termasuk gadgets, travel vouchers, dan lifetime VIP membership dengan benefit eksklusif. Winners announcement live streaming event dengan lucky draw tambahan senilai $10,000 untuk all participants. This is perfect opportunity untuk test your skills dan win substantial prizes.',
      category: 'promotion' as const
    },
    {
      title: 'Analysis: Peluang Trading di Pasar Komoditas',
      excerpt: 'Commodity markets experiencing significant movements driven by geopolitical tensions dan supply chain disruptions yang create attractive trading opportunities. Crude oil trading dalam range $75-$85 per barrel dengan upside bias jika OPEC+ extend production cuts dan demand dari China continue to recover. Gold maintain strength above $2,000 sebagai safe haven asset amidst global uncertainty, technical setup suggesting potential rally toward $2,100. Natural gas volatile karena seasonal demand dan weather forecasts, winter heating season historically bullish untuk NG futures. Agricultural commodities seperti wheat dan corn facing supply concerns dari adverse weather di major producing regions, prices could spike dengan tiba-tiba. Metals industrials seperti copper dan aluminum benefit dari green energy transition dan infrastructure spending, long-term secular trend remain intact despite short-term fluctuations.',
      category: 'market' as const
    },
    {
      title: 'Pengumuman: Jadwal Trading Hari Libur',
      excerpt: 'Important notice mengenai adjusted trading hours selama upcoming public holidays untuk ensure proper planning dari trading activities Anda. Major markets termasuk NYSE, NASDAQ, dan LSE akan closed completely pada tanggal tertentu, sementara Asian markets operate dengan shortened sessions. Forex market akan continue trading tapi dengan significantly reduced liquidity yang bisa cause wider spreads dan unpredictable price movements. Cryptocurrency markets remain open 24/7 as usual tapi expect lower volume dan higher volatility. Platform kami akan available untuk access dan monitoring positions, tapi strongly recommend avoid opening new trades close to atau during holiday periods karena execution risk yang elevated. Customer support operating dengan skeleton crew, response time mungkin slower dari biasanya untuk non-urgent queries. Comprehensive holiday calendar tersedia di website dengan specific hours untuk each market dan instrument, bookmark untuk future reference.',
      category: 'announcement' as const
    },
    {
      title: 'Educational Series: Risk Management 101',
      excerpt: 'Fundamental principles dari risk management yang proper adalah foundation dari sustainable trading success yang profitable dalam jangka panjang. Position sizing calculation harus based on account equity dan risk tolerance, typically 1-2% risk per trade adalah sweet spot untuk balance antara growth dan preservation. Stop loss placement critical untuk limit potential losses - use ATR-based stops atau structural levels seperti swing high/low for logical placement. Diversification across different instruments dan strategies reduce portfolio correlation risk, tidak put all eggs in one basket. Hedging techniques using negatively correlated assets bisa protect against adverse market movements. Regular review dan adjustment dari risk parameters necessary karena market conditions dan account size constantly changing. Psychology aspect equally important - maintain emotional discipline untuk stick dengan risk rules even during drawdown periods ketika temptation untuk deviate paling besar.',
      category: 'education' as const
    },
    {
      title: 'Market Outlook: Prediksi Pasar Q4 2024',
      excerpt: 'Fourth quarter outlook menunjukkan mixed signals dengan opportunities dan challenges yang perlu carefully navigated. Equity markets historically strong di Q4 karena year-end rally phenomenon dan institutional window dressing, tapi valuations already elevated raise concern about potential correction. Fixed income sensitive terhadap central bank policies - any pivot dari Fed regarding rate cuts bisa trigger significant bond market movements. Currency markets akan volatile mengikuti diverging monetary policies across major economies dan geopolitical developments. Emerging markets facing headwinds dari strong dollar dan capital outflows, tapi valuations attractive untuk long-term investors. Commodities mixed outlook dengan energy bullish karena supply constraints sementara base metals facing demand concerns dari China slowdown. Key risks include escalation geopolitical tensions, unexpected inflation surge, atau financial system stress dari regional banking issues.',
      category: 'market' as const
    },
    {
      title: 'Update Security: Two-Factor Authentication Wajib',
      excerpt: 'Enhanced security measures implementation dengan mandatory two-factor authentication untuk all accounts demi protect dari unauthorized access dan cyber threats yang increasingly sophisticated. 2FA adds critical additional layer yang makes account takeover virtually impossible even jika password compromised. Support multiple authentication methods including SMS code, authenticator apps seperti Google Authenticator atau Authy, dan hardware security keys untuk maximum protection. Setup process straightforward dengan step-by-step guide tersedia, occupying hanya 5 menit dari waktu Anda. Grace period 30 hari provided untuk compliance sebelum enforcement strict dimana accounts tanpa 2FA enabled akan restricted dari trading dan withdrawal functions. Backup codes automatically generated during setup untuk recovery access jika authentication device lost atau unavailable. Statistics menunjukkan 99% reduction dalam successful account breaches setelah 2FA implementation, investment minimal effort untuk peace of mind yang significant.',
      category: 'announcement' as const
    },
    {
      title: 'Promo Loyalty: Reward Program untuk Member Setia',
      excerpt: 'Revolutionary loyalty program yang rewards consistent trading activity dengan tangible benefits yang accumulate over time. Earn points untuk every lot traded, every friend referred, dan every monthly profitability achieved - multiple ways untuk collect points. Points redeemable untuk cash rebates, trading credit, premium tool subscriptions, atau exclusive merchandise dari luxury brands. Tier system dengan Bronze, Silver, Gold, dan Platinum levels - higher tiers unlock premium benefits seperti dedicated account manager, priority customer support, dan invitation ke exclusive trading seminars. Monthly challenges dan bonus point multiplier events untuk accelerate point accumulation. Points never expire selama account remain active, akumulasi value substantial dalam jangka panjang. Top tier members receive annual gifts dan all-expenses-paid trip ke international trading conferences. Transparent point balance dan redemption history viewable real-time dalam member dashboard.',
      category: 'promotion' as const
    },
    {
      title: 'Breaking News: Fed Umumkan Keputusan Suku Bunga',
      excerpt: 'Federal Reserve mengumumkan keputusan mengejutkan untuk maintain interest rates unchanged di 5.25-5.50% range, contrary to market expectation untuk 25bps cut. Decision driven by stubborn inflation yang remain above target dan labor market yang surprisingly resilient. Fed Chair dalam press conference emphasized "higher for longer" approach dengan possibility rate cuts tertunda until mid-next year. Market reaction immediate dan volatile dengan stock indices dropping 2% initially sebelum partial recovery. Dollar strengthen significantly across board dengan DXY surging above 106 level. Bond yields spike dengan 10-year Treasury jumping 15 basis points dalam knee-jerk response. Crypto markets particularly hard hit dengan Bitcoin falling 5% dan altcoins experiencing double-digit declines. Forward guidance suggest Fed maintaining hawkish bias dengan flexibility adjust if economic conditions deteriorate substantially.',
      category: 'market' as const
    },
    {
      title: 'Tutorial Advanced: Strategi Scalping yang Profitable',
      excerpt: 'Scalping adalah high-frequency trading strategy yang aim untuk capture small price movements dengan numerous trades throughout the day. Success requires low-latency execution, tight spreads, dan strong mental endurance karena fast-paced decision making constantly. Popular techniques include range scalping di sideways markets, breakout scalping saat volatility spikes, dan news scalping during economic releases. Timeframes typically 1-minute atau 5-minute charts dengan quick entry dan exit - average holding period under 10 minutes. Indicators seperti Bollinger Bands untuk identify overbought/oversold, Stochastic untuk momentum confirmation, dan Level 2 data untuk gauge supply/demand dynamics. Risk management crucial dengan tight stops usually 5-10 pips dan targets 10-20 pips maintaining positive risk-reward. Requires significant time commitment dan constant market monitoring, not suitable untuk traders dengan full-time jobs or limited screen time availability.',
      category: 'education' as const
    },
    {
      title: 'Promo Ramadan: Bonus Spesial dan Cashback',
      excerpt: 'Special celebration untuk holy month of Ramadan dengan exclusive promo package designed untuk Muslim traders. Islamic account option available dengan zero swap overnight charges, fully compliant dengan Shariah principles. Bonus deposit 30% untuk all deposits made during Ramadan period dengan streamlined withdrawal conditions. Daily cashback dikreditkan before Iftar time supaya bisa langsung used atau withdrawn untuk family needs. Charity contribution matching program dimana platform donate equivalent amount dari portion of trading commissions ke trusted humanitarian organizations. Extended customer support hours accommodating Sahur dan Iftar schedules dengan native Arabic-speaking agents. Educational webinar series tentang halal trading practices dan ethical investing dalam Islamic finance. Community Iftar virtual events untuk network dengan fellow Muslim traders globally. Promotion celebrating diversity dan inclusivity dalam trading community kami.',
      category: 'promotion' as const
    },
    {
      title: 'Market Alert: Volatilitas Tinggi di Pasar Global',
      excerpt: 'Significant spike dalam market volatility across all asset classes triggered by confluence of risk factors converging simultaneously. VIX index surging above 30 indicating heightened fear dan uncertainty among investors. Geopolitical tensions escalating dengan potential implications untuk global trade flows dan supply chains. Central bank policies diverging create currency volatility dengan sharp swings dalam exchange rates. Corporate earnings season delivering mixed results causing individual stock whipsaws. Technical analysis showing breakdown dari key support levels suggesting potential continuation dari selling pressure. Risk-off sentiment dominating dengan safe haven assets like gold, yen, dan Swiss franc attracting flows. Trading strategies should adjust dengan wider stops, smaller position sizes, dan preference untuk range-bound approaches versus trend following. Avoid over-leveraging atau taking unnecessary risks during periods seperti ini - capital preservation priority over aggressive profit seeking.',
      category: 'market' as const
    },
    {
      title: 'Update Platform: Dark Mode dan UI Improvements',
      excerpt: 'Major platform update featuring highly-requested dark mode option untuk reduce eye strain during extended trading sessions especially night trading. Toggle seamlessly between light dan dark themes dengan all charts, tables, dan UI elements automatically adjusting. Color scheme carefully designed untuk maintain optimal contrast dan readability across different lighting conditions. Additional UI improvements include customizable dashboard layouts dengan drag-and-drop widgets, resizable chart windows untuk multi-monitor setups, dan quick-access toolbar untuk frequently used functions. Performance optimizations reduce page load times by 40% dan eliminate lag during rapid chart scrolling or indicator calculations. Mobile responsive design ensures consistent experience across desktop, tablet, dan smartphone devices. Accessibility features enhanced dengan keyboard shortcuts untuk all major functions dan screen reader compatibility untuk visually impaired users. Update deployed gradually via rolling release untuk ensure stability.',
      category: 'update' as const
    },
    {
      title: 'Tips Psikologi Trading: Mengatasi Fear dan Greed',
      excerpt: 'Psychological aspects sering lebih important than technical skills dalam determining long-term trading success atau failure. Fear manifests dalam missing profitable opportunities karena hesitation atau cutting winners too early from anxiety tentang giving back profits. Greed causes overleveraging, holding losers too long hoping for reversal, atau jumping into trades without proper analysis from FOMO. Solutions include developing robust trading plan dan stick to it mechanically regardless emotions, using position sizing yang comfortable sehingga drawdowns tidak cause sleepless nights. Meditation dan mindfulness practices proven effective untuk maintain emotional equilibrium dan make rational decisions under pressure. Trading journal documenting emotional state during each trade helps identify patterns dan triggers untuk better self-awareness. Taking regular breaks dari screens prevents mental fatigue yang leads to poor judgment. Remember trading adalah marathon bukan sprint - consistency trumps occasional home runs.',
      category: 'education' as const
    },
    {
      title: 'Promo CNY: Angpao Trading hingga $888',
      excerpt: 'Chinese New Year celebration dengan tradisi angpao dalam bentuk trading bonuses dan lucky draw prizes. Mystery angpao rewards ranging dari $8 hingga $888 dikreditkan random ke active traders based on trading volume tiers. Higher volume increases probability untuk receive bigger angpao amounts - element of luck combined dengan activity. Special lucky numbers campaign dimana trades closed dengan profit containing digits 8 atau 9 receive bonus multipliers. Limited edition gold coin collectibles untuk top traders sebagai symbol of prosperity dan success. Exclusive CNY-themed merchandise giveaway including branded jackets, premium tea sets, dan decorative items. Community events including virtual lion dance performance dan feng shui consultation sessions untuk arrange optimal trading desk setup. Prosperity predictions dari expert astrologers regarding favorable trading periods based on Chinese zodiac. Promotion embracing cultural diversity dan creating festive atmosphere for Asian trading community.',
      category: 'promotion' as const
    },
    {
      title: 'Analysis: Sektor Saham yang Prospektif 2024',
      excerpt: 'Fundamental analysis mengidentifikasi several sectors positioned untuk outperformance based on macro trends dan earnings growth trajectories. Technology sector especially AI-related companies benefit dari massive capital investment dan rapid adoption across industries. Healthcare particularly biotech firms developing innovative therapies addressing unmet medical needs dengan large addressable markets. Renewable energy companies riding secular transition from fossil fuels supported by government incentives dan corporate sustainability commitments. Financial sector could benefit if interest rates stabilize dengan net interest margins improving dari higher rates environment. Consumer discretionary selective opportunities dalam companies adapting to e-commerce shifts dan changing demographics. Avoid sectors facing structural headwinds seperti traditional retail struggling with online competition atau fossil fuel dependence facing regulatory pressures. Valuation considerations important - growth stocks attractive tapi not at any price, value opportunities exist dalam quality companies temporarily out of favor.',
      category: 'market' as const
    },
    {
      title: 'Pengumuman: Penambahan Metode Deposit Baru',
      excerpt: 'Continuous improvement dalam payment processing infrastructure dengan addition of multiple new deposit methods untuk convenience maksimal. E-wallet options expanded termasuk PayPal, Skrill, Neteller, dan regional favorites seperti GoPay, OVO, DANA untuk Indonesian traders. Cryptocurrency deposits now supported dengan Bitcoin, Ethereum, USDT, dan stablecoins - instant crediting dan zero processing fees. Local bank transfer available untuk 20+ countries dengan real-time processing during business hours. Credit/debit card acceptance expanded supporting Visa, Mastercard, dan UnionPay dengan 3D Secure authentication. Minimum deposit lowered to $10 untuk accommodate traders starting dengan smaller capital. Maximum deposit limits increased untuk institutional dan high-net-worth clients requiring large fund transfers. All methods featuring industry-standard encryption dan compliance dengan international payment security standards. Withdrawal using same methods equally streamlined dengan average processing time under 24 hours for verified accounts.',
      category: 'announcement' as const
    },
    {
      title: 'Educational: Fundamental Analysis untuk Saham',
      excerpt: 'Comprehensive guide untuk evaluate intrinsic value dari stocks menggunakan fundamental analysis techniques employed by professional investors. Financial statement analysis examining income statements, balance sheets, dan cash flow statements untuk assess company health. Key metrics include P/E ratio untuk valuation, ROE untuk profitability, debt-to-equity untuk leverage, dan free cash flow untuk sustainability. Qualitative factors equally important: competitive advantages atau moats, management quality dan track record, industry position, dan growth prospects. Economic moat analysis identifying sustainable competitive advantages seperti brand power, network effects, atau cost leadership. Valuation models termasuk DCF untuk calculate intrinsic value, relative valuation comparing peer multiples, dan sum-of-parts untuk conglomerates. Catalyst identification yang could unlock value - upcoming product launches, regulatory approvals, atau corporate actions. Integration dengan technical analysis untuk optimal entry timing after fundamental conviction established.',
      category: 'education' as const
    },
    {
      title: 'Promo Independence Day: Special Bonus',
      excerpt: 'Patriotic celebration dengan special independence day promotion honoring national pride dan freedom. Trading fee discounts 45% representing independence year, substantial savings accumulating quickly untuk active traders. Deposit bonus 17% reflecting independence date dengan instant credit available for immediate trading. Competition dengan prizes totaling amount matching independence year dalam thousands, distribusi across multiple winners. National pride showcase featuring top traders from country dalam special leaderboard dengan recognition dan rewards. Cultural performances dan historical documentary screenings dalam community events educating about significance of independence. Charity initiative supporting veterans dan freedom fighters families dengan portion of trading commissions donated ke recognized foundations. Limited merchandise featuring national symbols dan colors exclusively untuk participants. Community building through shared cultural heritage creating bonds beyond trading. Celebration remembering sacrifices while looking forward to prosperous future through financial markets participation.',
      category: 'promotion' as const
    },
    {
      title: 'Market Review: Kinerja Portfolio Bulan Lalu',
      excerpt: 'Comprehensive performance analysis dari previous month trading activities providing insights untuk improve future results. Asset class performance varied dengan equities up 3.2%, commodities down 1.5%, forex mixed, dan crypto volatile dengan net flat. Best performers included tech stocks rallying 8%, gold gaining 4%, dan certain currency pairs appreciating 2-3%. Worst performers were energy stocks declining 6%, agricultural commodities falling 7%, dan emerging market currencies weakening significantly. Portfolio correlation analysis revealing diversification benefits dengan low correlation mitigating volatility. Drawdown periods identified dengan maximum peak-to-trough decline 8% yang within acceptable risk parameters. Trade statistics showing win rate 58%, average win/loss ratio 1.8:1, dan profit factor 2.1 indicating healthy trading. Areas for improvement identified including cutting losses faster, letting winners run longer, dan reducing overtrading during consolidation periods. Adjustments planned untuk next month based on lessons learned.',
      category: 'market' as const
    },
    {
      title: 'Update: Copy Trading Feature Beta Launch',
      excerpt: 'Innovative copy trading feature entering beta testing phase allowing beginners benefit dari expert trader strategies automatically. Browse detailed profiles dari verified strategy providers featuring historical performance, risk metrics, maximum drawdown, dan trading style descriptions. Transparency complete dengan real-time tracking of every trade including entry price, stop loss, take profit, dan rationale. Flexible allocation allowing copy fixed lot sizes, percentage dari equity, atau custom proportions based on personal risk tolerance. Filter system untuk find strategy providers matching criteria seperti profit target, maximum drawdown acceptable, preferred instruments, dan trading frequency. Performance fees structured fairly dengan success fees charged only on profits generated, aligned incentives between providers dan followers. Social features enabling interaction dengan strategy providers, asking questions, dan learning from their analysis. Risk management controls including maximum daily loss limits dan ability pause copying temporarily. Beta participants receive special bonuses dan lifetime discount on subscription fees.',
      category: 'update' as const
    }
  ]

  const categories: NewsCategory[] = ['announcement', 'update', 'promotion', 'education', 'market']
  
  return articles.map((article, i) => {
    const daysAgo = Math.floor(i / 2)
    const isFeatured = i < 4
    
    return {
      id: `news-${i + 1}`,
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      date: generateDynamicDate(daysAgo),
      featured: isFeatured,
      badge: article.badge
    }
  })
}

export default function NewsPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const ITEMS_PER_PAGE = 5

  const allNews = useMemo(() => generateNewsData(), [])

  const filteredNews = allNews.filter(news => {
    const matchesCategory = selectedCategory === 'all' || news.category === selectedCategory
    const matchesSearch = news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         news.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentNews = filteredNews.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCategoryChange = (category: NewsCategory) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const getCategoryColor = (category: NewsCategory) => {
    switch (category) {
      case 'announcement': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'update': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'promotion': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'education': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'market': return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getCategoryIcon = (category: NewsCategory) => {
    switch (category) {
      case 'announcement': return <AlertCircle className="w-3 h-3" />
      case 'update': return <Zap className="w-3 h-3" />
      case 'promotion': return <Award className="w-3 h-3" />
      case 'education': return <BookOpen className="w-3 h-3" />
      case 'market': return <TrendingUp className="w-3 h-3" />
      default: return <Newspaper className="w-3 h-3" />
    }
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">News & Updates</h1>
              <p className="text-xs text-gray-500">Latest trading news and market insights</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
            {[
              { value: 'all' as const, label: 'All News' },
              { value: 'announcement' as const, label: 'Announcement' },
              { value: 'update' as const, label: 'Updates' },
              { value: 'promotion' as const, label: 'Promotions' },
              { value: 'education' as const, label: 'Education' },
              { value: 'market' as const, label: 'Market' },
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {currentNews.map((news) => (
            <div
              key={news.id}
              className={`bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer relative ${
                news.featured ? 'border-2 border-blue-200' : 'border border-gray-200'
              }`}
            >
              {news.badge && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded-md text-xs font-bold shadow-lg z-20">
                  {news.badge}
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getCategoryColor(news.category)}`}>
                    {getCategoryIcon(news.category)}
                    {news.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {news.date}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {news.title}
                </h3>
                
                <p className="text-sm text-gray-600 leading-relaxed">
                  {news.excerpt}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredNews.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No News Found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? `No results found for "${searchQuery}"`
                : 'Try changing your filters to see more news'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {filteredNews.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border transition-colors ${
                currentPage === 1
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page as number)}
                    className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border transition-colors ${
                currentPage === totalPages
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 md:p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Stay Updated</h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Jangan lewatkan update terbaru! Subscribe newsletter kami dan dapatkan berita langsung ke email Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}