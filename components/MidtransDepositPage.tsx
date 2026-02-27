// components/MidtransDepositPage.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const B_COM_URL = process.env.NEXT_PUBLIC_B_COM_URL || '';
import {
  ArrowLeft, CreditCard, Wallet, WarningCircle, CheckCircle,
  Clock, X, SpinnerGap, Tag,
  ClockCounterClockwise, Info, ArrowsClockwise, Plus,
  Money, Gift, List
} from 'phosphor-react';
import {
  ChevronRight, RefreshCw, History, ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import VoucherInput from '@/components/VoucherInput';
import AvailableVouchers from '@/components/AvailableVouchers';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DepositResponse {
  success: boolean;
  data: {
    message: string;
    deposit: {
      id: string;
      order_id: string;
      amount: number;
      status: 'pending' | 'success' | 'failed' | 'expired';
      snap_token: string;
      snap_redirect_url: string;
      voucherCode?: string;
      voucherBonusAmount?: number;
    };
  };
}

interface TransactionHistory {
  id: string;
  order_id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'expired';
  payment_type?: string;
  description?: string;
  voucherCode?: string;
  voucherBonusAmount?: number;
  createdAt: string;
  completedAt?: string;
}

interface Voucher {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minDeposit: number;
  maxBonusAmount?: number;
  eligibleStatuses: string[];
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  description: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────
class PaymentAPI {
  private static baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  private static getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  static async createTransaction(amount: number, description?: string, voucherCode?: string): Promise<DepositResponse> {
    const response = await fetch(`${this.baseURL}/payment/deposit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amount, description, voucherCode })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal membuat transaksi, silahkan lengkapi terlebih dahulu profil Anda dengan data yang valid.');
    }
    return response.json();
  }

  static async getTransactionHistory(): Promise<TransactionHistory[]> {
    const response = await fetch(`${this.baseURL}/payment/deposits`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Gagal mengambil riwayat transaksi');
    const data = await response.json();
    return data.data?.deposits || data.deposits || [];
  }

  static async checkTransactionStatus(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/payment/deposit/${orderId}/status`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Gagal memeriksa status transaksi');
    return response.json();
  }

  static async getAvailableVouchers(): Promise<Voucher[]> {
    const response = await fetch(`${this.baseURL}/vouchers?isActive=true&page=1&limit=50`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Gagal mengambil daftar voucher');
    const data = await response.json();
    let vouchers: Voucher[] = [];
    if (data?.data?.data?.vouchers) vouchers = data.data.data.vouchers;
    else if (data?.data?.vouchers) vouchers = data.data.vouchers;
    else if (data?.vouchers) vouchers = data.vouchers;
    return vouchers;
  }

  static async getRealBalance(): Promise<number> {
    const response = await fetch(`${this.baseURL}/balance/real`, {
      method: 'GET',
      headers: this.getHeaders(),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Gagal mengambil saldo');
    const data = await response.json();
    let balance = 0;
    if (data.balance !== undefined) balance = data.balance;
    else if (data.data?.balance !== undefined) balance = data.data.balance;
    else if (data.data?.data?.balance !== undefined) balance = data.data.data.balance;
    return balance;
  }
}

// ─── Animation Variants ───────────────────────────────────────────────────────
const SPRING = { type: 'spring', stiffness: 80, damping: 20 } as const;

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING } },
};
const slideIn: Variants = {
  hidden: { x: -15, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.25 } },
};
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: { opacity: 1, scale: 1, transition: { ...SPRING } },
};
const stagger = (delay = 0.07): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.03 } },
});

function Reveal({ children, variants = fadeUp, delay = 0, className = '' }: {
  children: React.ReactNode; variants?: Variants; delay?: number; className?: string;
}) {
  return (
    <motion.div className={className} variants={variants} initial="hidden"
      whileInView="visible" viewport={{ once: true, margin: '-60px' }}
      transition={{ delay }}>
      {children}
    </motion.div>
  );
}

