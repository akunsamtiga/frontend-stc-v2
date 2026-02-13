// components/MidtransDepositPage.tsx
// ✅ VERSI FINAL - Tampilan Bonus Voucher Diperbaiki + Optimasi Mobile & Professional UI
import React, { useState, useEffect } from 'react';
import { 
  // Phosphor Icons
  ArrowLeft, CreditCard, Wallet, WarningCircle, CheckCircle, 
  Clock, X, SpinnerGap, Shield, Tag, TrendUp, 
  ClockCounterClockwise, Info, ArrowsClockwise, Plus, Minus,
  Bank, QrCode, DeviceMobile, CreditCard as CreditCardIcon,
  Money, Gift, Check, XCircle, List
} from 'phosphor-react';
import Image from 'next/image';
import VoucherInput from '@/components/VoucherInput';
import AvailableVouchers from '@/components/AvailableVouchers';

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
      throw new Error(error.message || 'Gagal membuat transaksi');
    }
    return response.json();
  }

  static async getTransactionHistory(): Promise<TransactionHistory[]> {
    const response = await fetch(`${this.baseURL}/payment/deposits`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil riwayat transaksi');
    }
    const data = await response.json();
    return data.data?.deposits || data.deposits || [];
  }

  static async checkTransactionStatus(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/payment/deposit/${orderId}/status`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Gagal memeriksa status transaksi');
    }
    return response.json();
  }

  static async getAvailableVouchers(): Promise<Voucher[]> {
    const response = await fetch(`${this.baseURL}/vouchers?isActive=true&page=1&limit=50`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil daftar voucher');
    }
    const data = await response.json();
    let vouchers: Voucher[] = [];
    if (data?.data?.data?.vouchers) {
      vouchers = data.data.data.vouchers;
    } else if (data?.data?.vouchers) {
      vouchers = data.data.vouchers;
    } else if (data?.vouchers) {
      vouchers = data.vouchers;
    }
    return vouchers;
  }

  static async getRealBalance(): Promise<number> {
    const response = await fetch(`${this.baseURL}/balance/real`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil saldo');
    }
    const data = await response.json();
    return data.balance || 0;
  }
}

class MidtransSnap {
  private static isLoaded = false;

  static loadScript(): Promise<void> {
    if (this.isLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const isSandbox = process.env.NEXT_PUBLIC_MIDTRANS_MODE === 'sandbox';
      script.src = isSandbox
        ? 'https://app.sandbox.midtrans.com/snap/snap.js'
        : 'https://app.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap'));
      document.head.appendChild(script);
    });
  }

  static async pay(snapToken: string): Promise<any> {
    await this.loadScript();
    return new Promise((resolve, reject) => {
      if (!window.snap) {
        reject(new Error('Midtrans Snap belum dimuat'));
        return;
      }

      window.snap.pay(snapToken, {
        onSuccess: (result: any) => {
          resolve({ status: 'success', result });
        },
        onPending: (result: any) => {
          resolve({ status: 'pending', result });
        },
        onError: (result: any) => {
          reject(new Error('Pembayaran gagal'));
        },
        onClose: () => {
          resolve({ status: 'closed' });
        }
      });
    });
  }
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: any) => void;
    };
  }
}

const TransactionStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    success: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Berhasil' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Menunggu' },
    failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Gagal' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-700', icon: WarningCircle, label: 'Kedaluwarsa' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
      <Icon size={16} weight="bold" />
      {config.label}
    </span>
  );
};

const MidtransPaymentPage: React.FC = () => {
  const [step, setStep] = useState<'amount' | 'payment' | 'success' | 'history'>('amount');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState<DepositResponse['data']['deposit'] | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);

  // State voucher
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherBonus, setVoucherBonus] = useState(0);
  const [voucherType, setVoucherType] = useState<'percentage' | 'fixed' | null>(null);
  const [voucherValue, setVoucherValue] = useState(0);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [externalVoucherCode, setExternalVoucherCode] = useState('');

  // State verifikasi pembayaran
  const [paymentStatus, setPaymentStatus] = useState<'verifying' | 'success' | 'expired'>('verifying');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [verificationStartTime, setVerificationStartTime] = useState<number>(0);

  // State pemantauan real-time
  const [isMonitoringBalance, setIsMonitoringBalance] = useState(false);
  const [lastBalanceCheck, setLastBalanceCheck] = useState<number>(0);

  // Preset jumlah cepat - 6 opsi untuk tampilan yang rapi
  const quickAmounts = [
    { value: 100000, label: '100K' },
    { value: 200000, label: '200K' },
    { value: 500000, label: '500K' },
    { value: 1000000, label: '1000K' },
    { value: 4000000, label: '4000K' },
    { value: 8000000, label: '8000K' }
  ];

  // Ikon metode pembayaran
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

  // ✅ PINDAHKAN KE ATAS - Sebelum useEffect
  const numericAmount = parseInt(amount) || 0;
  const totalAmount = numericAmount + voucherBonus;

  useEffect(() => {
    loadTransactionHistory();
    loadAvailableVouchers();
    loadInitialBalance();
  }, []);

  // ✅ PERBAIKAN KRITIS: Penanganan pemilihan voucher eksternal
  useEffect(() => {
    if (externalVoucherCode && availableVouchers.length > 0) {
      // Cari voucher yang dipilih
      const selectedVoucher = availableVouchers.find(
        v => v.code === externalVoucherCode
      );

      if (selectedVoucher && numericAmount >= selectedVoucher.minDeposit) {
        // Hitung bonus
        let bonus = 0;
        if (selectedVoucher.type === 'percentage') {
          bonus = Math.floor(numericAmount * (selectedVoucher.value / 100));
          if (selectedVoucher.maxBonusAmount && bonus > selectedVoucher.maxBonusAmount) {
            bonus = selectedVoucher.maxBonusAmount;
          }
        } else {
          bonus = selectedVoucher.value;
        }

        // Perbarui state
        setVoucherCode(selectedVoucher.code);
        setVoucherBonus(bonus);
        setVoucherType(selectedVoucher.type);
        setVoucherValue(selectedVoucher.value);
        console.log('✅ Voucher eksternal diterapkan:', {
          code: selectedVoucher.code,
          bonus,
          total: numericAmount + bonus
        });
      }
    } else if (!externalVoucherCode) {
      // Hapus voucher jika kode eksternal dikosongkan
      setVoucherCode('');
      setVoucherBonus(0);
      setVoucherType(null);
      setVoucherValue(0);
    }
  }, [externalVoucherCode, numericAmount, availableVouchers]);

  // Muat saldo awal saat komponen dimuat
  const loadInitialBalance = async () => {
    try {
      const balance = await PaymentAPI.getRealBalance();
      setInitialBalance(balance);
      setCurrentBalance(balance);
      console.log('💰 Saldo awal dimuat:', balance);
    } catch (error) {
      console.error('Gagal memuat saldo awal:', error);
    }
  };

  // ✅ DIPERBAIKI: Pemantauan Riwayat Transaksi
  useEffect(() => {
    const shouldMonitor = (step === 'success' && paymentStatus === 'verifying') || isMonitoringBalance;
    if (!shouldMonitor || !currentTransaction) return;

    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    let checkCount = 0;

    const checkPaymentStatus = async () => {
      try {
        checkCount++;
        const history = await PaymentAPI.getTransactionHistory();
        setTransactionHistory(history);
        const balance = await PaymentAPI.getRealBalance();
        setCurrentBalance(balance);
        setLastBalanceCheck(Date.now());

        const depositAmount = currentTransaction?.amount || 0;
        const transaction = history.find(t => t.order_id === currentTransaction.order_id);

        console.log(`🔍 Pemeriksaan #${checkCount}:`, {
          order_id: currentTransaction.order_id,
          found: !!transaction,
          status: transaction?.status,
          depositAmount,
          currentBalance: balance,
          initialBalance
        });

        if (transaction && transaction.status === 'success') {
          console.log('✅ Pembayaran terverifikasi - Status transaksi BERHASIL!');
          console.log(`   Diharapkan: ${depositAmount}, Jumlah transaksi: ${transaction.amount}`);

          if (transaction.voucherBonusAmount && transaction.voucherBonusAmount > 0) {
            setVoucherBonus(transaction.voucherBonusAmount);
            console.log(`   ✅ Bonus voucher diperbarui dari transaksi: ${transaction.voucherBonusAmount}`);
          }

          setPaymentStatus('success');
          setIsMonitoringBalance(false);
          clearInterval(intervalId);
          clearTimeout(timeoutId);

          setTimeout(async () => {
            try {
              const freshBalance = await PaymentAPI.getRealBalance();
              setCurrentBalance(freshBalance);
              console.log('🔄 Penyegaran saldo akhir:', freshBalance);
            } catch (error) {
              console.error('Gagal menyegarkan saldo:', error);
            }
          }, 1000);

          await loadTransactionHistory();
        } else if (transaction && transaction.status === 'failed') {
          console.log('❌ PEMBAYARAN GAGAL - Status transaksi GAGAL');
          setPaymentStatus('expired');
          setIsMonitoringBalance(false);
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        } else {
          console.log(`⏳ Transaksi ${transaction ? `status: ${transaction.status}` : 'belum ditemukan'} - Melanjutkan pemantauan...`);
        }
      } catch (error) {
        console.error('❌ Gagal memeriksa status pembayaran:', error);
      }
    };

    checkPaymentStatus();
    intervalId = setInterval(checkPaymentStatus, 2000);
    timeoutId = setTimeout(() => {
      console.log('⏰ Waktu verifikasi habis - 10 menit berlalu');
      setPaymentStatus('expired');
      setIsMonitoringBalance(false);
      clearInterval(intervalId);
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [step, paymentStatus, initialBalance, currentTransaction, voucherBonus, isMonitoringBalance]);

  const loadTransactionHistory = async () => {
    try {
      const history = await PaymentAPI.getTransactionHistory();
      setTransactionHistory(history);
    } catch (err) {
      console.error('Gagal memuat riwayat transaksi:', err);
    }
  };

  const loadAvailableVouchers = async () => {
    try {
      const vouchers = await PaymentAPI.getAvailableVouchers();
      setAvailableVouchers(vouchers);
    } catch (err) {
      console.error('Gagal memuat voucher:', err);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleVoucherApplied = (voucher: {
    code: string;
    bonusAmount: number;
    type: 'percentage' | 'fixed';
    value: number
  } | null) => {
    if (voucher) {
      setVoucherCode(voucher.code);
      setVoucherBonus(voucher.bonusAmount);
      setVoucherType(voucher.type);
      setVoucherValue(voucher.value);
      console.log('✅ Voucher diterapkan:', voucher);
    } else {
      setVoucherCode('');
      setVoucherBonus(0);
      setVoucherType(null);
      setVoucherValue(0);
      setExternalVoucherCode('');
      console.log('❌ Voucher dihapus');
    }
  };

  const handleVoucherSelect = (code: string) => {
    setExternalVoucherCode(code);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setAmount(value);
    setError('');
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError('');
  };

  const handleRefreshBalance = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const balance = await PaymentAPI.getRealBalance();
      setCurrentBalance(balance);
      console.log('🔄 Saldo disegarkan:', balance);
    } catch (error) {
      console.error('Gagal menyegarkan saldo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const depositAmount = parseInt(amount);
    if (isNaN(depositAmount) || depositAmount < 100000) {
      setError('Minimal deposit adalah Rp 100.000');
      return;
    }

    if (depositAmount > 10000000) {
      setError('Maksimal deposit adalah Rp 10.000.000');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('💳 Membuat transaksi:', {
        amount: depositAmount,
        voucherCode: voucherCode || undefined,
        voucherBonus
      });

      const freshBalance = await PaymentAPI.getRealBalance();
      setInitialBalance(freshBalance);
      setCurrentBalance(freshBalance);
      console.log('💰 Saldo awal diambil sebelum pembayaran:', freshBalance);

      const response = await PaymentAPI.createTransaction(
        depositAmount,
        'Deposit via Midtrans',
        voucherCode || undefined
      );

      console.log('✅ Transaksi dibuat:', response);

      if (!response.data?.deposit?.snap_token) {
        throw new Error('Token snap tidak diterima');
      }

      if (response.data.deposit.voucherBonusAmount && response.data.deposit.voucherBonusAmount > 0) {
        setVoucherBonus(response.data.deposit.voucherBonusAmount);
        console.log('💎 Bonus voucher dikonfirmasi dari backend:', response.data.deposit.voucherBonusAmount);
      }

      setCurrentTransaction(response.data.deposit);
      setStep('payment');

      const paymentResult = await MidtransSnap.pay(response.data.deposit.snap_token);
      console.log('💳 Hasil popup pembayaran:', paymentResult);

      if (paymentResult.status === 'success' || paymentResult.status === 'pending') {
        setStep('success');
        setPaymentStatus('verifying');
        setVerificationStartTime(Date.now());
        setIsMonitoringBalance(true);
      } else if (paymentResult.status === 'closed') {
        setError('Pembayaran dibatalkan');
        setStep('amount');
      }
    } catch (err: any) {
      console.error('❌ Error pembayaran:', err);
      setError(err.message || 'Pembayaran gagal. Silakan coba lagi.');
      setStep('amount');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    setStep('amount');
    setAmount('');
    setVoucherCode('');
    setVoucherBonus(0);
    setVoucherType(null);
    setVoucherValue(0);
    setExternalVoucherCode('');
    setCurrentTransaction(null);
    setPaymentStatus('verifying');
    setError('');
    loadInitialBalance();
  };

  const handleViewHistory = () => {
    setStep('history');
    loadTransactionHistory();
  };

  // Tampilan Riwayat Transaksi
  if (step === 'history') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setStep('amount')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft size={20} weight="bold" className="text-gray-600" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <ClockCounterClockwise size={28} weight="bold" className="text-sky-600" />
                      Riwayat Transaksi
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Lihat semua transaksi deposit Anda
                    </p>
                  </div>
                </div>
                <button
                  onClick={loadTransactionHistory}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors text-sm font-semibold"
                >
                  <ArrowsClockwise size={16} weight="bold" />
                  Segarkan
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {transactionHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClockCounterClockwise size={40} weight="light" className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada transaksi</h3>
                  <p className="text-gray-600 mb-6">Riwayat deposit Anda akan muncul di sini</p>
                  <button
                    onClick={() => setStep('amount')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-semibold"
                  >
                    <Wallet size={20} weight="bold" />
                    Lakukan Deposit
                  </button>
                </div>
              ) : (
                transactionHistory.map((transaction) => (
                  <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {formatCurrency(transaction.amount)}
                          </h3>
                          <TransactionStatusBadge status={transaction.status} />
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-500">ID Pesanan:</span>
                            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                              {transaction.order_id}
                            </code>
                          </div>
                          {transaction.payment_type && (
                            <div className="flex items-center gap-2">
                              <CreditCard size={16} weight="regular" className="text-gray-400" />
                              <span className="capitalize">{transaction.payment_type.replace('_', ' ')}</span>
                            </div>
                          )}
                          {transaction.voucherCode && (
                            <div className="flex items-center gap-2 text-green-700">
                              <Tag size={16} weight="bold" />
                              <span className="font-medium">
                                {transaction.voucherCode}
                              </span>
                              {transaction.voucherBonusAmount && (
                                <span className="text-xs bg-green-100 px-2 py-0.5 rounded">
                                  +{formatCurrency(transaction.voucherBonusAmount)} bonus
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm text-gray-500 mb-1">
                          {formatDate(transaction.createdAt)}
                        </div>
                        {transaction.completedAt && (
                          <div className="text-xs text-gray-400">
                            Selesai: {formatDate(transaction.completedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form deposit utama
  if (step === 'amount') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* KOLOM KIRI - Form */}
            <div className="space-y-5">
              {/* Kartu Input Jumlah */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
                <div className="mb-5">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Top Up Saldo</h1>
                </div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Jumlah
                </label>
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={amount ? parseInt(amount).toLocaleString('id-ID') : ''}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                </div>
                {/* Quick Amount - 6 opsi untuk tampilan yang rapi */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                  {quickAmounts.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleQuickAmount(preset.value)}
                      className={`py-3 px-3 rounded-lg border-2 font-semibold transition-all text-sm sm:text-base ${
                        parseInt(amount) === preset.value
                          ? 'bg-sky-600 border-sky-600 text-white shadow-md'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-sky-400 hover:bg-sky-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Minimal: Rp 100.000 • Maksimal: Rp 10.000.000
                </p>
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <WarningCircle size={20} weight="bold" className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}
              </div>

              {/* Bagian Voucher */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
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

              {/* Tombol CTA - Mobile: 1 baris, Desktop: 2 tombol */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !amount || parseInt(amount) < 10000}
                  className="flex-1 bg-gradient-to-r from-sky-400 to-blue-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-sky-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
                </button>
                {/* History button - hidden di mobile, visible di desktop */}
                <button
                  onClick={handleViewHistory}
                  className="hidden sm:flex sm:w-auto px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all items-center justify-center gap-2"
                >
                  <ClockCounterClockwise size={20} weight="bold" />
                  Riwayat
                </button>
              </div>
            </div>

            {/* KOLOM KANAN - Ringkasan */}
            <div className="lg:sticky lg:top-8 h-fit">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-l from-sky-50 to-blue-100 p-4 sm:p-5">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    Ringkasan Pembayaran
                  </h3>
                </div>
                <div className="p-5 sm:p-6">
                  {numericAmount >= 10000 ? (
                    <>
                      <div className="space-y-4 mb-6">
                        {/* Jumlah Deposit */}
                        <div className="flex justify-between items-center text-base">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                              <Money size={16} weight="bold" className="text-sky-600" />
                            </div>
                            <span className="text-gray-700 font-semibold">Jumlah Deposit</span>
                          </div>
                          <span className="font-bold text-gray-900">{formatCurrency(numericAmount)}</span>
                        </div>
                        
                        {/* ✅ TAMPILAN BONUS VOUCHER - Disorot dengan desain profesional */}
                        {voucherBonus > 0 && (
                          <div className="flex justify-between items-center text-base bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border-2 border-green-200">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Gift size={16} weight="bold" className="text-green-600" />
                              </div>
                              <span className="text-green-700 font-semibold flex items-center gap-1.5">
                                Bonus Voucher
                              </span>
                            </div>
                            <span className="font-bold text-green-700">+{formatCurrency(voucherBonus)}</span>
                          </div>
                        )}
                      </div>

                      {/* Total Amount - Lebih menonjol */}
                      <div className="pt-4 border-t-2 border-gray-200 mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-base font-semibold text-gray-600">Total yang Diterima</span>
                        </div>
                        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-2xl p-5 border-2 border-sky-200">
                          <div className="text-center">
                            <div className="text-sm text-sky-600 font-semibold mb-2">Anda Akan Menerima</div>
                            <div className="text-3xl font-black bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                              {formatCurrency(totalAmount)}
                            </div>
                          </div>
                          {/* ✅ INFO RINCIAN - Opsional tapi membantu */}
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
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet size={32} weight="light" className="text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Masukkan jumlah untuk melihat ringkasan</p>
                      <p className="text-xs text-gray-400 mt-1">Minimal: Rp 100.000</p>
                    </div>
                  )}

{/* Keamanan Pembayaran */}
<div className="mt-6 pt-6 border-t border-gray-200">
  <div className="flex items-center gap-3 bg-gradient-to-l from-emerald-500/20 to-transparent rounded-xl p-4">
    <div className="flex-shrink-0">
      <Image
        src="/pci.png"
        alt="Payment Secure"
        width={80}
        height={80}
        className="object-contain p-2 rounded-xl"
      />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-gray-900 text-sm mb-1">Pembayaran Aman</h4>
      <p className="text-xs text-gray-600 leading-relaxed">
        Level keamanan tambahan untuk pembayaran. Informasi pembayaran Anda 
        dienkripsi dan aman. Proteksi SSL 2048 bit robust
      </p>
    </div>
  </div>
</div>

                  {/* Metode Pembayaran */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-700">Metode Pembayaran</p>
                      <List size={14} weight="bold" className="text-gray-400" />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {paymentMethods.map((method, index) => (
                        <div 
                          key={index} 
                          className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-center hover:border-sky-300 transition-colors group"
                        >
                          <Image
                            src={method.icon}
                            alt={method.name}
                            width={48}
                            height={32}
                            className="object-contain group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">+ Lebih banyak opsi tersedia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layar pemrosesan pembayaran
  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center border border-gray-200">
          <SpinnerGap size={64} weight="bold" className="text-sky-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Memproses Pembayaran</h2>
          <p className="text-gray-600 mb-6">
            Silakan selesaikan pembayaran di jendela popup
          </p>
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <p className="text-sm text-sky-800">
              Jika popup tidak muncul, periksa apakah diblokir oleh browser Anda
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Layar sukses
  if (step === 'success') {
    const expectedAmount = currentTransaction?.amount || 0;
    const totalWithBonus = expectedAmount + voucherBonus;
    const balanceIncrease = currentBalance - initialBalance;
    const verificationElapsed = verificationStartTime ? (Date.now() - verificationStartTime) / 1000 : 0;
    const remainingTime = Math.max(0, 600 - verificationElapsed);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full border border-gray-200">
          <div className="p-8 sm:p-10">
            <div className="text-center">
              {paymentStatus === 'verifying' && (
                <>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <SpinnerGap size={48} weight="bold" className="text-amber-600 animate-spin" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Menunggu Pembayaran
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Selesaikan pembayaran Anda dan kami akan mendeteksinya secara otomatis
                  </p>
                  <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border-2 border-sky-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-sky-900">Saldo Saat Ini</span>
                      <button
                        onClick={handleRefreshBalance}
                        disabled={loading}
                        className="p-2 hover:bg-sky-100 rounded-lg transition-all disabled:opacity-50"
                        title="Segarkan saldo"
                      >
                        <ArrowsClockwise size={16} weight="bold" className={`text-sky-600 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="text-3xl font-bold text-sky-700 mb-4">
                      {formatCurrency(currentBalance)}
                    </div>
                    {balanceIncrease > 0 && (
                      <div className="bg-white/60 rounded-lg p-3 mb-3">
                        <div className="text-sm text-sky-800 flex items-center justify-between">
                          <span>Kenaikan terdeteksi:</span>
                          <strong className="text-green-700">+{formatCurrency(balanceIncrease)}</strong>
                        </div>
                        {balanceIncrease < expectedAmount && (
                          <div className="text-xs text-amber-700 mt-2">
                            ⏳ Pembayaran sebagian • Menunggu jumlah penuh...
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-2 text-sm text-sky-900">
                      <div className="flex justify-between">
                        <span>Diharapkan:</span>
                        <strong>{formatCurrency(expectedAmount)}</strong>
                      </div>
                      {voucherBonus > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span className="flex items-center gap-1">
                            <Tag size={14} weight="bold" />
                            Bonus:
                          </span>
                          <strong>+{formatCurrency(voucherBonus)}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-5 mb-6">
                    <div className="flex items-start gap-3 text-left">
                      <Info size={20} weight="bold" className="text-amber-700 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-900">
                        <p className="font-semibold mb-2">Belum bayar?</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Selesaikan pembayaran via aplikasi perbankan Anda</li>
                          <li>• Kami memantau saldo Anda secara real-time</li>
                          <li>• Status akan otomatis terupdate saat pembayaran diterima</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Clock size={16} weight="bold" />
                      <span>Memeriksa otomatis setiap 2 detik</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Batas waktu: {Math.floor(remainingTime / 60)}:{String(Math.floor(remainingTime % 60)).padStart(2, '0')}
                    </div>
                    {lastBalanceCheck > 0 && (
                      <div className="text-xs text-gray-400">
                        Terakhir diperiksa: {new Date(lastBalanceCheck).toLocaleTimeString('id-ID')}
                      </div>
                    )}
                  </div>
                </>
              )}
              {paymentStatus === 'success' && (
                <>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} weight="fill" className="text-green-600" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Pembayaran Berhasil!
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Saldo Anda telah diperbarui
                  </p>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 mb-6">
                    <div className="text-sm text-green-900 mb-2">Saldo Baru</div>
                    <div className="text-4xl font-bold text-green-700 mb-4">
                      {formatCurrency(currentBalance)}
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="flex justify-between text-sm text-green-800 mb-1">
                        <span>Jumlah ditambahkan:</span>
                        <strong>+{formatCurrency(expectedAmount)}</strong>
                      </div>
                      {voucherBonus > 0 && (
                        <div className="flex justify-between text-sm text-green-800">
                          <span className="flex items-center gap-1">
                            <Tag size={14} weight="bold" />
                            Bonus voucher:
                          </span>
                          <strong>+{formatCurrency(voucherBonus)}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleBackToHome}
                    className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-sky-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Selesai
                  </button>
                </>
              )}
              {paymentStatus === 'expired' && (
                <>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <X size={48} weight="bold" className="text-gray-500" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Waktu Verifikasi Habis
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Kami tidak dapat mendeteksi pembayaran Anda. Periksa riwayat transaksi atau coba lagi.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleViewHistory}
                      className="w-full bg-gray-200 text-gray-800 py-4 px-6 rounded-xl font-bold text-lg hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                    >
                      <ClockCounterClockwise size={20} weight="bold" />
                      Lihat Riwayat
                    </button>
                    <button
                      onClick={handleBackToHome}
                      className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-sky-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MidtransPaymentPage;