function AnimatedHeadline({ text, className }: { text: string; className?: string }) {
  const staggerWords: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } },
  };
  return (
    <motion.h1 className={className} variants={staggerWords} initial="hidden" animate="visible">
      {text.split(' ').map((word, i) => (
        <motion.span key={i} className="inline-block mr-[0.25em]"
          variants={{ hidden: { opacity: 0, y: 22, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...SPRING } } }}>
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
}

// ─── Global Styles ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style jsx global>{`
    .bg-pattern-grid {
      background-color: #f5f6f8;
      background-image:
        linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
      background-size: 40px 40px;
    }
  `}</style>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const TransactionStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    success: { bg: 'bg-green-100', text: 'text-green-700', label: 'Berhasil' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Menunggu' },
    failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Gagal' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Kedaluwarsa' },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MidtransPaymentPage: React.FC = () => {
  const [step, setStep] = useState<'amount' | 'payment' | 'success' | 'history'>('amount');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState<DepositResponse['data']['deposit'] | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);

  const [voucherCode, setVoucherCode] = useState('');
  const [voucherBonus, setVoucherBonus] = useState(0);
  const [voucherType, setVoucherType] = useState<'percentage' | 'fixed' | null>(null);
  const [voucherValue, setVoucherValue] = useState(0);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [externalVoucherCode, setExternalVoucherCode] = useState('');

  const [paymentStatus, setPaymentStatus] = useState<'verifying' | 'success' | 'expired'>('verifying');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [verificationStartTime, setVerificationStartTime] = useState<number>(0);

  const [isMonitoringBalance, setIsMonitoringBalance] = useState(false);
  const [lastBalanceCheck, setLastBalanceCheck] = useState<number>(0);

  const quickAmounts = [
    { value: 100000, label: '100K' },
    { value: 200000, label: '200K' },
    { value: 500000, label: '500K' },
    { value: 1000000, label: '1000K' },
    { value: 4000000, label: '4000K' },
    { value: 8000000, label: '8000K' }
  ];

  const paymentMethods = [
    { name: 'Permata', icon: '/permata.webp', category: 'bank' },
    { name: 'BRI', icon: '/bri.webp', category: 'bank' },
    { name: 'Mandiri', icon: '/mandiri.webp', category: 'bank' },
    { name: 'GoPay', icon: '/gopay.webp', category: 'ewallet' },
    { name: 'cimb', icon: '/cimb.webp', category: 'bank' },
    { name: 'BNI', icon: '/bni.webp', category: 'bank' },
    { name: 'BSI', icon: '/bsi.webp', category: 'bank' },
    { name: 'QRIS', icon: '/qris1.png', category: 'qris' },
  ];

  const numericAmount = parseInt(amount) || 0;
  const totalAmount = numericAmount + voucherBonus;

  useEffect(() => {
    loadTransactionHistory();
    loadAvailableVouchers();
    loadInitialBalance();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const returnStatus = params.get('status');
      const returnOrderId = params.get('orderId');

      if (returnStatus && returnOrderId) {
        const savedTx = sessionStorage.getItem('pending_transaction');
        if (savedTx) {
          const txData = JSON.parse(savedTx);
          setCurrentTransaction(txData);
          setVoucherBonus(txData.voucherBonusAmount || 0);
          setVoucherCode(txData.voucherCode || '');
          sessionStorage.removeItem('pending_transaction');
        }
        if (returnStatus === 'success' || returnStatus === 'pending') {
          setStep('success');
          setPaymentStatus('verifying');
          setVerificationStartTime(Date.now());
          setIsMonitoringBalance(true);
        } else if (returnStatus === 'closed' || returnStatus === 'error') {
          setError('Pembayaran dibatalkan atau gagal. Silakan coba lagi.');
        }
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (paymentStatus === 'success' && (!currentBalance || currentBalance === 0)) {
      let retryCount = 0;
      const maxRetries = 5;
      const tryRefreshBalance = async () => {
        try {
          retryCount++;
          const freshBalance = await PaymentAPI.getRealBalance();
          if (freshBalance > 0) { setCurrentBalance(freshBalance); return true; }
          return false;
        } catch { return false; }
      };
      tryRefreshBalance().then(success => {
        if (success) return;
        const intervalId = setInterval(async () => {
          if (retryCount >= maxRetries) { clearInterval(intervalId); return; }
          const ok = await tryRefreshBalance();
          if (ok) clearInterval(intervalId);
        }, 2000);
        return () => clearInterval(intervalId);
      });
    }
  }, [paymentStatus, currentBalance]);

  useEffect(() => {
    if (externalVoucherCode && availableVouchers.length > 0) {
      const selected = availableVouchers.find(v => v.code === externalVoucherCode);
      if (selected && numericAmount >= selected.minDeposit) {
        let bonus = selected.type === 'percentage'
          ? Math.min(Math.floor(numericAmount * (selected.value / 100)), selected.maxBonusAmount || Infinity)
          : selected.value;
        setVoucherCode(selected.code);
        setVoucherBonus(bonus);
        setVoucherType(selected.type);
        setVoucherValue(selected.value);
      }
    } else if (!externalVoucherCode) {
      setVoucherCode(''); setVoucherBonus(0); setVoucherType(null); setVoucherValue(0);
    }
  }, [externalVoucherCode, numericAmount, availableVouchers]);

  const loadInitialBalance = async () => {
    try {
      const balance = await PaymentAPI.getRealBalance();
      setInitialBalance(balance); setCurrentBalance(balance);
    } catch (error) { console.error('Gagal memuat saldo awal:', error); }
  };

  useEffect(() => {
    const shouldMonitor = (step === 'success' && paymentStatus === 'verifying') || isMonitoringBalance;
    if (!shouldMonitor || !currentTransaction) return;

    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const checkPaymentStatus = async () => {
      try {
        const history = await PaymentAPI.getTransactionHistory();
        setTransactionHistory(history);
        const balance = await PaymentAPI.getRealBalance();
        setCurrentBalance(balance);
        setLastBalanceCheck(Date.now());
        const transaction = history.find(t => t.order_id === currentTransaction.order_id);
        if (transaction?.status === 'success') {
          if (transaction.voucherBonusAmount) setVoucherBonus(transaction.voucherBonusAmount);
          setPaymentStatus('success');
          setIsMonitoringBalance(false);
          clearInterval(intervalId); clearTimeout(timeoutId);
          setTimeout(async () => { try { setCurrentBalance(await PaymentAPI.getRealBalance()); } catch {} }, 1000);
          setTimeout(async () => { try { setCurrentBalance(await PaymentAPI.getRealBalance()); } catch {} }, 3000);
          await loadTransactionHistory();
        } else if (transaction?.status === 'failed') {
          setPaymentStatus('expired');
          setIsMonitoringBalance(false);
          clearInterval(intervalId); clearTimeout(timeoutId);
        }
      } catch (error) { console.error('❌ Gagal memeriksa status pembayaran:', error); }
    };

    checkPaymentStatus();
    intervalId = setInterval(checkPaymentStatus, 2000);
    timeoutId = setTimeout(() => {
      setPaymentStatus('expired');
      setIsMonitoringBalance(false);
      clearInterval(intervalId);
    }, 10 * 60 * 1000);

    return () => { clearInterval(intervalId); clearTimeout(timeoutId); };
  }, [step, paymentStatus, initialBalance, currentTransaction, voucherBonus, isMonitoringBalance]);

  const loadTransactionHistory = async () => {
    try { setTransactionHistory(await PaymentAPI.getTransactionHistory()); }
    catch (err) { console.error('Gagal memuat riwayat transaksi:', err); }
  };

  const loadAvailableVouchers = async () => {
    try { setAvailableVouchers(await PaymentAPI.getAvailableVouchers()); }
    catch (err) { console.error('Gagal memuat voucher:', err); }
  };

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatDate = (dateString: string): string =>
    new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));

  const handleVoucherApplied = (voucher: { code: string; bonusAmount: number; type: 'percentage' | 'fixed'; value: number } | null) => {
    if (voucher) {
      setVoucherCode(voucher.code); setVoucherBonus(voucher.bonusAmount);
      setVoucherType(voucher.type); setVoucherValue(voucher.value);
    } else {
      setVoucherCode(''); setVoucherBonus(0); setVoucherType(null);
      setVoucherValue(0); setExternalVoucherCode('');
    }
  };

  const handleVoucherSelect = (code: string) => setExternalVoucherCode(code);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value.replace(/\D/g, ''));
    setError('');
  };

  const handleQuickAmount = (value: number) => { setAmount(value.toString()); setError(''); };

  const handleRefreshBalance = async () => {
    if (loading) return;
    setLoading(true);
    try { setCurrentBalance(await PaymentAPI.getRealBalance()); }
    catch (error) { console.error('❌ Gagal menyegarkan saldo:', error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    const depositAmount = parseInt(amount);
    if (isNaN(depositAmount) || depositAmount < 100000) { setError('Minimal pembayaran adalah Rp 100.000'); return; }
    if (depositAmount > 10000000) { setError('Maksimal pembayaran adalah Rp 10.000.000'); return; }

    setLoading(true);
    setError('');
    try {
      const response = await PaymentAPI.createTransaction(depositAmount, 'Deposit via Midtrans', voucherCode || undefined);
      const deposit = response.data.deposit;
      const confirmedBonus = deposit.voucherBonusAmount || voucherBonus;
      if (confirmedBonus > 0) setVoucherBonus(confirmedBonus);
      setCurrentTransaction(deposit);
      setStep('payment');

      sessionStorage.setItem('pending_transaction', JSON.stringify({
        ...deposit,
        voucherBonusAmount: confirmedBonus,
        voucherCode: voucherCode || deposit.voucherCode || '',
      }));

      const params = new URLSearchParams({ token: deposit.snap_token, orderId: deposit.order_id });
      const redirectUrl = `${B_COM_URL}/payment?${params.toString()}`;
      await new Promise(resolve => setTimeout(resolve, 800));
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message || 'Pembayaran gagal. Silakan coba lagi.');
      setStep('amount');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    setStep('amount'); setAmount(''); setVoucherCode(''); setVoucherBonus(0);
    setVoucherType(null); setVoucherValue(0); setExternalVoucherCode('');
    setCurrentTransaction(null); setPaymentStatus('verifying'); setError('');
    loadInitialBalance();
  };

  const handleViewHistory = () => { setStep('history'); loadTransactionHistory(); };

  // ── History Step ──────────────────────────────────────────────────────────
  if (step === 'history') {
    return (
      <>
        <GlobalStyles />
        <div className="min-h-screen bg-pattern-grid py-8 px-4">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <motion.div
              className="mb-8 flex items-center justify-between"
              initial="hidden" animate="visible" variants={stagger(0.1)}
            >
              <motion.div variants={slideIn} className="flex items-center gap-3">
                <motion.button
                  onClick={() => setStep('amount')}
                  className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft size={18} weight="bold" className="text-gray-600" />
                </motion.button>
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-14 h-14 flex items-center justify-center"
                    whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}
                  >
                    <Image src="/dompet.png" alt="Dompet" width={56} height={56} className="w-14 h-14 object-contain" />
                  </motion.div>
                  <div>
                    <AnimatedHeadline text="Riwayat Transaksi" className="text-2xl font-bold text-gray-900" />
                    <motion.p className="text-gray-500 text-sm mt-0.5" variants={fadeUp}>
                      {transactionHistory.length} transaksi tercatat
                    </motion.p>
                  </div>
                </div>
              </motion.div>


            </motion.div>

            {/* History list */}
            <Reveal>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {transactionHistory.length === 0 ? (
                  <motion.div className="text-center py-16 px-4" variants={fadeIn} initial="hidden" animate="visible">
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <ClockCounterClockwise size={40} weight="light" className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada transaksi</h3>
                    <p className="text-gray-500 mb-6">Riwayat Top Up Anda akan muncul di sini</p>
                    <motion.button
                      onClick={() => setStep('amount')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md"
                      whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(14,165,233,0.3)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Wallet size={20} weight="bold" />
                      Lakukan Top Up
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div className="divide-y divide-gray-100" variants={staggerContainer} initial="hidden" animate="visible">
                    {transactionHistory.map((transaction) => (
                      <motion.div
                        key={transaction.id}
                        className="p-5 hover:bg-gray-50 transition-colors"
                        variants={slideIn}
                        whileHover={{ x: 2 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              {(() => {
                                const pt = (transaction.payment_type || '').toLowerCase()
                                const paymentImg =
                                  pt.includes('dana')    ? '/dana.png' :
                                  pt.includes('gopay')   ? '/gopay.webp' :
                                  pt.includes('permata') ? '/permata.webp' :
                                  pt.includes('bri')     ? '/bri.webp' :
                                  pt.includes('mandiri') ? '/mandiri.webp' :
                                  pt.includes('cimb')    ? '/cimb.webp' :
                                  pt.includes('bni')     ? '/bni.webp' :
                                  pt.includes('bsi')     ? '/bsi.webp' :
                                  pt.includes('qris')    ? '/qris1.png' :
                                  null
                                if (paymentImg) {
                                  return (
                                    <div className="w-9 h-9 bg-white border border-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                      <Image src={paymentImg} alt={transaction.payment_type || ''} width={36} height={36} className="w-full h-full object-contain p-0.5" />
                                    </div>
                                  )
                                }
                                return (
                                  <div className="w-9 h-9 bg-white border border-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    <Image src="/pembayaran.png" alt="pembayaran" width={36} height={36} className="w-full h-full object-contain p-0.5" />
                                  </div>
                                )
                              })()}
                              <div>
                                <h3 className="font-bold text-gray-900 text-base">{formatCurrency(transaction.amount)}</h3>
                                <TransactionStatusBadge status={transaction.status} />
                              </div>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600 ml-12">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">ID:</span>
                                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{transaction.order_id}</code>
                              </div>
                              {transaction.payment_type && (
                                <div className="flex items-center gap-1.5">
                                  <CreditCard size={14} weight="regular" className="text-gray-400" />
                                  <span className="text-xs capitalize">{transaction.payment_type.replace('_', ' ')}</span>
                                </div>
                              )}
                              {transaction.voucherCode && (
                                <div className="flex items-center gap-2 text-green-700">
                                  <Tag size={14} weight="bold" />
                                  <span className="text-xs font-medium">{transaction.voucherCode}</span>
                                  {transaction.voucherBonusAmount && (
                                    <span className="text-xs bg-green-100 px-1.5 py-0.5 rounded font-medium">
                                      +{formatCurrency(transaction.voucherBonusAmount)} bonus
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</div>
                            {transaction.completedAt && (
                              <div className="text-xs text-gray-400 mt-0.5">Selesai: {formatDate(transaction.completedAt)}</div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </Reveal>
          </motion.div>
        </div>
      </>
    );
  }

  // ── Amount Step ───────────────────────────────────────────────────────────
  if (step === 'amount') {
    return (
      <>
        <GlobalStyles />
        <div className="min-h-screen bg-pattern-grid">
          <motion.div
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <motion.div
              className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              initial="hidden" animate="visible" variants={stagger(0.1)}
            >
              <motion.div variants={slideIn}>
                <motion.div className="flex items-center gap-2 text-xs text-gray-500 mb-1" variants={fadeUp}>
                  <span>Dasbor</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-gray-900 font-medium">Top Up Saldo</span>
                </motion.div>
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-14 h-14 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}
                  >
                    <Image src="/pembayaran.png" alt="Pembayaran" width={56} height={56} className="w-14 h-14 object-contain" />
                  </motion.div>
                  <div>
                    <AnimatedHeadline text="Top Up Saldo" className="text-2xl sm:text-3xl font-bold text-gray-900" />
                    <motion.p className="text-gray-500 text-sm mt-0.5" variants={fadeUp}>
                      Pilih jumlah dan metode pembayaran Anda
                    </motion.p>
                  </div>
                </div>
              </motion.div>

              <motion.button
                variants={scaleIn}
                onClick={handleViewHistory}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                whileHover={{ scale: 1.04, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                whileTap={{ scale: 0.96 }}
              >
                <History className="w-4 h-4 text-gray-500" />
                Riwayat
              </motion.button>
            </motion.div>

            {/* Body grid */}
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Left column */}
              <div className="space-y-5">
                {/* Amount card */}
                <Reveal>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Jumlah Top Up</p>
                    <div className="relative mb-4">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">Rp</span>
                      <input
                        type="text"
                        value={amount ? parseInt(amount).toLocaleString('id-ID') : ''}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Quick amounts */}
                    <motion.div
                      className="grid grid-cols-3 gap-2 sm:gap-3 mb-4"
                      variants={staggerContainer} initial="hidden" animate="visible"
                    >
                      {quickAmounts.map((preset) => (
                        <motion.button
                          key={preset.value}
                          onClick={() => handleQuickAmount(preset.value)}
                          className={`py-3 px-3 rounded-lg border-2 font-semibold transition-all text-sm ${
                            parseInt(amount) === preset.value
                              ? 'border-sky-500 bg-sky-50 text-sky-700'
                              : 'border-gray-200 hover:border-sky-300 hover:bg-sky-50 text-gray-700'
                          }`}
                          variants={fadeUp}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        >
                          {preset.label}
                        </motion.button>
                      ))}
                    </motion.div>

                    <p className="text-xs text-gray-500 text-center">Minimal: Rp 100.000 • Maksimal: Rp 10.000.000</p>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        >
                          <WarningCircle size={20} weight="bold" className="text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700 font-medium">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>

                {/* Voucher card */}
                <Reveal delay={0.08}>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                    <VoucherInput
                      depositAmount={numericAmount}
                      onVoucherApplied={handleVoucherApplied}
                      disabled={loading || numericAmount < 10000}
                      externalCode={externalVoucherCode}
                    />
                    <AvailableVouchers
                      vouchers={availableVouchers}
                      depositAmount={numericAmount}
                      onVoucherSelect={handleVoucherSelect}
                      selectedVoucherCode={voucherCode}
                    />
                  </div>
                </Reveal>

                {/* CTA */}
                <Reveal delay={0.12}>
                  <motion.button
                    onClick={handleSubmit}
                    disabled={loading || !amount || parseInt(amount) < 10000}
                    className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-sky-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
                    whileHover={!loading && amount && parseInt(amount) >= 10000 ? { scale: 1.01, boxShadow: '0 8px 25px rgba(14,165,233,0.35)' } : undefined}
                    whileTap={!loading && amount && parseInt(amount) >= 10000 ? { scale: 0.99 } : undefined}
                  >
                    {loading ? (
                      <>
                        <SpinnerGap size={20} weight="bold" className="animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CreditCard size={20} weight="bold" />
                        Lanjut ke Pembayaran
                      </>
                    )}
                  </motion.button>
                </Reveal>
              </div>

              {/* Right column — Summary */}
              <div className="lg:sticky lg:top-8 h-fit">
                <Reveal>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* Card header */}
                    <div className="bg-gradient-to-r from-sky-50 to-indigo-50 px-5 py-4 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-700">Ringkasan Pembayaran</p>
                    </div>

                    <div className="p-5">
                      {numericAmount >= 10000 ? (
                        <>
                          <motion.div className="space-y-4 mb-6" variants={staggerContainer} initial="hidden" animate="visible">
                            <motion.div className="flex justify-between items-center" variants={fadeUp}>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                                  <Money size={16} weight="bold" className="text-sky-600" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">Jumlah Top Up</span>
                              </div>
                              <span className="font-bold text-gray-900">{formatCurrency(numericAmount)}</span>
                            </motion.div>

                            <AnimatePresence>
                              {voucherBonus > 0 && (
                                <motion.div
                                  className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border-2 border-green-200"
                                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                      <Gift size={16} weight="bold" className="text-green-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-green-700">Bonus Voucher</span>
                                  </div>
                                  <span className="font-bold text-green-700">+{formatCurrency(voucherBonus)}</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>

                          <div className="pt-4 border-t-2 border-gray-100 mb-6">
                            <div className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl p-5 border-2 border-sky-200">
                              <div className="text-center">
                                <div className="text-xs text-sky-600 font-semibold mb-2">Anda Akan Menerima</div>
                                <div className="text-3xl font-black bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                                  {formatCurrency(totalAmount)}
                                </div>
                              </div>
                              {voucherBonus > 0 && (
                                <div className="mt-4 pt-3 border-t border-sky-100">
                                  <div className="flex justify-center gap-2 text-xs text-gray-600">
                                    <span>{formatCurrency(numericAmount)}</span>
                                    <Plus size={12} weight="bold" className="text-gray-400" />
                                    <span>{formatCurrency(voucherBonus)}</span>
                                    <span className="text-sky-600 font-semibold">= {formatCurrency(totalAmount)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 mb-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Wallet size={32} weight="light" className="text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500">Masukkan jumlah untuk melihat ringkasan</p>
                          <p className="text-xs text-gray-400 mt-1">Minimal: Rp 100.000</p>
                        </div>
                      )}

                      {/* Security badge */}
                      <div className="pt-5 border-t border-gray-100">
                        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-xl p-4">
                          <div className="flex-shrink-0">
                            <Image src="/pci.png" alt="Payment Secure" width={80} height={80} className="object-contain p-2 rounded-xl" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <h4 className="font-semibold text-gray-900 text-sm">Pembayaran Aman</h4>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              Informasi pembayaran Anda dienkripsi dan aman. Proteksi SSL 2048 bit robust.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment methods */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-gray-700">Metode Pembayaran</p>
                          <List size={14} weight="bold" className="text-gray-400" />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {paymentMethods.map((method, index) => (
                            <motion.div
                              key={index}
                              className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-center hover:border-sky-300 transition-colors"
                              whileHover={{ scale: 1.05 }}
                            >
                              <Image src={method.icon} alt={method.name} width={48} height={32} className="object-contain" />
                            </motion.div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-3 text-center">+ Lebih banyak opsi tersedia</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // ── Payment (redirect) Step ───────────────────────────────────────────────
  if (step === 'payment') {
    return (
      <>
        <GlobalStyles />
        <div className="min-h-screen bg-pattern-grid flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center border border-gray-200"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...SPRING }}
          >
            <div className="w-20 h-20 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <SpinnerGap size={48} weight="bold" className="text-sky-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Mengalihkan ke Pembayaran</h2>
            <p className="text-gray-600 mb-6">Anda akan segera diarahkan ke halaman pembayaran yang aman</p>
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
              <p className="text-sm text-sky-800 font-medium">Mohon jangan tutup atau refresh halaman ini</p>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // ── Success / Verifying Step ──────────────────────────────────────────────
  if (step === 'success') {
    const expectedAmount = currentTransaction?.amount || 0;
    const balanceIncrease = currentBalance - initialBalance;
    const verificationElapsed = verificationStartTime ? (Date.now() - verificationStartTime) / 1000 : 0;
    const remainingTime = Math.max(0, 600 - verificationElapsed);

    return (
      <>
        <GlobalStyles />
        <div className="min-h-screen bg-pattern-grid flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-2xl shadow-lg max-w-md w-full border border-gray-200 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...SPRING }}
          >
            <div className="p-8 sm:p-10">
              <AnimatePresence mode="wait">
                {/* Verifying */}
                {paymentStatus === 'verifying' && (
                  <motion.div
                    key="verifying"
                    className="text-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <SpinnerGap size={48} weight="bold" className="text-amber-600 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Menunggu Pembayaran</h2>
                    <p className="text-gray-600 mb-6">Selesaikan pembayaran dan kami akan mendeteksinya otomatis</p>

                    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border-2 border-sky-200 rounded-xl p-5 mb-5 text-left">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-sky-900">Saldo Saat Ini</span>
                        <button onClick={handleRefreshBalance} disabled={loading}
                          className="p-2 hover:bg-sky-100 rounded-lg transition-all disabled:opacity-50">
                          <ArrowsClockwise size={16} weight="bold" className={`text-sky-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      <div className="text-2xl font-bold text-sky-700 mb-3">{formatCurrency(currentBalance)}</div>
                      {balanceIncrease > 0 && (
                        <div className="bg-white/60 rounded-lg p-3 mb-3">
                          <div className="text-sm text-sky-800 flex items-center justify-between">
                            <span>Kenaikan terdeteksi:</span>
                            <strong className="text-green-700">+{formatCurrency(balanceIncrease)}</strong>
                          </div>
                        </div>
                      )}
                      <div className="space-y-1.5 text-sm text-sky-900">
                        <div className="flex justify-between">
                          <span>Diharapkan:</span>
                          <strong>{formatCurrency(expectedAmount)}</strong>
                        </div>
                        {voucherBonus > 0 && (
                          <div className="flex justify-between text-green-700">
                            <span className="flex items-center gap-1"><Tag size={14} weight="bold" />Bonus:</span>
                            <strong>+{formatCurrency(voucherBonus)}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
                      <div className="flex items-start gap-2">
                        <Info size={18} weight="bold" className="text-amber-700 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-900">
                          <p className="font-semibold mb-1">Belum bayar?</p>
                          <ul className="space-y-0.5 text-xs">
                            <li>• Selesaikan via aplikasi perbankan Anda</li>
                            <li>• Status terupdate otomatis saat pembayaran diterima</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Memeriksa otomatis setiap 2 detik •{' '}
                      Batas waktu: {Math.floor(remainingTime / 60)}:{String(Math.floor(remainingTime % 60)).padStart(2, '0')}
                    </div>
                  </motion.div>
                )}

                {/* Success */}
                {paymentStatus === 'success' && (
                  <motion.div
                    key="success"
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={48} weight="fill" className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
                    <p className="text-gray-600 mb-6">Saldo Anda telah diperbarui</p>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-green-900 font-medium">Saldo Baru</div>
                        <button onClick={handleRefreshBalance} disabled={loading}
                          className="p-1.5 hover:bg-green-100 rounded-lg transition-all disabled:opacity-50">
                          <ArrowsClockwise size={16} weight="bold" className={`text-green-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      <div className="text-3xl font-bold text-green-700 mb-4">
                        {currentBalance > 0 ? formatCurrency(currentBalance) : (
                          <div className="flex items-center justify-center gap-2">
                            <SpinnerGap size={28} weight="bold" className="text-green-600 animate-spin" />
                            <span className="text-xl">Memuat...</span>
                          </div>
                        )}
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 space-y-1.5">
                        <div className="flex justify-between text-sm text-green-800">
                          <span>Ditambahkan:</span>
                          <strong>+{formatCurrency(expectedAmount)}</strong>
                        </div>
                        {voucherBonus > 0 && (
                          <div className="flex justify-between text-sm text-green-800">
                            <span className="flex items-center gap-1"><Tag size={14} weight="bold" />Bonus:</span>
                            <strong>+{formatCurrency(voucherBonus)}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <motion.button
                      onClick={handleBackToHome}
                      className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg"
                      whileHover={{ scale: 1.01, boxShadow: '0 8px 25px rgba(14,165,233,0.35)' }}
                      whileTap={{ scale: 0.99 }}
                    >
                      Selesai
                    </motion.button>
                  </motion.div>
                )}

                {/* Expired */}
                {paymentStatus === 'expired' && (
                  <motion.div
                    key="expired"
                    className="text-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <X size={48} weight="bold" className="text-gray-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Waktu Habis</h2>
                    <p className="text-gray-600 mb-8">Kami tidak dapat mendeteksi pembayaran Anda. Cek riwayat atau coba lagi.</p>
                    <div className="space-y-3">
                      <motion.button
                        onClick={handleViewHistory}
                        className="w-full bg-gray-100 text-gray-800 py-4 px-6 rounded-xl font-bold text-base hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      >
                        <ClockCounterClockwise size={20} weight="bold" />
                        Lihat Riwayat
                      </motion.button>
                      <motion.button
                        onClick={handleBackToHome}
                        className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-base"
                        whileHover={{ scale: 1.01, boxShadow: '0 8px 25px rgba(14,165,233,0.35)' }}
                        whileTap={{ scale: 0.99 }}
                      >
                        Coba Lagi
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return null;
};

export default MidtransPaymentPage;